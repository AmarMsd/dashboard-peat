/**
 * MQTT to Supabase Realtime Bridge (PeatGuard)
 * -------------------------------------------------------------
 * Script background worker untuk mendengarkan transmisi MQTT broker
 * dan menyimpannya secara otomatis & persisten ke Supabase PostgreSQL 24/7.
 *
 * Cara menjalankan:
 *   node scripts/mqtt_supabase_bridge.js
 */

import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://piodzaormrizasbjnknn.supabase.co";
const SUPABASE_KEY = "sb_publishable_pZej0ULak_trjjMMskWx_Q_3x-a68re";

const MQTT_BROKER = "wss://mqtt.amarmsd.my.id";
const MQTT_USER = "varian";
const MQTT_PASS = "ZjdRZHotQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🚀 Memulai PeatGuard MQTT -> Supabase Bridge Worker...");
console.log(`📡 Menghubungkan ke Broker MQTT: ${MQTT_BROKER}`);
console.log(`🗄️  Menghubungkan ke Database Supabase: ${SUPABASE_URL}`);

// Sensor node metadata mapping
const sensorNodes = {
  1: { id: "PG-001", name: "Titik Pantau 1 - Rangsang Barat", region: "Kep. Meranti, Riau" },
  2: { id: "PG-002", name: "Titik Pantau 2 - Sungai Tohor", region: "Kep. Meranti, Riau" },
  3: { id: "PG-003", name: "Titik Pantau 3 - Kuala Kampar", region: "Pelalawan, Riau" },
};

// Current cached states
const stateCache = {
  1: { moisture: 68.4, ph: 4.2, temp: 28.5 },
  2: { moisture: 41.8, ph: 3.8, temp: 33.7 },
  3: { moisture: 71.3, ph: 4.6, temp: 28.6 },
};

// Evaluasi status risiko saintifik
function evaluateStatus(m, t, p) {
  if (m < 40.0 || t >= 35.0) return "critical";
  if (m < 60.0 || t >= 32.0 || p < 3.2 || p > 5.5) return "warning";
  return "normal";
}

function getReason(m, t, p) {
  if (m < 40.0) return `Kelembapan sangat rendah (${m}%), batas kritis CME tercapai.`;
  if (t >= 35.0) return `Suhu lapisan gambut sangat tinggi (${t}°C), anomali bara aktif.`;
  if (m < 60.0) return `Kelembapan memasuki zona defisit (${m}%).`;
  if (t >= 32.0) return `Peningkatan suhu gambut (${t}°C), evaporasi cepat.`;
  if (p < 3.2) return `pH asam ekstrem (${p}), oksidasi pirit.`;
  if (p > 5.5) return `pH melonjak (${p}), indikasi abu sisa pembakaran.`;
  return "Kondisi gambut normal dan terhidrasi dengan baik.";
}

// Inisialisasi koneksi MQTT
const client = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USER,
  password: MQTT_PASS,
  reconnectPeriod: 5000,
  clean: true,
});

client.on("connect", () => {
  console.log("✅ Terhubung ke Broker MQTT!");
  client.subscribe("sensor/soil/#", (err) => {
    if (err) {
      console.error("❌ Gagal subscribe:", err);
    } else {
      console.log("📥 Berlangganan topik: sensor/soil/#");
    }
  });
});

client.on("error", (err) => {
  console.error("⚠️ MQTT Error:", err.message);
});

// Penanganan pesan masuk
client.on("message", async (topic, payload) => {
  try {
    const msgStr = payload.toString().trim();
    let numVal = null;
    let parsedLat = null;
    let parsedLng = null;
    let parsedTime = null;
    let sensorField = null;

    try {
      const obj = JSON.parse(msgStr);
      if (obj && typeof obj === "object") {
        if (obj.value !== undefined) numVal = Number(obj.value);
        if (obj.latitude !== undefined && !isNaN(Number(obj.latitude))) {
          parsedLat = Number(obj.latitude);
        }
        if (obj.longitude !== undefined && !isNaN(Number(obj.longitude))) {
          parsedLng = Number(obj.longitude);
        }
        if (obj.timestamp) parsedTime = String(obj.timestamp);
        if (obj.sensor) sensorField = String(obj.sensor);
      }
    } catch (e) {
      numVal = parseFloat(msgStr);
    }

    if (numVal === null || isNaN(numVal)) return;

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
    const nodeInfo = sensorNodes[nodeNum];
    if (!nodeInfo) return;

    // Perbarui cache
    if (param === "moisture") stateCache[nodeNum].moisture = numVal;
    if (param === "ph") stateCache[nodeNum].ph = numVal;
    if (param === "temp") stateCache[nodeNum].temp = numVal;
    if (parsedLat != null) stateCache[nodeNum].lat = parsedLat;
    if (parsedLng != null) stateCache[nodeNum].lng = parsedLng;

    const current = stateCache[nodeNum];
    const status = evaluateStatus(current.moisture, current.temp, current.ph);
    const reason = getReason(current.moisture, current.temp, current.ph);

    console.log(
      `[${new Date().toLocaleTimeString()}] Telemetri: ${nodeInfo.id} -> ${param}=${numVal} | M=${current.moisture}% pH=${current.ph} T=${current.temp}°C | Lat=${parsedLat ?? current.lat ?? '-'} Lng=${parsedLng ?? current.lng ?? '-'} [${status}]`
    );

    // Simpan ke Supabase sensor_logs
    const logPayload = {
      sensor_id: nodeInfo.id,
      sensor_name: nodeInfo.name,
      moisture: current.moisture,
      ph: current.ph,
      temperature: current.temp,
      latitude: parsedLat != null ? parsedLat : current.lat != null ? current.lat : null,
      longitude: parsedLng != null ? parsedLng : current.lng != null ? current.lng : null,
      status: status,
      reason: reason,
      created_at: new Date().toISOString(),
    };

    const { error: logError } = await supabase.from("sensor_logs").insert([logPayload]);

    if (logError) {
      console.warn(`⚠️ Catatan Supabase (sensor_logs): ${logError.message}`);
    } else {
      console.log(`💾 Tersimpan ke Supabase sensor_logs untuk ${nodeInfo.id}`);
    }

    // Perbarui tabel sensors
    const updateSensorsPayload = {
      last_moisture: current.moisture,
      last_ph: current.ph,
      last_temperature: current.temp,
      status: status,
      updated_at: new Date().toISOString(),
    };
    if (parsedLat != null) updateSensorsPayload.latitude = parsedLat;
    if (parsedLng != null) updateSensorsPayload.longitude = parsedLng;

    await supabase
      .from("sensors")
      .update(updateSensorsPayload)
      .eq("id", nodeInfo.id);

    // Jika status bahaya/kritis, catat juga ke tabel notifications
    if (status === "critical") {
      await supabase.from("notifications").insert([
        {
          sensor_id: nodeInfo.id,
          title: `BAHAYA: Kondisi Kritis di ${nodeInfo.name}`,
          message: reason,
          severity: "critical",
          is_read: false,
        },
      ]);
    }
  } catch (err) {
    console.error("Gagal memproses pesan:", err);
  }
});
