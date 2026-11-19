import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { sensors } from "../data/sensors";

const statusBadge = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const statusLabels = {
  normal: "Baik",
  warning: "Perlu Dicek",
  critical: "Bahaya",
};

export function meta() {
  return [{ title: "Laporan - PeatGuard" }];
}

export default function ReportPage() {
  const averageMoisture = Math.round(
    sensors.reduce((sum, s) => sum + s.moisture, 0) / sensors.length
  );
  const needCheck = sensors.filter((s) => s.status !== "normal").length;

  return (
    <DashboardFrame active="Laporan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title + export button */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-semibold text-gray-800">Laporan</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">Rangkuman kondisi lahan dari semua titik pemantauan</p>
          </div>
          <button
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            type="button"
          >
            Ekspor Laporan
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border-l-4 border-blue-500 bg-white p-5 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Lokasi Dipantau</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">{sensors.length}</p>
            <p className="m-0 mt-1 text-xs text-gray-400">titik aktif</p>
          </article>
          <article className="rounded-xl border-l-4 border-green-500 bg-white p-5 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Kelembapan Rata-rata</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">{averageMoisture}<span className="text-xl font-normal text-gray-500">%</span></p>
            <p className="m-0 mt-1 text-xs text-gray-400">dari seluruh lokasi</p>
          </article>
          <article className="rounded-xl border-l-4 border-amber-500 bg-white p-5 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Lokasi Perlu Dicek</p>
            <p className="m-0 mt-3 text-4xl font-bold text-gray-800">{needCheck}</p>
            <p className="m-0 mt-1 text-xs text-gray-400">butuh perhatian</p>
          </article>
        </div>

        {/* Summary note */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="m-0 text-sm font-semibold text-gray-800">Catatan</h2>
          <p className="m-0 mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Sebagian besar lokasi memiliki kelembapan yang cukup. {needCheck} lokasi perlu diperiksa karena kelembapan tanah dan ketinggian air lebih rendah dari rata-rata. Disarankan untuk melakukan pengecekan lapangan sesegera mungkin.
          </p>
        </section>

        {/* Sensor list table */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="m-0 text-sm font-semibold text-gray-800">Daftar Sensor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Sensor</th>
                  <th className="px-5 py-3 font-medium">Wilayah</th>
                  <th className="px-5 py-3 font-medium">Terakhir Dibaca</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensors.map((sensor) => (
                  <tr
                    className="border-t border-gray-50 text-gray-700 hover:bg-gray-50 transition-colors"
                    key={sensor.id}
                  >
                    <td className="px-5 py-4">
                      <span className="block font-medium text-gray-800">{sensor.name}</span>
                      <span className="text-xs text-gray-400">{sensor.id}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{sensor.region}</td>
                    <td className="px-5 py-4 text-gray-500">{sensor.lastReading}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[sensor.status]}`}>
                        {statusLabels[sensor.status]}
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
