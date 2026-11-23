import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { SensorMap } from "../components/SensorMap.jsx";
import { useSensorData } from "../context/SensorContext";

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
  return [{ title: "Peta Sensor - PeatGuard" }];
}

export default function SensorMapPage() {
  const { sensors, selectedSensor, setSelectedSensor } = useSensorData();

  return (
    <DashboardFrame active="Peta Sensor">
      <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">Peta Sebaran Titik Pantau Gambut</h1>
            <p className="m-0 mt-0.5 text-xs text-slate-500">Klik titik marker untuk melihat parameter tanah realtime di lokasi tersebut.</p>
          </div>
          <a
            href="/riwayat"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Buka Riwayat Data →
          </a>
        </div>

        <section className="overflow-hidden rounded-lg bg-white shadow-2xs border border-slate-200/90">
          <div className="h-[520px]">
            <SensorMap sensors={sensors} onSelect={(s) => setSelectedSensor(s)} />
          </div>
        </section>

        {selectedSensor && (
          <div className="mt-3.5 flex flex-wrap items-center gap-4 rounded-lg bg-white px-4.5 py-3.5 shadow-2xs border border-slate-200/90">
            <div className="flex-1 min-w-[200px]">
              <p className="m-0 text-[11px] font-mono text-slate-500">{selectedSensor.id} · {selectedSensor.region}</p>
              <p className="m-0 mt-0.5 text-sm font-bold tracking-tight text-slate-900">{selectedSensor.name}</p>
            </div>
            <div className="flex flex-wrap gap-5 text-xs">
              <span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Kelembapan</span>
                <strong className="text-slate-900 font-bold">{selectedSensor.moisture}%</strong>
              </span>
              <span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">pH Tanah</span>
                <strong className="text-slate-900 font-bold">{selectedSensor.ph ?? 4.2} pH</strong>
              </span>
              <span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Suhu Tanah</span>
                <strong className="text-slate-900 font-bold">{selectedSensor.temperature}°C</strong>
              </span>
              <span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Status Terakhir</span>
                <strong className="text-slate-600">{selectedSensor.lastReading || "Realtime"}</strong>
              </span>
            </div>
            <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusBadge[selectedSensor.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
              {statusLabels[selectedSensor.status] || selectedSensor.status}
            </span>
          </div>
        )}
      </main>
    </DashboardFrame>
  );
}
