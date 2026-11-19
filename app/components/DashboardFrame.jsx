import { Footer } from "./Footer.jsx";
import { Sidebar } from "./Sidebar.jsx";

export function DashboardFrame({ active, children }) {
  return (
    <div className="flex min-h-screen bg-[#f0f2f7]">
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-5 shadow-sm lg:px-7">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-medium text-gray-700">{active}</span>
          </div>

          {/* Search */}
          <label className="ml-auto flex h-9 min-w-0 max-w-xs flex-1 items-center gap-2 rounded-lg bg-gray-100 px-3 text-sm text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="min-w-0 flex-1 bg-transparent text-gray-700 outline-none placeholder:text-gray-400"
              placeholder="Cari sensor..."
              aria-label="Cari sensor atau wilayah"
            />
          </label>

          {/* Bell */}
          <button
            className="grid size-9 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            type="button"
            aria-label="Notifikasi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          {/* Avatar */}
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
            AM
          </span>
        </header>

        {children}
        <Footer />
      </div>
    </div>
  );
}
