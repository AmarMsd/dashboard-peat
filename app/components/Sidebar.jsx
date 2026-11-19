const navigation = [
  { label: "Dashboard", href: "/", icon: IconHome },
  { label: "Peta Sensor", href: "/peta-sensor", icon: IconMapPin },
  { label: "Kondisi Lahan", href: "/kondisi-lahan", icon: IconDroplets },
  { label: "Peringatan", href: "/peringatan", icon: IconBell },
  { label: "Laporan", href: "/laporan", icon: IconFileText },
];

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function IconDroplets() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconFileText() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

export function Sidebar({ active = "Dashboard" }) {
  return (
    <aside
      className="flex w-56 shrink-0 flex-col bg-[#1e2d4e] px-3 py-5 max-[640px]:w-14 max-[640px]:items-center max-[640px]:px-0"
      aria-label="Sidebar navigasi"
    >
      {/* Logo */}
      <a
        className="mb-8 flex items-center gap-3 px-2 text-white no-underline"
        href="/"
        aria-label="PeatGuard halaman utama"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">
          P
        </span>
        <span className="text-sm font-semibold tracking-tight max-[640px]:hidden">PeatGuard</span>
      </a>

      {/* Nav */}
      <nav aria-label="Navigasi utama" className="flex-1">
        <ul className="flex flex-col gap-1">
          {navigation.map(({ label, href, icon: Icon }) => {
            const isActive = label === active;
            return (
              <li key={label}>
                <a
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors no-underline max-[640px]:justify-center max-[640px]:px-0 max-[640px]:size-10 ${
                    isActive
                      ? "bg-[#2563eb] text-white"
                      : "text-[#94a3b8] hover:bg-white/10 hover:text-white"
                  }`}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="shrink-0"><Icon /></span>
                  <span className="max-[640px]:hidden">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom help */}
      <div className="mt-auto px-2 max-[640px]:px-0">
        <button
          className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-sm text-[#94a3b8] transition-colors hover:text-white max-[640px]:justify-center"
          type="button"
          aria-label="Bantuan"
          title="Bantuan"
        >
          <IconHelp />
          <span className="max-[640px]:hidden text-xs">Bantuan</span>
        </button>
        <div className="mt-3 flex items-center gap-2 rounded-lg px-1 py-2 max-[640px]:justify-center">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
            AM
          </span>
          <span className="min-w-0 max-[640px]:hidden">
            <p className="m-0 truncate text-xs font-medium text-white">Admin</p>
            <p className="m-0 truncate text-[10px] text-[#94a3b8]">PeatGuard</p>
          </span>
        </div>
      </div>
    </aside>
  );
}
