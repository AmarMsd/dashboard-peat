import { useState, useMemo } from "react";

export function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = "Cari data...",
  defaultSortKey = null,
  defaultSortDir = "desc",
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 10,
  emptyMessage = "Tidak ada data yang ditemukan",
}) {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: defaultSortKey || (columns[0]?.key ?? ""),
    direction: defaultSortDir,
  });

  // Handle Sort
  const handleSort = (key, sortable = true) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // 1. Filter Data by Search Query across all fields
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery]);

  // 2. Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      // Handle null/undefined
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      // Try numeric comparison
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB) && typeof valA !== "boolean" && typeof valB !== "boolean") {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 3. Paginate Data
  const totalEntries = sortedData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Generate pagination buttons array (with ellipsis)
  const paginationRange = useMemo(() => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= validCurrentPage - delta && i <= validCurrentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [totalPages, validCurrentPage]);

  return (
    <div className="w-full text-gray-800">
      {/* DataTables Top Toolbar: Length Menu & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-white">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-2xs hover:border-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt} className="cursor-pointer">
                {opt}
              </option>
            ))}
          </select>
          <span>entri per halaman</span>
        </div>

        {/* Live Search Input */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <label htmlFor="dt-search" className="font-medium text-gray-700">
            Cari:
          </label>
          <div className="relative">
            <input
              id="dt-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-48 sm:w-60 rounded-md border border-gray-300 bg-white px-3 py-1.5 pl-8 text-xs text-gray-700 shadow-2xs placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm border-collapse">
          <thead className="bg-[#f8fafc] text-xs font-semibold text-gray-600 border-b border-gray-200 uppercase tracking-wider">
            <tr>
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key;
                const isSortable = col.sortable !== false;

                return (
                  <th
                    key={col.key}
                    onClick={() => isSortable && handleSort(col.key, isSortable)}
                    className={`px-5 py-3.5 select-none ${
                      isSortable ? "cursor-pointer hover:bg-gray-100/90 transition-colors" : ""
                    } ${col.headerAlign === "right" ? "text-right" : col.headerAlign === "center" ? "text-center" : "text-left"}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.headerAlign === "right" ? "justify-end w-full" : col.headerAlign === "center" ? "justify-center w-full" : ""
                      }`}
                    >
                      <span className={isSortable ? "cursor-pointer" : ""}>{col.label}</span>
                      {isSortable && (
                        <span className="cursor-pointer inline-flex flex-col text-[10px] leading-[8px] text-gray-400">
                          {isSorted ? (
                            sortConfig.direction === "asc" ? (
                              <span className="text-blue-600 font-bold">▲</span>
                            ) : (
                              <span className="text-blue-600 font-bold">▼</span>
                            )
                          ) : (
                            <span className="opacity-40 hover:opacity-100">⇅</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-sm text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="hover:bg-blue-50/40 transition-colors odd:bg-white even:bg-slate-50/40"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 text-xs ${
                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DataTables Bottom Toolbar: Info & Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-gray-200 bg-[#f8fafc]/60">
        {/* Info text */}
        <p className="m-0 text-xs text-gray-500">
          {totalEntries === 0 ? (
            "Menampilkan 0 entri"
          ) : (
            <>
              Menampilkan <span className="font-medium text-gray-800">{startIndex + 1}</span> sampai{" "}
              <span className="font-medium text-gray-800">{Math.min(startIndex + pageSize, totalEntries)}</span> dari{" "}
              <span className="font-medium text-gray-800">{totalEntries}</span> entri
              {searchQuery && data.length !== totalEntries && (
                <span className="text-gray-400"> (disaring dari {data.length} total entri)</span>
              )}
            </>
          )}
        </p>

        {/* Numbered Pagination Buttons */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className="cursor-pointer disabled:cursor-not-allowed rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Sebelumnya
          </button>

          {/* Number Buttons */}
          {paginationRange.map((pageNumber, idx) => {
            if (pageNumber === "...") {
              return (
                <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-gray-400 select-none">
                  ...
                </span>
              );
            }

            const isActive = pageNumber === validCurrentPage;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`cursor-pointer min-w-[28px] rounded px-2 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-[#2563eb] text-white border border-[#2563eb] shadow-2xs font-semibold"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages || totalEntries === 0}
            className="cursor-pointer disabled:cursor-not-allowed rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
