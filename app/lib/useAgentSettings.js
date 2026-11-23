import { useEffect, useState } from "react";
import { supabase, fetchAgentSettings, updateAgentSettings } from "./supabase";

// Nilai bawaan dipakai bila tabel agent_settings belum dibuat di Supabase,
// supaya chat tetap berfungsi seperti sebelumnya.
export const DEFAULT_AGENT_SETTINGS = {
  chat_enabled: true,
  monitor_enabled: false,
  cooldown_minutes: 60,
  daily_limit: 30,
};

/**
 * Membaca & mengubah pengaturan AI Agent, tersinkron realtime antar-tab/perangkat.
 * status: "loading" | "ready" | "unavailable" (tabel belum ada / Supabase tidak terjangkau)
 */
export function useAgentSettings() {
  const [settings, setSettings] = useState(DEFAULT_AGENT_SETTINGS);
  const [status, setStatus] = useState("loading");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;

    fetchAgentSettings().then((row) => {
      if (!isMounted) return;
      if (row) {
        setSettings(row);
        setStatus("ready");
      } else {
        setStatus("unavailable");
      }
    });

    const channel = supabase
      .channel(`realtime-agent-settings-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agent_settings" }, (payload) => {
        if (payload.new) setSettings(payload.new);
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Simpan perubahan; tampilan diperbarui lebih dulu lalu dikembalikan bila gagal.
  async function save(patch) {
    const previous = settings;
    setSettings((s) => ({ ...s, ...patch }));
    setIsSaving(true);
    const row = await updateAgentSettings(patch);
    setIsSaving(false);
    if (row) {
      setSettings(row);
      return true;
    }
    setSettings(previous);
    return false;
  }

  return { settings, status, isSaving, save };
}
