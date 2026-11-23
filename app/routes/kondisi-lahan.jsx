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
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
            statusBadge[val] || "bg-gray-100 text-gray-600"
          }`}
        >
          {statusLabels[val] || val}
        </span>
      ),
    },
  ];

  return (
    <DashboardFrame active="Kondisi Lahan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-semibold text-gray-800">Kondisi Fisik & Kimia Lahan Gambut</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Parameter realtime kelembapan, derajat keasaman (pH), dan suhu dari setiap stasiun sensor
            </p>
          </div>
          <a
            href="/riwayat"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
          >
            Lihat Grafik Riwayat →
          </a>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {readings.map((reading) => {
            const average =
              Math.round(
                (sensors.reduce((sum, s) => sum + (Number(s[reading.key]) || 0), 0) / (sensors.length || 1)) * 10
              ) / 10;
            return (
              <article
                className={`rounded-xl border-l-4 ${reading.borderColor} bg-white p-5 shadow-sm`}
                key={reading.key}
              >
                <p className="m-0 text-xs text-gray-500">{reading.label}</p>
                <p className="m-0 mt-3 text-4xl font-bold text-gray-800">
                  {average}
                  <span className="text-xl font-normal text-gray-500">{reading.unit}</span>
                </p>
                <p className="m-0 mt-1 text-xs text-gray-400">Rata-rata dari {sensors.length} titik pantau</p>
                <p className="m-0 mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
                  {reading.description}
                </p>
              </article>
            );
          })}
        </div>

        {/* Table Section using DataTable */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-800">Tabel Rincian Tiap Titik Pemantauan</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-500">Tabel data dilengkapi pencarian instan dan pengurutan kolom</p>
            </div>
            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
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
