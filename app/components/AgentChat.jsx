import { useEffect, useRef, useState } from "react";
import { useAgentSettings } from "../lib/useAgentSettings";

// URL webhook dari node "When chat message received" (Chat Trigger) di n8n.
// Diisi lewat variabel lingkungan VITE_N8N_CHAT_URL (lihat .env.example).
const CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL || "";
const SESSION_KEY = "peatguard_agent_session_v1";
const MESSAGES_KEY = "peatguard_agent_messages_v1";
const REQUEST_TIMEOUT_MS = 60000;

const WELCOME_MESSAGE = {
  role: "assistant",
  text:
    "Halo, saya Asisten PeatGuard (AI). Saya bisa membaca data sensor terbaru, " +
    "melihat tren, dan memberi saran tindakan sesuai SOP. Silakan bertanya.",
};

const SUGGESTIONS = [
  "Bagaimana kondisi semua titik pantau sekarang?",
  "Titik mana yang paling berisiko dan apa yang harus dilakukan?",
  "Apakah Baleendah makin kering beberapa jam terakhir?",
];

function readSession(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function getSessionId() {
  let id = readSession(SESSION_KEY, null);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    writeSession(SESSION_KEY, id);
  }
  return id;
}

// Ambil teks balasan dari berbagai bentuk respons n8n
function extractReply(data) {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return extractReply(data[0]);
  return data.output ?? data.text ?? data.message ?? data.response ?? "";
}

// Render sederhana: baris baru dipertahankan, **tebal** jadi <strong>. Tanpa HTML mentah.
function FormattedText({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

/**
 * variant "floating" : tombol mengambang + panel pop-up (dipakai di semua halaman)
 * variant "page"     : panel chat penuh di dalam halaman /agent
 * enabled            : false bila chat dimatikan dari halaman Agent (hemat token)
 */
export function AgentChat({ variant = "floating", enabled = true }) {
  const isPage = variant === "page";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  // Pulihkan percakapan dari sessionStorage (hanya di browser)
  useEffect(() => {
    const saved = readSession(MESSAGES_KEY, null);
    if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
  }, []);

  useEffect(() => {
    writeSession(MESSAGES_KEY, messages.slice(-50));
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  async function sendMessage(text) {
    const chatInput = text.trim();
    if (!chatInput || isSending || !enabled) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: chatInput }]);

    if (!CHAT_URL) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: "Chat agent belum dikonfigurasi. Isi VITE_N8N_CHAT_URL di file .env lalu jalankan ulang dashboard.",
        },
      ]);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", sessionId: getSessionId(), chatInput }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await res.json() : await res.text();
      const reply = extractReply(data);

      setMessages((prev) => [
        ...prev,
        reply
          ? { role: "assistant", text: reply }
          : { role: "error", text: "Agent tidak mengirim jawaban. Periksa node terakhir workflow n8n." },
      ]);
    } catch (err) {
      const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          text: isTimeout
            ? "Agent terlalu lama merespons. Coba lagi beberapa saat lagi."
            : `Gagal menghubungi agent (${err.message}). Pastikan workflow n8n aktif dan domain dashboard diizinkan.`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function resetConversation() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(MESSAGES_KEY);
    } catch (e) {}
    setMessages([WELCOME_MESSAGE]);
  }

  const showSuggestions = messages.length <= 1 && !isSending;

  const chatPanel = (
    <section
      id={isPage ? undefined : "peatguard-agent-chat"}
      className={
        isPage
          ? "flex h-[calc(100vh-9rem)] min-h-[460px] w-full flex-col overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-2xs"
          : "fixed bottom-20 right-5 z-[70] flex h-[min(560px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
      }
      aria-label="Chat Asisten PeatGuard"
    >
      <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div>
          <h2 className="m-0 text-sm font-semibold text-slate-800">Asisten PeatGuard</h2>
          <p className="m-0 text-[11px] text-slate-500">
            {enabled ? "AI · jawaban perlu dicek ulang di lapangan" : "Chat sedang dinonaktifkan"}
          </p>
        </div>
        <button
          type="button"
          onClick={resetConversation}
          className="cursor-pointer shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="Mulai percakapan baru"
        >
          Percakapan baru
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-[#2563eb] text-white"
                  : m.role === "error"
                  ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
                  : "rounded-bl-sm bg-slate-100 text-slate-800"
              }`}
            >
              <FormattedText text={m.text} />
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-bl-sm bg-slate-100 px-3 py-2 text-sm text-slate-500">
              Agent sedang memeriksa data…
            </div>
          </div>
        )}

        {!enabled && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Chat asisten sedang <strong>nonaktif</strong> untuk menghemat token. Aktifkan kembali melalui
            tombol <strong>Chat Asisten</strong> di halaman Agent.
          </div>
        )}

        {enabled && showSuggestions && (
          <div className="space-y-1.5 pt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="cursor-pointer block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50/60"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2 border-t border-slate-100 p-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          rows={1}
          maxLength={1000}
          disabled={!enabled}
          placeholder={enabled ? "Tulis pertanyaan…" : "Chat nonaktif"}
          className="max-h-28 min-h-[38px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50"
          aria-label="Pertanyaan untuk asisten"
        />
        <button
          type="submit"
          disabled={!enabled || isSending || !input.trim()}
          className="cursor-pointer rounded-lg bg-[#2563eb] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </section>
  );

  if (isPage) return chatPanel;
  if (!enabled) return null; // tombol mengambang disembunyikan saat chat dimatikan

  return (
    <>
      {/* Tombol mengambang */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="cursor-pointer fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-expanded={isOpen}
        aria-controls="peatguard-agent-chat"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="max-[480px]:hidden">{isOpen ? "Tutup Asisten" : "Tanya Asisten AI"}</span>
      </button>

      {isOpen && chatPanel}
    </>
  );
}

// Tombol chat mengambang yang mengikuti pengaturan on/off di halaman Agent
export function FloatingAgentChat() {
  const { settings } = useAgentSettings();
  return <AgentChat variant="floating" enabled={settings.chat_enabled} />;
}
