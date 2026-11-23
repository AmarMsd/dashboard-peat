import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { useSensorData } from "../context/SensorContext";

const statusBadge = {
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
  normal: "Aman",
  warning: "Waspada",
  critical: "Bahaya",
};

export function meta() {
  return [{ title: "Laporan - PeatGuard" }];
}

export default function ReportPage() {
  const { sensors, exportHistoryCSV, historicalRecords } = useSensorData();

  const averageMoisture = Math.round(
    sensors.reduce((sum, s) => sum + (Number(s.moisture) || 0), 0) / (sensors.length || 1)
  );
  const averagePh = (
    sensors.reduce((sum, s) => sum + (Number(s.ph) || 0), 0) / (sensors.length || 1)
  ).toFixed(1);
  const needCheck = sensors.filter((s) => s.status !== "normal").length;

  const reportColumns = [
    {
      key: "name",
      label: "Titik Sensor",
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="block font-semibold text-gray-800">{val}</span>
          <span className="block text-[11px] font-mono text-gray-400">
            {row.id}
            {row.lat && row.lng ? ` · (${Number(row.lat).toFixed(3)}, ${Number(row.lng).toFixed(3)})` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "region",
      label: "Wilayah / Pos Pantau",
      sortable: true,
      render: (val) => <span className="text-gray-600 text-xs">{val || "-"}</span>,
    },
    {
      key: "moisture",
      label: "Kelembapan",
      sortable: true,
      render: (val) => {
        const num = Number(val);
        const color = num < 40 ? "text-rose-600" : num < 60 ? "text-amber-600" : "text-emerald-700";
        return <span className={`font-bold ${color}`}>{val}%</span>;
      },
    },
    {
      key: "ph",
      label: "pH Tanah",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-gray-800">{val ?? 4.2} pH</span>
      ),
    },
    {
      key: "temperature",
      label: "Suhu Tanah",
      sortable: true,
      render: (val) => {
        const num = Number(val);
        const color = num >= 35 ? "text-rose-600" : num >= 32 ? "text-amber-600" : "text-gray-800";
        return <span className={`font-semibold ${color}`}>{val}°C</span>;
      },
    },
    {
      key: "status",
      label: "Status Evaluasi",
      sortable: true,
      render: (val) => {
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
              statusBadge[val] || "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                val === "critical"
                  ? "bg-rose-500 animate-pulse"
                  : val === "warning"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            {statusLabels[val] || val}
          </span>
        );
      },
    },
    {
      key: "lastReading",
      label: "Transmisi Terakhir",
      sortable: true,
      render: (val) => <span className="text-[11px] text-gray-500">{val || "Baru saja"}</span>,
    },
  ];

  return (
    <DashboardFrame active="Laporan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title + export button */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-semibold text-gray-800">Laporan Pemantauan Ekosistem Gambut</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Rangkuman komprehensif kondisi fisik tanah dan audit log transmisi sensor
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportHistoryCSV}
              className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
              type="button"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Ekspor Data Lengkap (CSV)
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border-l-4 border-blue-500 bg-white p-5 shadow-sm border border-gray-100">
            <p className="m-0 text-xs text-gray-500">Titik Sensor Terhubung</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">{sensors.length}</p>
            <p className="m-0 mt-1 text-xs text-gray-400">stasiun pemantauan</p>
          </article>
          <article className="rounded-xl border-l-4 border-green-500 bg-white p-5 shadow-sm border border-gray-100">
            <p className="m-0 text-xs text-gray-500">Kelembapan & pH Rata-rata</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">
              {averageMoisture}<span className="text-xl font-normal text-gray-500">%</span>
              <span className="text-2xl font-semibold text-teal-600 ml-2">/ {averagePh} pH</span>
            </p>
            <p className="m-0 mt-1 text-xs text-green-600">dari seluruh titik pengukuran</p>
          </article>
          <article className="rounded-xl border-l-4 border-amber-500 bg-white p-5 shadow-sm border border-gray-100">
            <p className="m-0 text-xs text-gray-500">Titik Perlu Perhatian Khusus</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">{needCheck}</p>
            <p className="m-0 mt-1 text-xs text-amber-600">
              {needCheck > 0 ? "membutuhkan tindakan pencegahan" : "seluruh area dalam batas aman"}
            </p>
          </article>
        </div>

        {/* Summary note */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <h2 className="m-0 text-sm font-semibold text-gray-800">Kesimpulan Lapangan</h2>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Berdasarkan rekaman {historicalRecords.length} sampel telemetri realtime terakhir, fluktuasi kelembapan tanah masih dipengaruhi oleh siklus penyinaran harian. {needCheck > 0 ? `Terdapat ${needCheck} titik yang terdeteksi mendekati ambang kering, disarankan patroli pengecekan sekat kanal (canal blocking) di area tersebut.` : "Semua stasiun mencatat hidrasi gambut yang memadai."}
          </p>
        </section>

        {/* Sensor list table using DataTables */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-800">Daftar Titik Sensor Realtime</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-500">
                Pencarian, pengurutan, dan navigasi data stasiun pantau secara interaktif
              </p>
            </div>
            <a href="/riwayat" className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
              Buka Riwayat Runtut Waktu →
            </a>
          </div>

          <DataTable
            columns={reportColumns}
            data={sensors}
            searchPlaceholder="Cari stasiun, wilayah, status..."
            defaultSortKey="name"
            defaultSortDir="asc"
            pageSizeOptions={[5, 10, 25]}
            initialPageSize={5}
            emptyMessage="Belum ada data stasiun sensor terhubung."
          />
        </section>
      </main>
    </DashboardFrame>
  );
}
