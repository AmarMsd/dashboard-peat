import { useEffect, useState } from "react";
import { DashboardFrame } from "../components/DashboardFrame.jsx";
import { AgentChat } from "../components/AgentChat.jsx";
import { useAgentSettings, reasonText } from "../lib/useAgentSettings";
import { fetchAgentUsage, fetchAgentNotifications, formatRelativeTime, supabase } from "../lib/supabase";

export function meta() {
  return [{ title: "Agent - PeatGuard" }];
}

const COOLDOWN_OPTIONS = [15, 30, 60, 120, 240, 720];

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ControlRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="m-0 text-sm font-semibold text-slate-900">{title}</p>
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              checked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {checked ? "Aktif" : "Nonaktif"}
          </span>
        </div>
        <p className="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs">
      <h2 className="m-0 text-sm font-bold tracking-tight text-slate-900">{title}</h2>
      {subtitle && <p className="m-0 mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

export default function AgentPage() {
  const { settings, status, isSaving, isOperator, unlock, lock, save } = useAgentSettings();
  const [usage, setUsage] = useState(null);
  const [aiNotifs, setAiNotifs] = useState([]);
  const [draft, setDraft] = useState({ cooldown_minutes: 60, daily_limit: 30, chat_daily_limit: 200 });
  const [message, setMessage] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const unavailable = status === "unavailable";
  const readOnly = unavailable || !isOperator;

  // Sinkronkan isian form dengan pengaturan tersimpan
  useEffect(() => {
    setDraft({
      cooldown_minutes: settings.cooldown_minutes,
      daily_limit: settings.daily_limit,
      chat_daily_limit: settings.chat_daily_limit,
    });
  }, [settings.cooldown_minutes, settings.daily_limit, settings.chat_daily_limit]);

  // Pemakaian & notifikasi AI (diperbarui berkala + saat ada notifikasi agent baru)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;
    async function load() {
      const [u, n] = await Promise.all([fetchAgentUsage(), fetchAgentNotifications(8)]);
      if (!isMounted) return;
      if (u) setUsage(u);
      if (n) setAiNotifs(n);
    }
    load();
    const interval = setInterval(load, 60000);
    const channel = supabase
      .channel(`agent-page-notifs-${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        if (payload.new?.source === "agent") load();
      })
      .subscribe();
    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleUnlock(e) {
    e.preventDefault();
    if (!pinInput) return;
    setIsUnlocking(true);
    const result = await unlock(pinInput);
    setIsUnlocking(false);
    setPinInput("");
    setMessage(result.ok ? { type: "ok", text: "Mode operator aktif. Pengaturan sekarang dapat diubah." } : { type: "error", text: reasonText(result.reason) });
  }

  async function handleToggle(field, value) {
    const result = await save({ [field]: value });
    setMessage(result.ok ? null : { type: "error", text: `Gagal menyimpan. ${reasonText(result.reason)}` });
  }

  async function handleSaveLimits(e) {
    e.preventDefault();
    const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
    const result = await save({
      cooldown_minutes: Number(draft.cooldown_minutes),
      daily_limit: clamp(draft.daily_limit, 1000),
      chat_daily_limit: clamp(draft.chat_daily_limit, 10000),
    });
    setMessage(
      result.ok
        ? { type: "ok", text: "Pengaturan penghemat token disimpan." }
        : { type: "error", text: `Gagal menyimpan. ${reasonText(result.reason)}` }
    );
  }

  const monitorUsed = usage?.monitor_24h ?? 0;
  const monitorPct = settings.daily_limit > 0 ? Math.min(100, Math.round((monitorUsed / settings.daily_limit) * 100)) : 100;

  return (
    <DashboardFrame active="Agent">
      <main className="min-w-0 flex-1 p-4.5 sm:p-6 lg:p-7">
        <div className="mb-5">
          <h1 className="m-0 text-lg sm:text-xl font-bold tracking-tight text-slate-900">AI Agent PeatGuard</h1>
          <p className="m-0 mt-1 text-xs text-slate-500">
            Tanya jawab dengan asisten AI dan lihat analisis otomatisnya. Pengaturan AI dikelola operator agar kuota tidak habis.
          </p>
        </div>

        {unavailable && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Tabel <code>agent_settings</code> belum ditemukan di Supabase. Jalankan ulang <code>supabase/schema.sql</code>,
            lalu muat ulang halaman ini. Sementara itu chat tetap aktif dengan pengaturan bawaan.
          </div>
        )}
        {message && (
          <div
            className={`mb-4 rounded-lg border p-3 text-xs ${
              message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="status"
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {/* Kolom kiri: kontrol & pemakaian */}
          <div className="space-y-4">
            <section className="rounded-lg border border-slate-200/90 bg-white p-4 shadow-2xs">
              {isOperator ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="m-0 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      Mode Operator
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">Pengaturan dapat diubah. PIN hanya tersimpan selama tab ini terbuka.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      lock();
                      setMessage(null);
                    }}
                    className="cursor-pointer rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="size-2 rounded-full bg-slate-400" aria-hidden="true" />
                      Mode Publik
                    </p>
                    <p className="m-0 mt-0.5 text-xs text-slate-500">Pengaturan hanya bisa dilihat. Operator dapat masuk dengan PIN.</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="sr-only" htmlFor="operator-pin">PIN operator</label>
                    <input
                      id="operator-pin"
                      type="password"
                      autoComplete="current-password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="PIN operator"
                      disabled={unavailable}
                      className="w-36 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={unavailable || isUnlocking || !pinInput}
                      className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUnlocking ? "Memeriksa…" : "Masuk"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <Card
              title="Kontrol Agent"
              subtitle={isOperator ? "Perubahan langsung berlaku di semua perangkat." : "Status saat ini. Hanya operator yang dapat mengubah."}
            >
              <div className="divide-y divide-slate-100">
                <ControlRow
                  title="Chat Asisten"
                  description="Petugas dapat bertanya ke AI dari dashboard. Token hanya terpakai saat ada pertanyaan."
                  checked={settings.chat_enabled}
                  onChange={(v) => handleToggle("chat_enabled", v)}
                  disabled={readOnly || isSaving}
                />
                <ControlRow
                  title="Agent Pemantau Otomatis"
                  description="AI menganalisis tren & menulis saran tindakan, hanya saat status berubah atau naik level. Peringatan berbasis aturan tetap berjalan walau ini dimatikan."
                  checked={settings.monitor_enabled}
                  onChange={(v) => handleToggle("monitor_enabled", v)}
                  disabled={readOnly || isSaving}
                />
              </div>
            </Card>

            <Card title="Penghemat Token" subtitle="Membatasi seberapa sering Agent Pemantau memanggil AI.">
              <form onSubmit={handleSaveLimits} className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Jeda antar-analisis per titik
                  <select
                    value={draft.cooldown_minutes}
                    onChange={(e) => setDraft((d) => ({ ...d, cooldown_minutes: e.target.value }))}
                    disabled={readOnly}
                    className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-500"
                  >
                    {COOLDOWN_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m < 60 ? `${m} menit` : `${m / 60} jam`}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block font-normal text-slate-500">Kecuali status naik ke Kritis.</span>
                </label>
                <label className="block text-xs font-semibold text-slate-700">
                  Batas analisis per 24 jam
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={draft.daily_limit}
                    onChange={(e) => setDraft((d) => ({ ...d, daily_limit: e.target.value }))}
                    disabled={readOnly}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-2.5 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-500"
                  />
                  <span className="mt-1 block font-normal text-slate-500">Setelah tercapai, AI berhenti sampai kuota pulih.</span>
                </label>
                <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
                  Batas chat publik per 24 jam
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={draft.chat_daily_limit}
                    onChange={(e) => setDraft((d) => ({ ...d, chat_daily_limit: e.target.value }))}
                    disabled={readOnly}
                    className="mt-1 block w-full rounded-md border border-slate-200 px-2.5 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-500 sm:w-1/2"
                  />
                  <span className="mt-1 block font-normal text-slate-500">
                    Total untuk semua pengunjung. Setelah tercapai, chat menjawab "kuota habis" tanpa memanggil AI.
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={readOnly || isSaving}
                    className="cursor-pointer rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </form>
            </Card>

            <Card title="Pemakaian 24 Jam Terakhir">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chat</p>
                  <p className="m-0 mt-0.5 text-lg font-bold text-slate-900">
                    {usage?.chat_24h ?? "–"}
                    <span className="text-xs font-medium text-slate-400"> / {settings.chat_daily_limit}</span>
                  </p>
                </div>
                <div>
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Analisis</p>
                  <p className="m-0 mt-0.5 text-lg font-bold text-slate-900">
                    {usage ? monitorUsed : "–"}
                    <span className="text-xs font-medium text-slate-400"> / {settings.daily_limit}</span>
                  </p>
                </div>
                <div>
                  <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Token</p>
                  <p className="m-0 mt-0.5 text-lg font-bold text-slate-900">
                    {usage?.tokens_24h ? Number(usage.tokens_24h).toLocaleString("id-ID") : "–"}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                <div
                  className={`h-full ${monitorPct >= 90 ? "bg-rose-500" : monitorPct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${monitorPct}%` }}
                />
              </div>
              <p className="m-0 mt-2 text-[11px] text-slate-500">
                Data dicatat oleh workflow n8n ke tabel <code>agent_runs</code> setiap kali AI benar-benar dipanggil.
              </p>
            </Card>

            <Card title="Analisis AI Terbaru">
              {aiNotifs.length === 0 ? (
                <p className="m-0 py-2 text-xs text-slate-400">Belum ada analisis dari Agent Pemantau.</p>
              ) : (
                <ul className="m-0 list-none divide-y divide-slate-100 p-0">
                  {aiNotifs.map((n) => (
                    <li key={n.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="m-0 truncate text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="shrink-0 text-[10px] text-slate-400">{formatRelativeTime(n.created_at)}</span>
                      </div>
                      <p className="m-0 mt-0.5 text-xs text-slate-600">{n.message}</p>
                      {n.recommendation && (
                        <p className="m-0 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Saran: </span>
                          {n.recommendation}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Kolom kanan: chat penuh */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <AgentChat variant="page" enabled={settings.chat_enabled} />
          </div>
        </div>
      </main>
    </DashboardFrame>
  );
}
