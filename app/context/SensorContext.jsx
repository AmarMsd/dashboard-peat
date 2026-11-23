import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { defaultSensors, initialMqttTopics, evaluateSensorStatus, getStatusReason } from "../data/sensors";
import {
  supabase,
  fetchSensorLogsFromSupabase,
  fetchSensorsFromSupabase,
  insertSensorLogToSupabase,
  updateSensorCurrentStateInSupabase,
} from "../lib/supabase";

const SensorContext = createContext({
  sensors: defaultSensors,
  selectedSensor: defaultSensors[0],
  setSelectedSensor: () => {},
  liveTopics: initialMqttTopics,
  connectionStatus: "connecting",
  supabaseStatus: "connecting",
  lastMessageTime: null,
  historicalRecords: [],
  exportHistoryCSV: () => {},
  refreshConnection: () => {},
});

const MQTT_BROKER = "wss://mqtt.amarmsd.my.id";
const MQTT_USER = "varian";
const MQTT_PASS = "ZjdRZHotQ";
const STORAGE_KEY = "peatguard_sensor_history_v1";

export function SensorProvider({ children }) {
  const [sensors, setSensors] = useState(defaultSensors);
  const [selectedSensor, setSelectedSensor] = useState(defaultSensors[0]);
  const [liveTopics, setLiveTopics] = useState(initialMqttTopics);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [supabaseStatus, setSupabaseStatus] = useState("connecting");
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const mqttClientRef = useRef(null);

  // Inisialisasi data mutakhir murni dari Supabase (tanpa data tiruan/mock .json)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isCancelled = false;

    async function loadData() {
      // 1. Ambil status sensor mutakhir dan log riwayat dari Supabase
      const [remoteLogs, remoteSensors] = await Promise.all([
        fetchSensorLogsFromSupabase(150),
        fetchSensorsFromSupabase(),
      ]);

      // Perbarui status 3 titik sensor dari Supabase jika ada
      if (remoteSensors && Array.isArray(remoteSensors) && remoteSensors.length > 0) {
        if (!isCancelled) {
          setSensors((prevSensors) =>
            prevSensors.map((s) => {
              const remote = remoteSensors.find((r) => r.id === s.id);
              if (remote) {
                const updated = {
                  ...s,
                  name: remote.name || s.name,
                  region: remote.region || s.region,
                  lat: remote.latitude != null ? Number(remote.latitude) : s.lat,
                  lng: remote.longitude != null ? Number(remote.longitude) : s.lng,
                  moisture: Number(remote.last_moisture ?? 0),
                  ph: Number(remote.last_ph ?? 0),
                  temperature: Number(remote.last_temperature ?? 0),
                  status: remote.status || s.status,
                  lastReading: remote.updated_at
                    ? new Date(remote.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    : "Tersinkron Supabase",
                };
                return updated;
              }
              return s;
            })
          );

          // Sinkronkan juga nilai pada panel 9 topik dari pembacaan terakhir di Supabase
          setLiveTopics((prevTopics) =>
            prevTopics.map((topicItem) => {
              const station = remoteSensors.find((r) => r.id === `PG-00${topicItem.nodeIndex}`);
              if (station) {
                let val = topicItem.value;
                if (topicItem.param === "moisture" && station.last_moisture != null) val = station.last_moisture;
                if (topicItem.param === "ph" && station.last_ph != null) val = station.last_ph;
                if (topicItem.param === "temp" && station.last_temperature != null) val = station.last_temperature;
                return {
                  ...topicItem,
                  value: val !== 0 ? val : topicItem.value,
                  lastUpdate: station.updated_at
                    ? new Date(station.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : topicItem.lastUpdate,
                };
              }
              return topicItem;
            })
          );
        }
      }

      // Perbarui log riwayat dari Supabase
      if (remoteLogs && Array.isArray(remoteLogs) && remoteLogs.length > 0) {
        const formatted = remoteLogs.map((row) => {
          const t = new Date(row.created_at);
          return {
            id: `SB-${row.id}`,
            timestamp: row.created_at,
            timeFormatted: t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            dateFormatted: t.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            sensorId: row.sensor_id,
            sensorName: row.sensor_name,
            moisture: Number(row.moisture),
            ph: Number(row.ph),
            temperature: Number(row.temperature),
            latitude: row.latitude,
            longitude: row.longitude,
            status: row.status,
            reason: row.reason,
          };
        });
        if (!isCancelled) {
          setHistoricalRecords(formatted);
          setSupabaseStatus("connected");
        }
        return;
      }

      // Jika Supabase kosong (belum ada transmisi), JANGAN gunakan data mock dari json/generator
      // Cukup kosongkan riwayat sehingga murni menunggu transmisi dari sensor fisik
      if (!isCancelled) {
        setHistoricalRecords([]);
        setSupabaseStatus(remoteLogs !== null ? "connected" : "offline");
      }
    }

    loadData();

    // Setup Supabase Realtime subscription
    let channel = null;
    try {
      channel = supabase
        .channel("realtime-sensor-logs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "sensor_logs" },
          (payload) => {
            const row = payload.new;
            if (!row) return;
            const t = new Date(row.created_at);
            const liveEntry = {
              id: `SB-${row.id}`,
              timestamp: row.created_at,
              timeFormatted: t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              dateFormatted: t.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
              sensorId: row.sensor_id,
              sensorName: row.sensor_name,
              moisture: Number(row.moisture),
              ph: Number(row.ph),
              temperature: Number(row.temperature),
              status: row.status,
              reason: row.reason,
            };
            setHistoricalRecords((prev) => [liveEntry, ...prev.filter((p) => p.id !== liveEntry.id)].slice(0, 200));
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Supabase Realtime notice:", e);
    }

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Simpan record baru ke state & localStorage & Supabase
  const addHistoricalRecord = (nodeId, updatedFields) => {
    const targetSensor = sensors.find((s) => s.id === nodeId);
    if (!targetSensor) return;

    const merged = { ...targetSensor, ...updatedFields };
    const now = new Date();
    const status = evaluateSensorStatus(merged.moisture, merged.temperature, merged.ph);
    const reason = getStatusReason(merged);

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
      latitude: merged.lat != null ? Number(merged.lat) : null,
      longitude: merged.lng != null ? Number(merged.lng) : null,
      status: status,
      reason: reason,
    };

    setHistoricalRecords((prev) => {
      const updated = [newEntry, ...prev].slice(0, 200); // Pertahankan 200 log terbaru
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Sinkronisasi otomatis ke cloud database Supabase
    insertSensorLogToSupabase(newEntry).then((success) => {
      if (success) setSupabaseStatus("connected");
    });
    updateSensorCurrentStateInSupabase(merged);
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
          let numericValue = null;
          let parsedLat = null;
          let parsedLng = null;
          let parsedTimestamp = null;
          let sensorField = null;

          try {
            const obj = JSON.parse(msgStr);
            if (obj && typeof obj === "object") {
              if (obj.value !== undefined) numericValue = Number(obj.value);
              if (obj.latitude !== undefined && !isNaN(Number(obj.latitude))) {
                parsedLat = Number(obj.latitude);
              }
              if (obj.longitude !== undefined && !isNaN(Number(obj.longitude))) {
                parsedLng = Number(obj.longitude);
              }
              if (obj.timestamp) parsedTimestamp = String(obj.timestamp);
              if (obj.sensor) sensorField = String(obj.sensor);
            }
          } catch (e) {
            numericValue = parseFloat(msgStr);
          }

          if (numericValue === null || isNaN(numericValue)) return;

          let param = null;
          let nodeNum = null;

          const match = topic.match(/sensor\/soil\/(moisture|ph|temp)(\d)/i);
          if (match) {
            param = match[1].toLowerCase();
            nodeNum = parseInt(match[2], 10);
          } else if (sensorField) {
            const fieldMatch = sensorField.match(/(moisture|ph|temp)(\d)/i);
            if (fieldMatch) {
              param = fieldMatch[1].toLowerCase();
              nodeNum = parseInt(fieldMatch[2], 10);
            }
          }

          if (!nodeNum) return;
          const targetId = `PG-00${nodeNum}`;
          const nowTimeStr = parsedTimestamp || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
          setLastMessageTime(new Date());

          setSensors((prevSensors) =>
            prevSensors.map((sensor) => {
              if (sensor.nodeIndex === nodeNum || sensor.id === targetId) {
                let updatedMoisture = sensor.moisture;
                let updatedPh = sensor.ph;
                let updatedTemp = sensor.temperature;
                let updatedLat =
                  parsedLat != null && !isNaN(parsedLat)
                    ? parsedLat
                    : sensor.lat != null
                    ? sensor.lat
                    : -6.8303;
                let updatedLng =
                  parsedLng != null && !isNaN(parsedLng)
                    ? parsedLng
                    : sensor.lng != null
                    ? sensor.lng
                    : 107.5867;

                if (param === "moisture") updatedMoisture = numericValue;
                if (param === "ph") updatedPh = numericValue;
                if (param === "temp") updatedTemp = numericValue;

                const newStatus = evaluateSensorStatus(updatedMoisture, updatedTemp, updatedPh);

                const updatedSensor = {
                  ...sensor,
                  moisture: updatedMoisture,
                  ph: updatedPh,
                  temperature: updatedTemp,
                  lat: updatedLat,
                  lng: updatedLng,
                  status: newStatus,
                  lastReading: nowTimeStr,
                };

                // Otomatis perbarui selectedSensor ke data mutakhir yang baru saja masuk
                setSelectedSensor(updatedSensor);

                // Tambahkan entri riwayat jika ada perubahan nilai
                addHistoricalRecord(targetId, {
                  moisture: updatedMoisture,
                  ph: updatedPh,
                  temperature: updatedTemp,
                  lat: updatedLat,
                  lng: updatedLng,
                  timestampStr: parsedTimestamp,
                });

                return updatedSensor;
              }
              return sensor;
            })
          );

          // Perbarui status daftar 9 topik telemetri realtime
          setLiveTopics((prevTopics) =>
            prevTopics.map((item) => {
              const itemTopic = item.topic.toLowerCase();
              const isMatch =
                itemTopic === topic.toLowerCase() ||
                (item.param === param && item.nodeIndex === nodeNum);

              if (isMatch) {
                return {
                  ...item,
                  value: numericValue,
                  lastUpdate: nowTimeStr,
                  isFresh: true,
                };
              }
              return item;
            })
          );
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
        liveTopics,
        connectionStatus,
        supabaseStatus,
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
