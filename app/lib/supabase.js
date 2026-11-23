import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://piodzaormrizasbjnknn.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_pZej0ULak_trjjMMskWx_Q_3x-a68re";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Mengambil log telemetri terbaru dari Supabase
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function fetchSensorLogsFromSupabase(limit = 100) {
  try {
    const { data, error } = await supabase
      .from("sensor_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Notice Supabase sensor_logs:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Supabase fetch error:", err);
    return null;
  }
}

/**
 * Menyimpan satu record telemetri ke tabel sensor_logs di Supabase
 * @param {Object} log
 */
export async function insertSensorLogToSupabase(log) {
  try {
    const payload = {
      sensor_id: log.sensorId,
      sensor_name: log.sensorName,
      moisture: Number(log.moisture),
      ph: Number(log.ph),
      temperature: Number(log.temperature),
      status: log.status,
      reason: log.reason || null,
      latitude: log.latitude != null ? Number(log.latitude) : null,
      longitude: log.longitude != null ? Number(log.longitude) : null,
      created_at: log.timestamp || new Date().toISOString(),
    };

    const { error } = await supabase.from("sensor_logs").insert([payload]);
    if (error) {
      console.warn("Gagal simpan log ke Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase insert error:", err);
    return false;
  }
}

/**
 * Memperbarui data mutakhir sensor di tabel sensors Supabase
 */
export async function updateSensorCurrentStateInSupabase(sensor) {
  try {
    const updatePayload = {
      last_moisture: Number(sensor.moisture),
      last_ph: Number(sensor.ph),
      last_temperature: Number(sensor.temperature),
      status: sensor.status,
      updated_at: new Date().toISOString(),
    };

    if (sensor.lat != null && !isNaN(Number(sensor.lat))) {
      updatePayload.latitude = Number(sensor.lat);
    }
    if (sensor.lng != null && !isNaN(Number(sensor.lng))) {
      updatePayload.longitude = Number(sensor.lng);
    }

    const { error } = await supabase
      .from("sensors")
      .update(updatePayload)
      .eq("id", sensor.id);

    if (error) {
      console.warn("Gagal update state sensor di Supabase:", error.message);
    }
  } catch (err) {
    console.warn("Supabase update error:", err);
  }
}

/**
 * Mengambil notifikasi terkini dari Supabase
 */
export async function fetchNotificationsFromSupabase(limit = 20) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}
