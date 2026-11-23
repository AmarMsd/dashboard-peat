import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { defaultSensors, evaluateSensorStatus } from "../data/sensors";

const SensorContext = createContext({
  sensors: defaultSensors,
  selectedSensor: defaultSensors[0],
  setSelectedSensor: () => {},
  connectionStatus: "connecting",
  lastMessageTime: null,
  historicalRecords: [],
  exportHistoryCSV: () => {},
  refreshConnection: () => {},
});

const MQTT_BROKER = "wss://mqtt.amarmsd.my.id";
const MQTT_USER = "varian";
const MQTT_PASS = "ZjdRZHotQ";
const STORAGE_KEY = "peatguard_sensor_history_v1";

// Helper membuat data historis awal realistis (24 jam terakhir) jika storage masih kosong
function generateInitialHistoricalData() {
  const records = [];
  const now = Date.now();
  const intervals = [
    { label: "Titik Pantau 1 - Rangsang Barat", id: "PG-001", baseM: 68, basePh: 4.2, baseT: 28 },
    { label: "Titik Pantau 2 - Sungai Tohor", id: "PG-002", baseM: 42, basePh: 3.8, baseT: 32 },
    { label: "Titik Pantau 3 - Kuala Kampar", id: "PG-003", baseM: 71, basePh: 4.5, baseT: 27 },
  ];

  // Buat 36 log sampel mundur per 40 menit
  for (let i = 36; i >= 0; i--) {
    const timestamp = new Date(now - i * 40 * 60 * 1000);
    intervals.forEach((node) => {
      // Variasi acak halus alami
      const noiseM = (Math.sin(i * 0.4) * 3) + ((Math.random() - 0.5) * 2);
      const noiseT = (Math.cos(i * 0.3) * 2) + ((Math.random() - 0.5) * 1.2);
      const noisePh = ((Math.random() - 0.5) * 0.2);

      const m = Math.max(20, Math.min(95, Math.round((node.baseM + noiseM) * 10) / 10));
      const t = Math.round((node.baseT + noiseT) * 10) / 10;
      const ph = Math.round((node.basePh + noisePh) * 10) / 10;
      const status = evaluateSensorStatus(m, t, ph);

      records.push({
        id: `LOG-${timestamp.getTime()}-${node.id}`,
        timestamp: timestamp.toISOString(),
        timeFormatted: timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        dateFormatted: timestamp.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        sensorId: node.id,
        sensorName: node.label,
        moisture: m,
        ph: ph,
        temperature: t,
        status: status,
      });
    });
  }

  return records.reverse(); // Terbaru di atas
}

export function SensorProvider({ children }) {
  const [sensors, setSensors] = useState(defaultSensors);
  const [selectedSensor, setSelectedSensor] = useState(defaultSensors[0]);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const mqttClientRef = useRef(null);

  // Inisialisasi data historis dari localStorage atau generator awal
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoricalRecords(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn("Gagal membaca history dari storage", e);
    }

    const initial = generateInitialHistoricalData();
    setHistoricalRecords(initial);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial.slice(0, 150)));
    } catch (e) {}
  }, []);

  // Simpan record baru ke state & localStorage
  const addHistoricalRecord = (nodeId, updatedFields) => {
    const targetSensor = sensors.find((s) => s.id === nodeId);
    if (!targetSensor) return;

    const merged = { ...targetSensor, ...updatedFields };
    const now = new Date();
    const newEntry = {
      id: `LOG-${now.getTime()}-${nodeId}`,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      dateFormatted: now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      sensorId: nodeId,
      sensorName: merged.name,
      moisture: merged.moisture,
      ph: merged.ph,
      temperature: merged.temperature,
      status: evaluateSensorStatus(merged.moisture, merged.temperature, merged.ph),
    };

    setHistoricalRecords((prev) => {
      const updated = [newEntry, ...prev].slice(0, 200); // Pertahankan 200 log terbaru
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Koneksi MQTT Client
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;
    let client = null;

    async function initMqtt() {
      try {
        setConnectionStatus("connecting");
        const mqttModule = await import("mqtt");
        const connectFn =
          typeof mqttModule.connect === "function"
            ? mqttModule.connect
            : typeof mqttModule.default?.connect === "function"
            ? mqttModule.default.connect
            : typeof mqttModule.default === "function"
            ? mqttModule.default
            : null;

        if (typeof connectFn !== "function") {
          throw new Error("Fungsi connect tidak ditemukan pada modul MQTT.");
        }

        client = connectFn(MQTT_BROKER, {
          username: MQTT_USER,
          password: MQTT_PASS,
          connectTimeout: 8000,
          reconnectPeriod: 5000,
          clean: true,
        });

        mqttClientRef.current = client;

        client.on("connect", () => {
          if (!isMounted) return;
          setConnectionStatus("connected");
          // Subscribe ke seluruh topik sensor/soil
          client.subscribe("sensor/soil/#", (err) => {
            if (err) {
              console.error("Gagal subscribe topik MQTT:", err);
            }
          });
        });

        client.on("reconnect", () => {
          if (!isMounted) return;
          setConnectionStatus("connecting");
        });

        client.on("offline", () => {
          if (!isMounted) return;
          setConnectionStatus("disconnected");
        });

        client.on("error", (err) => {
          console.warn("MQTT connection notice:", err.message);
          if (!isMounted) return;
          setConnectionStatus("error");
        });

        client.on("message", (topic, payload) => {
          if (!isMounted) return;
          const msgStr = payload.toString().trim();
          let numericValue = parseFloat(msgStr);

          if (isNaN(numericValue)) {
            try {
              const obj = JSON.parse(msgStr);
              numericValue = Number(obj.value ?? obj.val ?? obj.data);
            } catch (e) {}
          }

          if (isNaN(numericValue)) return;

          const nowTimeStr = "Baru saja";
          setLastMessageTime(new Date());

          // Parsing topik:
          // sensor/soil/moisture1 -> node 1 moisture
          // sensor/soil/ph2 -> node 2 ph
          // sensor/soil/temp3 -> node 3 temp
          const match = topic.match(/sensor\/soil\/(moisture|ph|temp)(\d)/);
          if (match) {
            const param = match[1]; // "moisture" | "ph" | "temp"
            const nodeNum = parseInt(match[2], 10); // 1 | 2 | 3
            const targetId = `PG-00${nodeNum}`;

            setSensors((prevSensors) =>
              prevSensors.map((sensor) => {
                if (sensor.nodeIndex === nodeNum || sensor.id === targetId) {
                  let updatedMoisture = sensor.moisture;
                  let updatedPh = sensor.ph;
                  let updatedTemp = sensor.temperature;

                  if (param === "moisture") updatedMoisture = numericValue;
                  if (param === "ph") updatedPh = numericValue;
                  if (param === "temp") updatedTemp = numericValue;

                  const newStatus = evaluateSensorStatus(updatedMoisture, updatedTemp, updatedPh);

                  const updatedSensor = {
                    ...sensor,
                    moisture: updatedMoisture,
                    ph: updatedPh,
                    temperature: updatedTemp,
                    status: newStatus,
                    lastReading: nowTimeStr,
                  };

                  // Perbarui selectedSensor jika sedang aktif
                  setSelectedSensor((curr) => (curr?.id === targetId ? updatedSensor : curr));

                  // Tambahkan entri riwayat jika ada perubahan nilai
                  addHistoricalRecord(targetId, {
                    moisture: updatedMoisture,
                    ph: updatedPh,
                    temperature: updatedTemp,
                  });

                  return updatedSensor;
                }
                return sensor;
              })
            );
          }
        });
      } catch (err) {
        console.error("Gagal inisialisasi MQTT:", err);
        if (isMounted) setConnectionStatus("error");
      }
    }

    initMqtt();

    return () => {
      isMounted = false;
      if (client) {
        client.end(true);
      }
    };
  }, []);

  // Fungsi ekspor CSV riwayat data
  const exportHistoryCSV = () => {
    if (!historicalRecords || historicalRecords.length === 0) {
      alert("Belum ada data historis untuk diekspor.");
      return;
    }

    const headers = ["ID Log", "Waktu", "Tanggal", "ID Sensor", "Nama Titik", "Kelembapan (%)", "pH Tanah", "Suhu (°C)", "Status"];
    const rows = historicalRecords.map((r) => [
      `"${r.id}"`,
      `"${r.timeFormatted}"`,
      `"${r.dateFormatted}"`,
      `"${r.sensorId}"`,
      `"${r.sensorName}"`,
      r.moisture,
      r.ph,
      r.temperature,
      `"${r.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `riwayat-sensor-gambut-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshConnection = () => {
    if (mqttClientRef.current) {
      mqttClientRef.current.reconnect();
    }
  };

  return (
    <SensorContext.Provider
      value={{
        sensors,
        selectedSensor,
        setSelectedSensor,
        connectionStatus,
        lastMessageTime,
        historicalRecords,
        exportHistoryCSV,
        refreshConnection,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
}

export function useSensorData() {
  return useContext(SensorContext);
}
