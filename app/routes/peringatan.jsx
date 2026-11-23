import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { useSensorData } from "../context/SensorContext";

const alertConfig = {
  warning: {
    instruction: "Kondisi lahan mulai mengering. Aktifkan sekat kanal atau siapkan pembasahan berkala.",
    borderColor: "border-amber-400",
    badge: "bg-amber-100 text-amber-700",
    badgeLabel: "Waspada / Perlu Dicek",
  },
  critical: {
    instruction: "Kelembapan sangat rendah atau suhu tanah tinggi! Segera lakukan inspeksi lapangan untuk mencegah kebakaran gambut.",
    borderColor: "border-red-500",
    badge: "bg-red-100 text-red-700",
    badgeLabel: "Bahaya / Kritis",
  },
};

export function meta() {
  return [{ title: "Peringatan - PeatGuard" }];
}

export default function AlertPage() {
  const { sensors } = useSensorData();
  const alerts = sensors.filter((sensor) => sensor.status !== "normal");

  return (
    <DashboardFrame active="Peringatan">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Title */}
        <div className="mb-6 flex items-center gap-3">
          <h1 className="m-0 text-xl font-semibold text-gray-800">Status Peringatan Dini Lahan</h1>
          {alerts.length > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-600">
              {alerts.length} titik perlu perhatian
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
              <p className="m-0 font-semibold text-green-800">Semua titik pantau terpantau aman</p>
              <p className="m-0 mt-0.5 text-sm text-green-700">Kadar kelembapan tanah cukup tinggi dan suhu berada pada batas wajar.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((sensor) => {
              const cfg = alertConfig[sensor.status] || alertConfig.warning;
              return (
                <article
                  className={`rounded-xl border-l-4 ${cfg.borderColor} bg-white p-5 shadow-sm border border-gray-100`}
                  key={sensor.id}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="m-0 text-base font-semibold text-gray-800">{sensor.name}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                          {cfg.badgeLabel}
                        </span>
                      </div>
                      <p className="m-0 mt-1 text-xs text-gray-500">{sensor.region}</p>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{sensor.id}</span>
                  </div>

                  {/* Metrics */}
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="m-0 text-xs text-gray-500">Kelembapan</p>
                      <p className={`m-0 mt-0.5 text-xl font-bold ${sensor.moisture < 40 ? "text-red-600" : "text-amber-600"}`}>
                        {sensor.moisture}%
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-xs text-gray-500">pH Tanah</p>
                      <p className="m-0 mt-0.5 text-xl font-bold text-gray-800">{sensor.ph ?? 4.2}</p>
                    </div>
                    <div>
                      <p className="m-0 text-xs text-gray-500">Suhu Tanah</p>
                      <p className={`m-0 mt-0.5 text-xl font-bold ${sensor.temperature >= 34 ? "text-red-600" : "text-gray-800"}`}>
                        {sensor.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-xs text-gray-500">Terakhir Dibaca</p>
                      <p className="m-0 mt-0.5 text-sm font-medium text-gray-600">{sensor.lastReading || "Realtime"}</p>
                    </div>
                  </div>

                  {/* Instruction */}
                  <div className="mt-4 border-t border-gray-100 pt-3 flex items-center justify-between text-xs">
                    <p className="m-0 text-gray-600">
                      <strong>Rekomendasi Tindakan:</strong> {cfg.instruction}
                    </p>
                    <a href="/riwayat" className="cursor-pointer shrink-0 text-blue-600 hover:underline">
                      Lihat tren riwayat →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </DashboardFrame>
  );
}
