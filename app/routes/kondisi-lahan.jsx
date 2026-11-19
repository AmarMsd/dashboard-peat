import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { sensors } from "../data/sensors";

const readings = [
  { label: "Kelembapan Tanah", key: "moisture", unit: "%", description: "Rata-rata dari semua titik pemantauan.", borderColor: "border-blue-500" },
  { label: "Suhu Udara", key: "temperature", unit: "°C", description: "Suhu yang tercatat di sekitar alat.", borderColor: "border-amber-500" },
  { label: "Ketinggian Air", key: "waterLevel", unit: " cm", description: "Jarak permukaan air dari titik ukur.", borderColor: "border-green-500" },
];

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
  return [{ title: "Kondisi Lahan - PeatGuard" }];
}

export default function LandConditionPage() {
  return (
    <DashboardFrame active="Kondisi Lahan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title */}
        <div className="mb-6">
          <h1 className="m-0 text-xl font-semibold text-gray-800">Kondisi Lahan</h1>
          <p className="m-0 mt-1 text-sm text-gray-500">Data dari semua titik pemantauan</p>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          {readings.map((reading) => {
            const average =
              Math.round(
                (sensors.reduce((sum, s) => sum + s[reading.key], 0) / sensors.length) * 10
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
                <p className="m-0 mt-1 text-xs text-gray-400">Rata-rata semua lokasi</p>
                <p className="m-0 mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
                  {reading.description}
                </p>
              </article>
            );
          })}
        </div>

        {/* Table */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="m-0 text-sm font-semibold text-gray-800">Kondisi Setiap Lokasi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-100 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Lokasi</th>
                  <th className="px-5 py-3 font-medium">Kelembapan</th>
                  <th className="px-5 py-3 font-medium">Suhu</th>
                  <th className="px-5 py-3 font-medium">Ketinggian Air</th>
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
                      <span className="text-xs text-gray-400">{sensor.region}</span>
                    </td>
                    <td className="px-5 py-4">{sensor.moisture}%</td>
                    <td className="px-5 py-4">{sensor.temperature}°C</td>
                    <td className="px-5 py-4">{sensor.waterLevel} cm</td>
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
