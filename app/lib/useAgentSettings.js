import { useEffect, useState } from "react";
import { supabase, fetchAgentSettings, updateAgentSettings } from "./supabase";

// Nilai bawaan dipakai bila tabel agent_settings belum dibuat di Supabase,
// supaya chat tetap berfungsi seperti sebelumnya.
export const DEFAULT_AGENT_SETTINGS = {
  chat_enabled: true,
  monitor_enabled: false,
  cooldown_minutes: 60,
  daily_limit: 30,
  chat_daily_limit: 200,
};

// PIN operator hanya disimpan selama tab terbuka (sessionStorage), tidak permanen.
const PIN_KEY = "peatguard_operator_pin";

const REASON_TEXT = {
  invalid: "PIN salah.",
  locked: "Terlalu banyak percobaan salah. Coba lagi dalam 15 menit.",
  not_set: "PIN operator belum diatur. Jalankan set_agent_admin_pin() di SQL Editor Supabase.",
  error: "Tidak dapat menghubungi Supabase. Pastikan schema.sql terbaru sudah dijalankan.",
};

export function reasonText(reason) {
  return REASON_TEXT[reason] || REASON_TEXT.error;
}

function readPin() {
  try {
    return sessionStorage.getItem(PIN_KEY) || "";
  } catch (e) {
    return "";
  }
}

function writePin(pin) {
  try {
    if (pin) sessionStorage.setItem(PIN_KEY, pin);
    else sessionStorage.removeItem(PIN_KEY);
  } catch (e) {}
}

/**
 * Membaca pengaturan AI Agent (publik, read-only) dan mengubahnya dalam mode operator (PIN).
 * status: "loading" | "ready" | "unavailable" (tabel belum ada / Supabase tidak terjangkau)
 */
export function useAgentSettings() {
  const [settings, setSettings] = useState(DEFAULT_AGENT_SETTINGS);
  const [status, setStatus] = useState("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [operatorPin, setOperatorPin] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;
    setOperatorPin(readPin());

    fetchAgentSettings().then((row) => {
      if (!isMounted) return;
      if (row) {
        setSettings({ ...DEFAULT_AGENT_SETTINGS, ...row });
        setStatus("ready");
      } else {
        setStatus("unavailable");
      }
    });

    const channel = supabase
      .channel(`realtime-agent-settings-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agent_settings" }, (payload) => {
        if (payload.new) setSettings((s) => ({ ...s, ...payload.new }));
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Masuk mode operator: PIN diperiksa di database, bukan di browser.
  async function unlock(pin) {
    const result = await updateAgentSettings(pin, {});
    if (result.ok) {
      writePin(pin);
      setOperatorPin(pin);
      if (result.settings) setSettings((s) => ({ ...s, ...result.settings }));
    }
    return result;
  }

  function lock() {
    writePin("");
    setOperatorPin("");
  }

  // Simpan perubahan (hanya mode operator). Tampilan diperbarui dulu, dikembalikan bila gagal.
  async function save(patch) {
    if (!operatorPin) return { ok: false, reason: "invalid" };
    const previous = settings;
    setSettings((s) => ({ ...s, ...patch }));
    setIsSaving(true);
    const result = await updateAgentSettings(operatorPin, patch);
    setIsSaving(false);
    if (result.ok && result.settings) {
      setSettings((s) => ({ ...s, ...result.settings }));
    } else {
      setSettings(previous);
      if (result.reason === "invalid" || result.reason === "locked") lock();
    }
    return result;
  }

  return { settings, status, isSaving, isOperator: Boolean(operatorPin), unlock, lock, save };
}
