// Proxy chat: browser -> /api/chat (server dashboard) -> webhook Chat Trigger n8n.
//
// Keuntungan dibanding browser memanggil n8n langsung:
//  - Tidak ada masalah CORS (browser hanya bicara dengan domain dashboard sendiri).
//  - URL webhook n8n tidak terlihat oleh pengunjung.
//
// URL n8n dibaca dari variabel lingkungan SERVER `N8N_CHAT_URL` (bukan VITE_*),
// sehingga bisa diganti tanpa build ulang.

const MAX_INPUT_LENGTH = 1000;
const UPSTREAM_TIMEOUT_MS = 60000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function loader() {
  return json({ error: "Gunakan metode POST." }, 405);
}

export async function action({ request }) {
  if (request.method !== "POST") {
    return json({ error: "Gunakan metode POST." }, 405);
  }

  const upstreamUrl = process.env.N8N_CHAT_URL;
  if (!upstreamUrl) {
    return json({ error: "N8N_CHAT_URL belum diatur di server dashboard." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Format permintaan tidak valid." }, 400);
  }

  const chatInput = typeof body?.chatInput === "string" ? body.chatInput.trim() : "";
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 100) : "";
  if (!chatInput || !sessionId) {
    return json({ error: "chatInput dan sessionId wajib diisi." }, 400);
  }
  if (chatInput.length > MAX_INPUT_LENGTH) {
    return json({ error: `Pertanyaan terlalu panjang (maks. ${MAX_INPUT_LENGTH} karakter).` }, 413);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Hanya field yang dibutuhkan Chat Trigger yang diteruskan.
      body: JSON.stringify({ action: "sendMessage", sessionId, chatInput }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.warn(`[api/chat] n8n membalas HTTP ${upstream.status}: ${text.slice(0, 200)}`);
      return json({ error: `Agent membalas HTTP ${upstream.status}.` }, 502);
    }

    // Teruskan apa adanya; widget dapat membaca JSON maupun teks biasa.
    const contentType = upstream.headers.get("content-type") || "application/json";
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (err) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    console.warn("[api/chat] Gagal menghubungi n8n:", err?.message);
    return json({ error: isTimeout ? "Agent terlalu lama merespons." : "Tidak dapat menghubungi agent." }, isTimeout ? 504 : 502);
  }
}
