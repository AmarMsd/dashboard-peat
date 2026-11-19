import { useCallback, useState } from "react";
import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { SensorMap } from "../components/SensorMap.jsx";
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
  return [{ title: "Peta Sensor - PeatGuard" }];
}

export default function SensorMapPage() {
  const [selectedSensor, setSelectedSensor] = useState(sensors[0]);
  const selectSensor = useCallback((sensor) => setSelectedSensor(sensor), []);

  return (
    <DashboardFrame active="Peta Sensor">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        <div className="mb-6">
          <h1 className="m-0 text-xl font-semibold text-gray-800">Peta Sensor</h1>
          <p className="m-0 mt-1 text-sm text-gray-500">Klik titik berwarna untuk melihat kondisi di setiap lokasi.</p>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="h-[560px]">
            <SensorMap sensors={sensors} onSelect={selectSensor} />
          </div>
        </section>

        {selectedSensor && (
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="flex-1">
              <p className="m-0 text-xs text-gray-500">{selectedSensor.id} · {selectedSensor.region}</p>
              <p className="m-0 mt-0.5 text-sm font-semibold text-gray-800">{selectedSensor.name}</p>
            </div>
            <div className="flex gap-5 text-sm">
              <span><span className="text-xs text-gray-500 block">Kelembapan</span>{selectedSensor.moisture}%</span>
              <span><span className="text-xs text-gray-500 block">Suhu</span>{selectedSensor.temperature}°C</span>
              <span><span className="text-xs text-gray-500 block">Ketinggian Air</span>{selectedSensor.waterLevel} cm</span>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[selectedSensor.status]}`}>
              {statusLabels[selectedSensor.status]}
            </span>
          </div>
        )}
      </main>
    </DashboardFrame>
  );
}
