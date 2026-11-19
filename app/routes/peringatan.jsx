import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { sensors } from "../data/sensors";

const alertConfig = {
  warning: {
    instruction: "Periksa saluran air dan lakukan pemantauan lebih sering.",
    borderColor: "border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    badgeLabel: "Perlu Dicek",
  },
  critical: {
    instruction: "Segera lakukan pemeriksaan lapangan untuk mencegah kebakaran.",
    borderColor: "border-red-500",
    badge: "bg-red-100 text-red-700",
    badgeLabel: "Bahaya",
  },
};

export function meta() {
  return [{ title: "Peringatan - PeatGuard" }];
}

export default function AlertPage() {
  const alerts = sensors.filter((sensor) => sensor.status !== "normal");

  return (
    <DashboardFrame active="Peringatan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="m-0 text-xl font-semibold text-gray-800">Peringatan</h1>
          {alerts.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-600">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-4 rounded-xl border border-green-200 bg-green-50 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green-100 text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <div>
              <p className="m-0 font-semibold text-green-700">Semua lokasi aman</p>
              <p className="m-0 mt-0.5 text-sm text-green-600">Tidak ada sensor yang membutuhkan perhatian saat ini.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((sensor) => {
              const cfg = alertConfig[sensor.status];
              return (
                <article
                  className={`rounded-xl border-l-4 ${cfg.borderColor} bg-white p-5 shadow-sm`}
                  key={sensor.id}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="m-0 text-sm font-semibold text-gray-800">{sensor.name}</h2>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                          {cfg.badgeLabel}
                        </span>
                      </div>
                      <p className="m-0 mt-1 text-xs text-gray-500">{sensor.region}</p>
                    </div>
                    <span className="text-xs text-gray-400">{sensor.id}</span>
                  </div>

                  {/* Metrics */}
                  <div className="mt-4 flex gap-6">
                    {[
                      ["Kelembapan", `${sensor.moisture}%`],
                      ["Suhu", `${sensor.temperature}°C`],
                      ["Ketinggian Air", `${sensor.waterLevel} cm`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="m-0 text-xs text-gray-500">{label}</p>
                        <p className="m-0 mt-0.5 text-lg font-bold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Instruction */}
                  <p className="m-0 mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    {cfg.instruction}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </DashboardFrame>
  );
}
