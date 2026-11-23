import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { useSensorData } from "../context/SensorContext";

const statusBadge = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const statusLabels = {
  normal: "Aman",
  warning: "Perlu Dicek",
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

        {/* Sensor list table */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h2 className="m-0 text-sm font-semibold text-gray-800">Daftar Titik Sensor Realtime</h2>
            <a href="/riwayat" className="cursor-pointer text-xs text-blue-600 hover:underline">
              Buka Riwayat Runtut Waktu →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Titik Sensor</th>
                  <th className="px-5 py-3 font-medium">Wilayah</th>
                  <th className="px-5 py-3 font-medium">Kelembapan</th>
                  <th className="px-5 py-3 font-medium">pH Tanah</th>
                  <th className="px-5 py-3 font-medium">Suhu</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => (
                  <tr
                    className="border-t border-gray-100 text-gray-700 hover:bg-gray-50/80 transition-colors"
                    key={sensor.id}
                  >
                    <td className="px-5 py-4">
                      <span className="block font-medium text-gray-800">{sensor.name}</span>
                      <span className="text-xs text-gray-400">{sensor.id}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{sensor.region}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{sensor.moisture}%</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{sensor.ph ?? 4.2}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{sensor.temperature}°C</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[sensor.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabels[sensor.status] || sensor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </DashboardFrame>
  );
}
