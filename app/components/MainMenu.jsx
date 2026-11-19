import { useCallback, useState } from "react";
import { sensors } from "../data/sensors";
import { SensorMap } from "./SensorMap";

const statusLabels = {
  normal: "Baik",
  warning: "Perlu Dicek",
  critical: "Bahaya",
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
    <div className="mb-4 rounded-xl border-l-4 border-[#2563eb] bg-blue-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs text-gray-500">{sensor.id} · {sensor.region}</p>
          <h3 className="m-0 mt-0.5 text-sm font-semibold text-gray-800">{sensor.name}</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[sensor.status]}`}>
          {statusLabels[sensor.status]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Kelembapan", `${sensor.moisture}%`],
          ["Suhu", `${sensor.temperature}°C`],
          ["Ketinggian Air", `${sensor.waterLevel} cm`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white p-2">
            <p className="m-0 text-xs font-semibold text-gray-800">{value}</p>
            <p className="m-0 mt-0.5 text-[10px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <p className="m-0 mt-2 text-[10px] text-gray-400">Dibaca {sensor.lastReading}</p>
    </div>
  );
}

export function MainMenu() {
  const [selectedSensor, setSelectedSensor] = useState(sensors[0]);
  const selectSensor = useCallback((sensor) => setSelectedSensor(sensor), []);
  const activeCount = sensors.filter((s) => s.status === "normal").length;
  const warningCount = sensors.filter((s) => s.status !== "normal").length;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main className="min-w-0 flex-1 p-5 lg:p-7">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="m-0 text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="m-0 mt-1 text-sm text-gray-500 capitalize">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <article className="rounded-xl border-l-4 border-[#2563eb] bg-white p-4 shadow-sm">
          <p className="m-0 text-xs text-gray-500">Total Sensor</p>
          <p className="m-0 mt-2 text-3xl font-bold text-gray-800">{sensors.length}</p>
          <p className="m-0 mt-1 text-xs text-blue-600">terpasang di lapangan</p>
        </article>
        <article className="rounded-xl border-l-4 border-green-500 bg-white p-4 shadow-sm">
          <p className="m-0 text-xs text-gray-500">Kondisi Baik</p>
          <p className="m-0 mt-2 text-3xl font-bold text-gray-800">{activeCount}</p>
          <p className="m-0 mt-1 text-xs text-green-600">tidak perlu tindakan</p>
        </article>
        <article className="rounded-xl border-l-4 border-amber-500 bg-white p-4 shadow-sm">
          <p className="m-0 text-xs text-gray-500">Perlu Diperiksa</p>
          <p className="m-0 mt-2 text-3xl font-bold text-gray-800">{warningCount}</p>
          <p className="m-0 mt-1 text-xs text-amber-600">membutuhkan perhatian</p>
        </article>
        <article className="rounded-xl border-l-4 border-gray-300 bg-white p-4 shadow-sm">
          <p className="m-0 text-xs text-gray-500">Terakhir Diperbarui</p>
          <p className="m-0 mt-2 text-xl font-bold text-gray-800">2 menit</p>
          <p className="m-0 mt-1 text-xs text-gray-400">lalu · data terbaru</p>
        </article>
      </div>

      {/* Map + List */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Map card */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-800">Peta Lokasi Sensor</h2>
              <p className="m-0 mt-0.5 text-xs text-gray-500">Klik titik untuk melihat kondisi lahan</p>
            </div>
            <div className="flex gap-3 text-[10px] text-gray-500">
              {Object.entries(statusLabels).map(([status, label]) => (
                <span className="flex items-center gap-1" key={status}>
                  <span className={`size-2 rounded-full ${statusDot[status]}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="h-[440px]">
            <SensorMap sensors={sensors} onSelect={selectSensor} />
          </div>
        </section>

        {/* Sensor list card */}
        <aside className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-sm font-semibold text-gray-800">Status Sensor</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {sensors.length} lokasi
            </span>
          </div>

          {/* Selected sensor detail */}
          <SensorDetail sensor={selectedSensor} />

          {/* Sensor list */}
          <p className="mb-2 text-xs text-gray-400">Pilih lokasi lain</p>
          <div className="space-y-1">
            {sensors.map((sensor) => (
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  selectedSensor?.id === sensor.id
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
                type="button"
                key={sensor.id}
                onClick={() => setSelectedSensor(sensor)}
              >
                <span className={`size-2 shrink-0 rounded-full ${statusDot[sensor.status]}`} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{sensor.name}</span>
                <span className="shrink-0 text-[10px] text-gray-400">{sensor.id}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
