import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { useSensorData } from "../context/SensorContext";

const readings = [
  { label: "Kelembapan Tanah", key: "moisture", unit: "%", description: "Indikator utama keterbasahan lahan gambut.", borderColor: "border-blue-500" },
  { label: "Derajat Keasaman (pH)", key: "ph", unit: " pH", description: "Tingkat keasaman tanah gambut (alami 3.5 - 5.0).", borderColor: "border-teal-500" },
  { label: "Suhu Tanah", key: "temperature", unit: "°C", description: "Suhu lapisan gambut, waspada jika di atas 34°C.", borderColor: "border-amber-500" },
];

const statusBadge = {
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
  normal: "Aman",
  warning: "Perlu Dicek",
  critical: "Bahaya",
};

export function meta() {
  return [{ title: "Kondisi Lahan - PeatGuard" }];
}

export default function LandConditionPage() {
  const { sensors } = useSensorData();

  const columns = [
    {
      key: "name",
      label: "Titik Sensor",
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-gray-800">{val}</span>
          <span className="block text-xs text-gray-400 font-mono">{row.id} · {row.region}</span>
        </div>
      ),
    },
    {
      key: "moisture",
      label: "Kelembapan",
      sortable: true,
      render: (val) => <span className="font-bold text-gray-800">{val}%</span>,
    },
    {
      key: "ph",
      label: "pH Tanah",
      sortable: true,
      render: (val) => <span className="font-bold text-gray-800">{val ?? 4.2}</span>,
    },
    {
      key: "temperature",
      label: "Suhu Tanah",
      sortable: true,
      render: (val) => <span className="font-bold text-gray-800">{val}°C</span>,
    },
    {
      key: "waterLevel",
      label: "Ketinggian Air",
      sortable: true,
      render: (val) => <span className="text-gray-700">{val ?? 35} cm</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      align: "center",
      headerAlign: "center",
      render: (val) => (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
            statusBadge[val] || "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {statusLabels[val] || val}
        </span>
      ),
    },
  ];

  return (
    <DashboardFrame active="Kondisi Lahan">
      <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
        {/* Title */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">Kondisi Fisik & Kimia Lahan Gambut</h1>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Parameter realtime kelembapan, derajat keasaman (pH), dan suhu dari setiap stasiun sensor
            </p>
          </div>
          <a
            href="/riwayat"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Lihat Grafik Riwayat →
          </a>
        </div>

        {/* Stat cards */}
        <div className="mb-5 grid gap-3.5 lg:grid-cols-3">
          {readings.map((reading) => {
            const average =
              Math.round(
                (sensors.reduce((sum, s) => sum + (Number(s[reading.key]) || 0), 0) / (sensors.length || 1)) * 10
              ) / 10;
            return (
              <article
                className={`rounded-lg border border-slate-200/90 border-l-[3px] ${reading.borderColor} bg-white p-4 shadow-2xs`}
                key={reading.key}
              >
                <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{reading.label}</p>
                <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
                  {average}
                  <span className="text-base font-normal text-slate-500 ml-1">{reading.unit}</span>
                </p>
                <p className="m-0 mt-0.5 text-[11px] font-medium text-slate-400">Rata-rata dari {sensors.length} titik pantau</p>
                <p className="m-0 mt-3 border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-500">
                  {reading.description}
                </p>
              </article>
            );
          })}
        </div>

        {/* Table Section using DataTable */}
        <section className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-2xs">
          <div className="border-b border-slate-200/80 px-4.5 py-3 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">Tabel Rincian Tiap Titik Pemantauan</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">Tabel data dilengkapi pencarian instan dan pengurutan kolom</p>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
              Realtime Sync
            </span>
          </div>
          <DataTable
            columns={columns}
            data={sensors}
            searchPlaceholder="Cari nama sensor, wilayah..."
            defaultSortKey="name"
            defaultSortDir="asc"
            pageSizeOptions={[5, 10, 25]}
            initialPageSize={10}
          />
        </section>
      </main>
    </DashboardFrame>
  );
}
