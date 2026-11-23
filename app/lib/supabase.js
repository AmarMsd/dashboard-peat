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
 * Mengambil status titik sensor terkini dari tabel sensors Supabase
 */
export async function fetchSensorsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from("sensors")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.warn("Notice Supabase sensors:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Supabase fetch sensors error:", err);
    return null;
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

/**
 * Mengubah waktu menjadi teks relatif, mis. "5 menit lalu"
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 1000));
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Menyamakan bentuk baris tabel notifications Supabase dengan bentuk
 * notifikasi yang dipakai komponen header dashboard.
 */
export function mapSupabaseNotification(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    recommendation: row.recommendation || null,
    type: row.severity || "info",
    source: row.source || "sistem",
    sensor_id: row.sensor_id,
    created_at: row.created_at,
    timestamp: formatRelativeTime(row.created_at),
    is_read: Boolean(row.is_read),
    url: row.sensor_id ? "/peringatan" : "/",
    origin: "supabase",
  };
}

/**
 * Menandai satu notifikasi sebagai sudah dibaca di Supabase
 */
export async function markNotificationReadInSupabase(id) {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) console.warn("Gagal menandai notifikasi:", error.message);
  } catch (err) {
    console.warn("Supabase update notifikasi error:", err);
  }
}

/**
 * Menandai semua notifikasi yang belum dibaca sebagai sudah dibaca di Supabase
 */
export async function markAllNotificationsReadInSupabase() {
  try {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    if (error) console.warn("Gagal menandai semua notifikasi:", error.message);
  } catch (err) {
    console.warn("Supabase update notifikasi error:", err);
  }
}
