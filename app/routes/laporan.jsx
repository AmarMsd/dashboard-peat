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
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
              statusBadge[val] || "bg-slate-100 text-slate-700 border-slate-200"
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
      render: (val) => <span className="text-[11px] text-slate-500">{val || "Baru saja"}</span>,
    },
  ];

  return (
    <DashboardFrame active="Laporan">
      <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
        {/* Title + export button */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">Laporan Pemantauan Ekosistem Gambut</h1>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Rangkuman komprehensif kondisi fisik tanah dan audit log transmisi sensor
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportHistoryCSV}
              className="cursor-pointer inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Ekspor Data Lengkap (CSV)
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-5 grid gap-3.5 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-blue-600 bg-white p-3.5 sm:p-4 shadow-2xs">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Titik Sensor Terhubung</p>
            <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{sensors.length}</p>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-slate-500">stasiun pemantauan</p>
          </article>
          <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-emerald-600 bg-white p-3.5 sm:p-4 shadow-2xs">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kelembapan & pH Rata-rata</p>
            <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
              {averageMoisture}<span className="text-base font-normal text-slate-500">%</span>
              <span className="text-lg font-bold text-teal-600 ml-1.5">/ {averagePh} pH</span>
            </p>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-emerald-600">dari seluruh titik pengukuran</p>
          </article>
          <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-amber-500 bg-white p-3.5 sm:p-4 shadow-2xs">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Titik Perlu Perhatian Khusus</p>
            <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{needCheck}</p>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-amber-600">
              {needCheck > 0 ? "membutuhkan tindakan pencegahan" : "seluruh area dalam batas aman"}
            </p>
          </article>
        </div>

        {/* Summary note */}
        <section className="mb-5 rounded-lg border border-slate-200/90 bg-white p-4 sm:p-4.5 shadow-2xs">
          <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">Kesimpulan Lapangan</h2>
          <p className="m-0 mt-2 max-w-3xl text-xs sm:text-[13px] leading-relaxed text-slate-600">
            Berdasarkan rekaman {historicalRecords.length} sampel telemetri realtime terakhir, fluktuasi kelembapan tanah masih dipengaruhi oleh siklus penyinaran harian. {needCheck > 0 ? `Terdapat ${needCheck} titik yang terdeteksi mendekati ambang kering, disarankan patroli pengecekan sekat kanal (canal blocking) di area tersebut.` : "Semua stasiun mencatat hidrasi gambut yang memadai."}
          </p>
        </section>

        {/* Sensor list table using DataTables */}
        <section className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-2xs">
          <div className="border-b border-slate-200/80 px-4.5 py-3 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">Daftar Titik Sensor Realtime</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">
                Pencarian, pengurutan, dan navigasi data stasiun pantau secara interaktif
              </p>
            </div>
            <a href="/riwayat" className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline">
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
