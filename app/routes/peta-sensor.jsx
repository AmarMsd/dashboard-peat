import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { SensorMap } from "../components/SensorMap.jsx";
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
  return [{ title: "Peta Sensor - PeatGuard" }];
}

export default function SensorMapPage() {
  const { sensors, selectedSensor, setSelectedSensor } = useSensorData();

  return (
    <DashboardFrame active="Peta Sensor">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-semibold text-gray-800">Peta Sebaran Titik Pantau Gambut</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">Klik titik marker untuk melihat parameter tanah realtime di lokasi tersebut.</p>
          </div>
          <a
            href="/riwayat"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
          >
            Buka Riwayat Data →
          </a>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100">
          <div className="h-[540px]">
            <SensorMap sensors={sensors} onSelect={(s) => setSelectedSensor(s)} />
          </div>
        </section>

        {selectedSensor && (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <p className="m-0 text-xs text-gray-500">{selectedSensor.id} · {selectedSensor.region}</p>
              <p className="m-0 mt-0.5 text-sm font-semibold text-gray-800">{selectedSensor.name}</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                <span className="text-xs text-gray-500 block">Kelembapan</span>
                <strong className="text-gray-800">{selectedSensor.moisture}%</strong>
              </span>
              <span>
                <span className="text-xs text-gray-500 block">pH Tanah</span>
                <strong className="text-gray-800">{selectedSensor.ph ?? 4.2} pH</strong>
              </span>
              <span>
                <span className="text-xs text-gray-500 block">Suhu Tanah</span>
                <strong className="text-gray-800">{selectedSensor.temperature}°C</strong>
              </span>
              <span>
                <span className="text-xs text-gray-500 block">Status Terakhir</span>
                <strong className="text-gray-600 text-xs">{selectedSensor.lastReading || "Realtime"}</strong>
              </span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[selectedSensor.status] || "bg-gray-100 text-gray-600"}`}>
              {statusLabels[selectedSensor.status] || selectedSensor.status}
            </span>
          </div>
        )}
      </main>
    </DashboardFrame>
  );
}
