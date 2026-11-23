import { useState } from "react";
import { PEAT_FIRE_THRESHOLDS } from "../data/sensors";

export function ThresholdReferenceCard({ defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-xs">
            ℹ
          </span>
          <div>
            <h3 className="m-0 text-sm font-semibold text-gray-900">
              Landasan Ilmiah Ambang Batas (Threshold) Deteksi Kebakaran Gambut
            </h3>
            <p className="m-0 mt-0.5 text-xs text-gray-500">
              Klasifikasi status Aman, Waspada, dan Kritis berdasarkan riset internasional & standar BRGM
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 transition"
        >
          {isOpen ? "Tutup Panduan Ambang Batas ▲" : "Lihat Rincian Ambang Batas & Rujukan Ilmiah ▼"}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-blue-100 text-gray-700 space-y-4">
          {/* Matriks Parameter */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Kelembapan */}
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                <span className="text-xs font-bold text-gray-900">1. Kelembapan Tanah (Moisture %)</span>
                <span className="text-[10px] font-mono text-blue-600 font-semibold">Indikator Utama</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-emerald-500"></span>
                  <div>
                    <strong className="text-emerald-700">≥ 60% — Aman:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Air pori gambut mencukupi; api bara (smouldering) padam dengan sendirinya.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-amber-500"></span>
                  <div>
                    <strong className="text-amber-700">40% – 59.9% — Waspada:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Gambut mulai mengering; bara api dapat merambat perlahan jika tersulut percikan/angin.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-rose-500"></span>
                  <div>
                    <strong className="text-rose-700">&lt; 40% — Bahaya / Kritis:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Batas kritis hidrofobisitas (CME); gambut sangat mudah terbakar dan bara bawah tanah bertahan lama.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Suhu */}
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                <span className="text-xs font-bold text-gray-900">2. Suhu Tanah (Temp °C)</span>
                <span className="text-[10px] font-mono text-amber-600 font-semibold">Deteksi Bara</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-emerald-500"></span>
                  <div>
                    <strong className="text-emerald-700">25.0°C – 31.9°C — Aman:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Suhu mikroklimat tanah gambut tropis alami yang terhidrasi.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-amber-500"></span>
                  <div>
                    <strong className="text-amber-700">32.0°C – 34.9°C — Waspada:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Radiasi panas permukaan ekstrem; laju penguapan/kekeringan gambut meningkat tajam.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-rose-500"></span>
                  <div>
                    <strong className="text-rose-700">≥ 35.0°C — Bahaya / Kritis:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Anomali panas termal; indikasi kuat keberadaan bara api bawah tanah (subsurface hotspot).</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Derajat Keasaman pH */}
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                <span className="text-xs font-bold text-gray-900">3. Derajat Keasaman (pH)</span>
                <span className="text-[10px] font-mono text-teal-600 font-semibold">Kesehatan Ekosistem</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-teal-500"></span>
                  <div>
                    <strong className="text-teal-700">pH 3.5 – 5.0 — Normal Gambut:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Tingkat keasaman alami gambut oligotropik tropis Indonesia.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-amber-500"></span>
                  <div>
                    <strong className="text-amber-700">&lt; 3.2 — Anomali Asam Pirit:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Terjadi oksidasi lapisan pirit (FeS₂) akibat drainase berlebihan / kekeringan kronis.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 size-2 rounded-full bg-purple-500"></span>
                  <div>
                    <strong className="text-purple-700">&gt; 5.5 — Anomali Abu Karhutla:</strong>
                    <p className="m-0 text-[11px] text-gray-500">Pelepasan kation basa (Ca/Mg) dari abu sisa pembakaran gambut.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Rujukan Paper Ilmiah */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="m-0 text-xs font-semibold text-gray-800 flex items-center gap-1.5 mb-2">
              <span>📚</span> Rujukan Paper Penelitian & Regulasi Terkait:
            </p>
            <ol className="m-0 pl-4 space-y-1 text-[11px] text-gray-600 list-decimal">
              {PEAT_FIRE_THRESHOLDS.references.map((ref, idx) => (
                <li key={idx}>
                  <span className="font-semibold text-gray-800">{ref.authors}.</span>{" "}
                  <em>"{ref.title}"</em>. <span className="text-gray-500">{ref.journal}.</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
