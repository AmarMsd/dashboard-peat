import { useState, useEffect, useRef } from "react";
import { Footer } from "./Footer.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { AgentChat } from "./AgentChat.jsx";
import { useSensorData } from "../context/SensorContext";
import {
  supabase,
  fetchNotificationsFromSupabase,
  mapSupabaseNotification,
  formatRelativeTime,
  markNotificationReadInSupabase,
  markAllNotificationsReadInSupabase,
} from "../lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
// Data cadangan lokal jika backend FastAPI belum dinyalakan
const FALLBACK_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Kondisi Gambut Kering (Waspada)",
    message: "Baleendah mencatat kelembapan 41.8%. Periksa ketersediaan air kanal.",
    type: "warning",
    timestamp: "2 menit lalu",
    is_read: false,
    url: "/peringatan",
  },
  {
    id: "notif-2",
    title: "Peningkatan Suhu Lapisan Gambut",
    message: "Suhu di Baleendah terdeteksi 33.7°C, mendekati ambang batas hotspot panas permukaan.",
    type: "warning",
    timestamp: "15 menit lalu",
    is_read: false,
    url: "/peringatan",
  },
  {
    id: "notif-3",
    title: "Telemetri Realtime MQTT Aktif",
    message: "Koneksi websocket wss://mqtt.amarmsd.my.id terhubung secara stabil untuk 3 titik pantau.",
    type: "info",
    timestamp: "1 jam lalu",
    is_read: true,
    url: "/",
  },
  {
    id: "notif-4",
    title: "Kondisi Gambut Aman Terhidrasi",
    message: "Rancaupas mencatat kelembapan stabil di atas 70% dan keasaman 4.6 pH.",
    type: "success",
    timestamp: "2 jam lalu",
    is_read: true,
    url: "/kondisi-lahan",
  },
];

export function DashboardFrame({ active, children }) {
  const { connectionStatus, refreshConnection, sensors } = useSensorData();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Notification State
  const [notifications, setNotifications] = useState(FALLBACK_NOTIFICATIONS);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // 1. Ambil notifikasi.
  //    Sumber utama: tabel `notifications` Supabase (diisi bridge & agent n8n) + realtime.
  //    Cadangan: backend FastAPI, lalu data lokal.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;
    let usingSupabase = false;

    async function fetchFromFastApi() {
      try {
        const res = await fetch(`${API_BASE}/notifications`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setNotifications((data.notifications || []).map((n) => ({ ...n, origin: "fastapi" })));
          }
        }
      } catch (err) {
        // Backend offline, tetap memakai notifikasi lokal
      }
    }

    async function loadNotifications() {
      const rows = await fetchNotificationsFromSupabase(20);
      if (!isMounted) return;
      if (rows) {
        usingSupabase = true;
        setNotifications(rows.map(mapSupabaseNotification));
      } else {
        await fetchFromFastApi();
      }
    }

    loadNotifications();

    // Realtime: notifikasi baru (mis. dari agent n8n) langsung muncul tanpa reload
    const channel = supabase
      .channel("realtime-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        if (!payload.new) return;
        const item = mapSupabaseNotification(payload.new);
        setNotifications((prev) => [item, ...prev.filter((n) => n.id !== item.id)].slice(0, 20));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => {
        if (!payload.new) return;
        const item = mapSupabaseNotification(payload.new);
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? item : n)));
      })
      .subscribe();

    // Perbarui label waktu relatif & polling cadangan FastAPI
    const interval = setInterval(() => {
      if (usingSupabase) {
        setNotifications((prev) =>
          prev.map((n) => (n.created_at ? { ...n, timestamp: formatRelativeTime(n.created_at) } : n))
        );
      } else {
        fetchFromFastApi();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Fetch Pencarian dari Backend FastAPI atau fallback client-side
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setSearchResults(data.results || []);
            return;
          }
        }
      } catch (e) {
        // Fallback pencarian client-side jika backend tidak aktif
        const q = searchQuery.toLowerCase().trim();
        const localResults = [];

        // Cocokkan sensor
        sensors.forEach((s) => {
          if (
            s.name.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.region.toLowerCase().includes(q)
          ) {
            localResults.push({
              id: s.id,
              title: s.name,
              category: "sensor",
              subtitle: `${s.id} · ${s.region} · ${s.moisture}% kelembapan`,
              status: s.status,
              url: "/riwayat",
            });
          }
        });

        // Cocokkan menu halaman
        const pages = [
          { title: "Dashboard Utama", url: "/", cat: "halaman", sub: "Ringkasan metrik dan peta gambut" },
          { title: "Riwayat Data & Tren", url: "/riwayat", cat: "halaman", sub: "Data dan grafik tren waktu" },
          { title: "Peta Sensor", url: "/peta-sensor", cat: "halaman", sub: "Peta persebaran Leaflet interaktif" },
          { title: "Kondisi Lahan", url: "/kondisi-lahan", cat: "halaman", sub: "Analisis kelembapan, pH, dan suhu" },
          { title: "Peringatan", url: "/peringatan", cat: "halaman", sub: "Daftar titik kritis / waspada" },
          { title: "Laporan", url: "/laporan", cat: "halaman", sub: "Ekspor riwayat CSV dan rekap" },
        ];

        pages.forEach((p) => {
          if (p.title.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) {
            localResults.push({
              id: p.url,
              title: p.title,
              category: "halaman",
              subtitle: p.sub,
              status: null,
              url: p.url,
            });
          }
        });

        if (isMounted) setSearchResults(localResults);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery, sensors]);

  // Click Outside Listener untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tandai notifikasi spesifik sebagai dibaca
  const markNotificationAsRead = async (id, targetUrl) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    if (target?.origin === "supabase") {
      await markNotificationReadInSupabase(id);
    } else {
      try {
        await fetch(`${API_BASE}/notifications/${id}/read`, { method: "POST" });
      } catch (e) {}
    }

    setIsNotifOpen(false);
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  };

  // Tandai semua notifikasi dibaca
  const markAllAsRead = async () => {
    const fromSupabase = notifications.some((n) => n.origin === "supabase");
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (fromSupabase) {
      await markAllNotificationsReadInSupabase();
    } else {
      try {
        await fetch(`${API_BASE}/notifications/mark-all-read`, { method: "POST" });
      } catch (e) {}
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header with z-50 to stay above page content */}
        <header className="relative flex h-14 items-center gap-3 border-b border-slate-200/90 bg-white px-5 shadow-2xs lg:px-7 z-50">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>PeatGuard</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">{active}</span>
          </div>

          {/* Search Bar with Autocomplete Dropdown */}
          <div ref={searchContainerRef} className="relative ml-auto w-full max-w-xs">
            <div className="flex h-8.5 items-center gap-2 rounded-md bg-slate-100/80 px-2.5 text-xs text-slate-600 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white border border-slate-200/60 focus-within:border-blue-500 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400 text-xs"
                placeholder="Cari titik sensor atau menu..."
                aria-label="Cari titik sensor"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Dropdown Popup */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-10 mt-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl z-60 max-h-80 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Hasil Pencarian ({searchResults.length})
                </div>
                {searchResults.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    Tidak ditemukan hasil untuk "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {searchResults.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        onClick={() => setIsSearchOpen(false)}
                        className="cursor-pointer flex items-center justify-between gap-2 rounded-md p-2 hover:bg-slate-50 transition-colors no-underline group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                              {item.title}
                            </span>
                            <span className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                              item.category === "sensor" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {item.category}
                            </span>
                          </div>
                          <p className="m-0 truncate text-[11px] text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                        {item.status && (
                          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${
                            item.status === "normal"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notification Bell with Badge & Dropdown */}
          <div ref={notifContainerRef} className="relative">
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="cursor-pointer relative grid size-8.5 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              type="button"
              aria-label="Notifikasi"
              title="Notifikasi Lahan"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-red-500 border-2 border-white"></span>
                </span>
              )}
            </button>

            {/* Notification Popover */}
            {isNotifOpen && (
              <div className="absolute right-0 top-10 mt-1 w-80 sm:w-96 rounded-lg border border-slate-200 bg-white shadow-xl z-60 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/80">
                  <div className="flex items-center gap-2">
                    <h3 className="m-0 text-xs font-bold text-slate-800">Notifikasi Lahan</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi saat ini
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const iconBg =
                        n.type === "critical"
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : n.type === "warning"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : n.type === "success"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200";

                      return (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id, n.url)}
                          className={`cursor-pointer flex items-start gap-3 p-3 transition-colors ${
                            !n.is_read ? "bg-blue-50/30 hover:bg-blue-50/60" : "hover:bg-slate-50"
                          }`}
                        >
                          <span className={`grid size-6.5 shrink-0 place-items-center rounded-md text-[11px] font-bold ${iconBg}`}>
                            {n.type === "critical" ? "!" : n.type === "warning" ? "⚠" : n.type === "success" ? "✓" : "ℹ"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="m-0 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-800">
                                {n.source === "agent" && (
                                  <span className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-700" title="Dibuat oleh AI Agent">
                                    AI
                                  </span>
                                )}
                                <span className="truncate">{n.title}</span>
                              </h4>
                              {!n.is_read && (
                                <span className="size-1.5 rounded-full bg-blue-600 shrink-0" title="Belum dibaca"></span>
                              )}
                            </div>
                            <p className="m-0 mt-0.5 text-xs text-slate-600 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                            {n.recommendation && (
                              <p className="m-0 mt-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 leading-snug line-clamp-3">
                                <span className="font-semibold text-slate-700">Saran: </span>
                                {n.recommendation}
                              </p>
                            )}
                            <span className="mt-1 block text-[10px] text-slate-400">
                              {n.timestamp}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-100 p-2 text-center bg-slate-50/60">
                  <a
                    href="/peringatan"
                    onClick={() => setIsNotifOpen(false)}
                    className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Lihat Semua Status Peringatan Lahan →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#2563eb] text-xs font-bold text-white shadow-2xs">
            AM
          </span>
        </header>

        {children}
        <Footer />
      </div>
      <AgentChat />

    </div>
  );
}
