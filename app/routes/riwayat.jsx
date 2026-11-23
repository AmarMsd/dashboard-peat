import { useState, useMemo } from "react";
import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { useSensorData } from "../context/SensorContext";

export function meta() {
  return [{ title: "Riwayat Data & Tren - PeatGuard" }];
}

const statusBadge = {
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabel = {
  normal: "Aman",
  warning: "Waspada",
  critical: "Kritis",
};

export default function RiwayatPage() {
  const { historicalRecords, exportHistoryCSV, sensors } = useSensorData();

  const [selectedNode, setSelectedNode] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("moisture"); // "moisture" | "ph" | "temperature"

  // Filter record sesuai titik sensor
  const filteredRecords = useMemo(() => {
    if (selectedNode === "all") return historicalRecords;
    return historicalRecords.filter((r) => r.sensorId === selectedNode);
  }, [historicalRecords, selectedNode]);

  // Statistik ringkasan dari record yang difilter
  const stats = useMemo(() => {
    if (!filteredRecords.length) {
      return { avgMoisture: 0, avgPh: 0, avgTemp: 0, total: 0, alertCount: 0 };
    }
    const sumM = filteredRecords.reduce((acc, r) => acc + (Number(r.moisture) || 0), 0);
    const sumPh = filteredRecords.reduce((acc, r) => acc + (Number(r.ph) || 0), 0);
    const sumT = filteredRecords.reduce((acc, r) => acc + (Number(r.temperature) || 0), 0);
    const alertCount = filteredRecords.filter((r) => r.status !== "normal").length;

    return {
      avgMoisture: (sumM / filteredRecords.length).toFixed(1),
      avgPh: (sumPh / filteredRecords.length).toFixed(1),
      avgTemp: (sumT / filteredRecords.length).toFixed(1),
      total: filteredRecords.length,
      alertCount,
    };
  }, [filteredRecords]);

  // Data untuk Grafik Tren (ambil urut dari waktu lama ke baru)
  const chartData = useMemo(() => {
    const sorted = [...filteredRecords].reverse().slice(-25); // Ambil 25 titik terakhir untuk visual bersih
    return sorted.map((item) => ({
      time: item.timeFormatted,
      val: Number(item[selectedMetric]) || 0,
      sensorName: item.sensorName,
      status: item.status,
    }));
  }, [filteredRecords, selectedMetric]);

  // Kalkulasi koordinat SVG untuk grafik garis & area
  const svgMetrics = useMemo(() => {
    if (!chartData.length) return null;
    const values = chartData.map((d) => d.val);
    const minVal = Math.floor(Math.min(...values) * 0.9);
    const maxVal = Math.ceil(Math.max(...values) * 1.1) || 100;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const points = chartData.map((d, idx) => {
      const x = padding.left + (idx / (chartData.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((d.val - minVal) / range) * chartH;
      return { x, y, val: d.val, time: d.time };
    });

    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
    const areaD = `${pathD} L ${points[points.length - 1]?.x.toFixed(1) || 0} ${(padding.top + chartH).toFixed(1)} L ${padding.left} ${(padding.top + chartH).toFixed(1)} Z`;

    return { width, height, minVal, maxVal, points, pathD, areaD, padding, chartW, chartH };
  }, [chartData]);

  const metricConfig = {
    moisture: { label: "Kelembapan Tanah", unit: "%", color: "#2563eb", guide: 40, guideText: "Batas Kritis Karhutla (40%)" },
    ph: { label: "Derajat Keasaman (pH)", unit: " pH", color: "#059669", guide: 4.0, guideText: "Acuan Alami Gambut" },
    temperature: { label: "Suhu Tanah", unit: "°C", color: "#d97706", guide: 34, guideText: "Batas Pemanasan Tinggi (34°C)" },
  };

  // Konfigurasi kolom DataTables
  const tableColumns = [
    {
      key: "timeFormatted",
      label: "Waktu & Tanggal",
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-semibold text-gray-900">{val}</span>
          <span className="block text-[11px] text-gray-400">{row.dateFormatted}</span>
        </div>
      ),
    },
    {
      key: "sensorName",
      label: "Titik Sensor",
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-medium text-gray-800">{val}</span>
          <span className="block text-[11px] font-mono text-gray-400">
            {row.sensorId}
            {row.latitude && row.longitude ? ` · (${Number(row.latitude).toFixed(3)}, ${Number(row.longitude).toFixed(3)})` : ""}
          </span>
        </div>
      ),
    },
    {
      key: "moisture",
      label: "Kelembapan",
      sortable: true,
      align: "left",
      render: (val) => {
        const num = Number(val);
        const color = num < 40 ? "text-rose-600" : num < 60 ? "text-amber-600" : "text-emerald-700";
        return <span className={`font-bold ${color}`}>{val}%</span>;
      },
    },
    {
      key: "ph",
      label: "pH Tanah",
      sortable: true,
      align: "left",
      render: (val) => (
        <span className="font-bold text-gray-800">{val}</span>
      ),
    },
    {
      key: "temperature",
      label: "Suhu Tanah",
      sortable: true,
      align: "left",
      render: (val) => {
        const num = Number(val);
        const color = num >= 35 ? "text-rose-600" : num >= 32 ? "text-amber-600" : "text-gray-900";
        return <span className={`font-bold ${color}`}>{val}°C</span>;
      },
    },
    {
      key: "status",
      label: "Status Evaluasi",
      sortable: true,
      align: "center",
      headerAlign: "center",
      render: (val, row) => {
        let tooltip = "Kondisi gambut aman terhidrasi (Kelembapan ≥60%, Suhu <32°C)";
        if (val === "warning") {
          tooltip = `Waspada Karhutla: Kelembapan (${row.moisture}%) berada di zona rawan kering (40-60%) atau suhu (${row.temperature}°C) di atas normal`;
        } else if (val === "critical") {
          tooltip = `Kritis / Bahaya: Kelembapan (<40%) di bawah ambang batas CME atau suhu (≥35°C) terdeteksi anomali hotspot bara api`;
        }
        return (
          <span
            title={tooltip}
            className={`cursor-help inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              statusBadge[val] || "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            {statusLabel[val] || val}
          </span>
        );
      },
    },
  ];

  return (
    <DashboardFrame active="Riwayat Data">
      <main className="min-w-0 flex-1 p-5 lg:p-7">
        {/* Header & Export button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-semibold text-gray-800">Riwayat Data & Tren Sensor</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Rekaman historis data kelembapan tanah, pH, dan suhu dari transmisi alat pemantau pencegahan kebakaran gambut.
            </p>
          </div>
          <button
            onClick={exportHistoryCSV}
            type="button"
            className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Unduh Riwayat (CSV)
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border-l-4 border-blue-600 bg-white p-4 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Total Log Tercatat</p>
            <p className="m-0 mt-2 text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="m-0 mt-1 text-xs text-blue-600">pembacaan tersimpan</p>
          </div>
          <div className="rounded-xl border-l-4 border-emerald-600 bg-white p-4 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Rata-rata Kelembapan</p>
            <p className="m-0 mt-2 text-2xl font-bold text-gray-800">{stats.avgMoisture}%</p>
            <p className="m-0 mt-1 text-xs text-emerald-600">kondisi agregat lahan</p>
          </div>
          <div className="rounded-xl border-l-4 border-teal-600 bg-white p-4 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Rata-rata pH Tanah</p>
            <p className="m-0 mt-2 text-2xl font-bold text-gray-800">{stats.avgPh}</p>
            <p className="m-0 mt-1 text-xs text-teal-600">keasaman alami gambut</p>
          </div>
          <div className="rounded-xl border-l-4 border-amber-500 bg-white p-4 shadow-sm">
            <p className="m-0 text-xs text-gray-500">Rata-rata Suhu Tanah</p>
            <p className="m-0 mt-2 text-2xl font-bold text-gray-800">{stats.avgTemp}°C</p>
            <p className="m-0 mt-1 text-xs text-amber-600">{stats.alertCount} status perhatian</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Titik Pantau:</span>
            <button
              onClick={() => setSelectedNode("all")}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedNode === "all" ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Semua Titik (1, 2, 3)
            </button>
            {sensors.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedNode(s.id)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedNode === s.id ? "bg-[#2563eb] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.name.split("-")[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Parameter:</span>
            {[
              { id: "moisture", label: "Kelembapan" },
              { id: "ph", label: "pH Tanah" },
              { id: "temperature", label: "Suhu" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedMetric === m.id ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Historical Trend Chart */}
        <section className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="m-0 text-sm font-semibold text-gray-800">
                Grafik Tren Historis · {metricConfig[selectedMetric].label}
              </h2>
              <p className="m-0 mt-0.5 text-xs text-gray-500">
                Visualisasi dinamika pembacaan sensor waktu ke waktu (25 data terakhir)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full" style={{ backgroundColor: metricConfig[selectedMetric].color }}></span>
              <span className="text-xs font-medium text-gray-600">{metricConfig[selectedMetric].label}</span>
            </div>
          </div>

          {svgMetrics ? (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${svgMetrics.width} ${svgMetrics.height}`} className="w-full h-auto min-w-[550px]">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricConfig[selectedMetric].color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={metricConfig[selectedMetric].color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = svgMetrics.padding.top + svgMetrics.chartH * (1 - ratio);
                  const val = (svgMetrics.minVal + ratio * (svgMetrics.maxVal - svgMetrics.minVal)).toFixed(1);
                  return (
                    <g key={ratio}>
                      <line
                        x1={svgMetrics.padding.left}
                        y1={y}
                        x2={svgMetrics.padding.left + svgMetrics.chartW}
                        y2={y}
                        stroke="#e5e7eb"
                        strokeDasharray="4 4"
                      />
                      <text x={svgMetrics.padding.left - 8} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient */}
                <path d={svgMetrics.areaD} fill="url(#chartGradient)" />

                {/* Garis Data */}
                <path
                  d={svgMetrics.pathD}
                  fill="none"
                  stroke={metricConfig[selectedMetric].color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Titik data */}
                {svgMetrics.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#ffffff"
                    stroke={metricConfig[selectedMetric].color}
                    strokeWidth="2"
                  >
                    <title>{`${pt.time}: ${pt.val}${metricConfig[selectedMetric].unit}`}</title>
                  </circle>
                ))}

                {/* Label sumbu X */}
                {svgMetrics.points.filter((_, i) => i % Math.ceil(svgMetrics.points.length / 6) === 0).map((pt, i) => (
                  <text
                    key={i}
                    x={pt.x}
                    y={svgMetrics.height - 10}
                    fontSize="10"
                    fill="#6b7280"
                    textAnchor="middle"
                  >
                    {pt.time}
                  </text>
                ))}
              </svg>
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-gray-400">
              Belum ada data historis yang memadai untuk grafik.
            </div>
          )}
        </section>

        {/* DataTables Section */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="m-0 text-sm font-semibold text-gray-800">Log Catatan Sensor Realtime (DataTables)</h2>
            <p className="m-0 mt-0.5 text-xs text-gray-500">
              Pencatatan runtun waktu (audit trail) dari setiap paket transmisi. Arahkan kursor ke badge status untuk melihat keterangan ilmiah kondisi gambut.
            </p>
          </div>

          <DataTable
            columns={tableColumns}
            data={filteredRecords}
            searchPlaceholder="Cari waktu, sensor, nilai..."
            defaultSortKey="timeFormatted"
            defaultSortDir="desc"
            pageSizeOptions={[10, 25, 50, 100]}
            initialPageSize={10}
            emptyMessage="Tidak ada catatan riwayat yang cocok dengan pencarian atau filter."
          />
        </section>
      </main>
    </DashboardFrame>
  );
}
