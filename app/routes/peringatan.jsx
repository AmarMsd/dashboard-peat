import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { useSensorData } from "../context/SensorContext";

const alertConfig = {
  warning: {
    instruction: "Kondisi lahan mulai mengering. Aktifkan sekat kanal atau siapkan pembasahan berkala.",
    borderColor: "border-l-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    badgeLabel: "Waspada / Perlu Dicek",
  },
  critical: {
    instruction: "Kelembapan sangat rendah atau suhu tanah tinggi! Segera lakukan inspeksi lapangan untuk mencegah kebakaran gambut.",
    borderColor: "border-l-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
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
      <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
        {/* Title */}
        <div className="mb-5 flex items-center gap-3">
          <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">Status Peringatan Dini Lahan</h1>
          {alerts.length > 0 && (
            <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
              {alerts.length} titik perlu perhatian
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 shadow-2xs">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-100 text-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <div>
              <p className="m-0 text-xs font-bold text-emerald-900">Semua titik pantau terpantau aman</p>
              <p className="m-0 mt-0.5 text-xs text-emerald-700">Kadar kelembapan tanah cukup tinggi dan suhu berada pada batas wajar.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {alerts.map((sensor) => {
              const cfg = alertConfig[sensor.status] || alertConfig.warning;
              return (
                <article
                  className={`rounded-lg border border-slate-200/90 border-l-[3px] ${cfg.borderColor} bg-white p-4 shadow-2xs`}
                  key={sensor.id}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">{sensor.name}</h2>
                        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                          {cfg.badgeLabel}
                        </span>
                      </div>
                      <p className="m-0 mt-0.5 text-xs text-slate-500">{sensor.region}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{sensor.id}</span>
                  </div>

                  {/* Metrics */}
                  <div className="mt-3.5 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kelembapan</p>
                      <p className={`m-0 mt-0.5 text-lg font-bold tracking-tight ${sensor.moisture < 40 ? "text-rose-600" : "text-amber-600"}`}>
                        {sensor.moisture}%
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">pH Tanah</p>
                      <p className="m-0 mt-0.5 text-lg font-bold tracking-tight text-slate-800">{sensor.ph ?? 4.2}</p>
                    </div>
                    <div>
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Suhu Tanah</p>
                      <p className={`m-0 mt-0.5 text-lg font-bold tracking-tight ${sensor.temperature >= 34 ? "text-rose-600" : "text-slate-800"}`}>
                        {sensor.temperature}°C
                      </p>
                    </div>
                    <div>
                      <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Terakhir Dibaca</p>
                      <p className="m-0 mt-0.5 text-xs font-medium text-slate-600">{sensor.lastReading || "Realtime"}</p>
                    </div>
                  </div>

                  {/* Instruction */}
                  <div className="mt-3.5 border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                    <p className="m-0 text-slate-600">
                      <strong className="text-slate-800">Rekomendasi Tindakan:</strong> {cfg.instruction}
                    </p>
                    <a href="/riwayat" className="cursor-pointer shrink-0 font-semibold text-blue-600 hover:underline">
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
