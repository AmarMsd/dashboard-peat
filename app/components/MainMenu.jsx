import { SensorMap } from "./SensorMap";
import { useSensorData } from "../context/SensorContext";

const statusLabels = {
  normal: "Aman",
  warning: "Waspada",
  critical: "Kritis",
};

const statusBadge = {
  normal: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const statusDot = {
  normal: "bg-green-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

function SensorDetail({ sensor }) {
  if (!sensor) return null;
  return (
    <div className="mb-3.5 rounded-lg border border-slate-200/90 border-l-[3px] border-l-[#2563eb] bg-blue-50/40 p-3.5 shadow-2xs">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[11px] font-mono text-slate-500">{sensor.id} · {sensor.region}</p>
          <h3 className="m-0 mt-0.5 text-xs font-bold text-slate-900">{sensor.name}</h3>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-md border border-slate-200/70 bg-white p-2 shadow-2xs">
          <p className="m-0 text-xs font-bold text-slate-900">{sensor.moisture}%</p>
          <p className="m-0 mt-0.5 text-[10px] text-slate-500">Kelembapan</p>
        </div>
        <div className="rounded-md border border-slate-200/70 bg-white p-2 shadow-2xs">
          <p className="m-0 text-xs font-bold text-slate-900">{sensor.ph ?? 4.2} pH</p>
          <p className="m-0 mt-0.5 text-[10px] text-slate-500">Keasaman</p>
        </div>
        <div className="rounded-md border border-slate-200/70 bg-white p-2 shadow-2xs">
          <p className="m-0 text-xs font-bold text-slate-900">{sensor.temperature}°C</p>
          <p className="m-0 mt-0.5 text-[10px] text-slate-500">Suhu Tanah</p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
        <span>Transmisi: {sensor.lastReading || "Aktif"}</span>
        <a href="/riwayat" className="cursor-pointer font-semibold text-blue-600 hover:underline">
          Lihat riwayat →
        </a>
      </div>
    </div>
  );
}

export function MainMenu() {
  const { sensors, selectedSensor, setSelectedSensor, liveTopics, connectionStatus, lastMessageTime } = useSensorData();

  const activeCount = sensors.filter((s) => s.status === "normal").length;
  const warningCount = sensors.filter((s) => s.status !== "normal").length;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
      {/* Page title and quick links */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">Dashboard Pemantauan Gambut</h1>
          <p className="m-0 mt-0.5 text-xs text-slate-500 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/riwayat"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Buka Riwayat Data & Tren
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-[#2563eb] bg-white p-3.5 sm:p-4 shadow-2xs">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Titik Pantau Lapangan</p>
          <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{sensors.length} Stasiun</p>
          <p className="m-0 mt-0.5 text-[11px] font-medium text-blue-600">9 topik telemetri realtime aktif</p>
        </article>
        <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-emerald-600 bg-white p-3.5 sm:p-4 shadow-2xs">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kondisi Gambut Aman</p>
          <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{activeCount}</p>
          <p className="m-0 mt-0.5 text-[11px] font-medium text-emerald-600">terhidrasi dengan baik</p>
        </article>
        <article className="rounded-lg border border-slate-200/90 border-l-[3px] border-l-amber-500 bg-white p-3.5 sm:p-4 shadow-2xs col-span-2 md:col-span-1">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Perlu Perhatian</p>
          <p className="m-0 mt-1.5 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">{warningCount}</p>
          <p className="m-0 mt-0.5 text-[11px] font-medium text-amber-600">rawan kering / suhu tinggi</p>
        </article>
      </div>

      {/* Map + List */}
      <div className="grid gap-4.5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Map card */}
        <section className="overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/90">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4.5 py-3">
            <div>
              <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">Peta Sebaran Titik Pantau</h2>
              <p className="m-0 mt-0.5 text-xs text-slate-500">Pilih titik sensor untuk memantau kondisi di lapangan</p>
            </div>
            <div className="flex gap-2.5 text-[10px] font-medium text-slate-500">
              {Object.entries(statusLabels).map(([status, label]) => (
                <span className="flex items-center gap-1" key={status}>
                  <span className={`size-2 rounded-full ${statusDot[status]}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[420px]">
            <SensorMap sensors={sensors} onSelect={(s) => setSelectedSensor(s)} />
          </div>
        </section>

        {/* Sensor list card */}
        <aside className="rounded-lg bg-white p-4 shadow-2xs border border-slate-200/90">
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">Status Titik Lapangan</h2>
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {sensors.length} titik
            </span>
          </div>

          {/* Selected sensor detail */}
          <SensorDetail sensor={selectedSensor} />

          {/* Sensor list */}
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daftar Titik Pemantauan</p>
          <div className="space-y-1">
            {sensors.map((sensor) => (
              <button
                className={`cursor-pointer flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                  selectedSensor?.id === sensor.id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
                type="button"
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
              >
                <span className={`size-2 shrink-0 rounded-full ${statusDot[sensor.status] || "bg-slate-300"}`} />
                <span className="min-w-0 flex-1 truncate text-xs">{sensor.name}</span>
                <span className="shrink-0 text-[10px] font-mono text-slate-400">{sensor.id}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Realtime 9-Topics Telemetry Feed Section */}
      <section className="mt-5 rounded-lg bg-white p-4.5 sm:p-5 shadow-2xs border border-slate-200/90">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">
              Telemetri Data Realtime (9 Topik)
            </h2>
            <p className="m-0 mt-0.5 text-xs text-slate-500">
              Setiap Titik Pantau menggabungkan 3 parameter spesifik (Kelembapan, pH, dan Suhu) dari transmisi MQTT.
            </p>
          </div>
        </div>

        {/* 3 Columns Grouped by Node Station */}
        <div className="grid gap-3.5 md:grid-cols-3">
          {[1, 2, 3].map((nodeIdx) => {
            const station = sensors.find((s) => s.nodeIndex === nodeIdx) || sensors[nodeIdx - 1];
            const nodeTopics = (liveTopics || []).filter((t) => t.nodeIndex === nodeIdx);

            return (
              <div
                key={nodeIdx}
                className={`rounded-lg border p-3.5 transition-all ${
                  selectedSensor?.nodeIndex === nodeIdx
                    ? "border-blue-500 bg-blue-50/20 shadow-2xs"
                    : "border-slate-200 bg-slate-50/40 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${statusDot[station?.status || "normal"]}`} />
                    <span className="text-xs font-bold text-slate-900">{station?.name || `Titik Pantau ${nodeIdx}`}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{station?.id}</span>
                </div>

                <div className="space-y-2">
                  {nodeTopics.map((topicItem) => (
                    <div
                      key={topicItem.topic}
                      className="flex items-center justify-between rounded-md bg-white p-2.5 shadow-2xs border border-slate-200/80"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="m-0 text-xs font-medium text-slate-700">{topicItem.label}</p>
                        <p className="m-0 font-mono text-[10px] text-slate-400 truncate" title={topicItem.topic}>
                          {topicItem.topic}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {topicItem.value} {topicItem.unit}
                        </span>
                        <span className="block text-[9px] text-slate-400">
                          {topicItem.lastUpdate || "Aktif"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
