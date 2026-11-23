import { useSensorData } from "../context/SensorContext";

// Footer untuk dashboard publik: penjelasan singkat, kontak darurat, dan transparansi data.
export function Footer() {
  const { sensors, lastMessageTime } = useSensorData();
  const lastUpdate = lastMessageTime
    ? new Date(lastMessageTime).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    : "menunggu data";

  return (
    <footer id="bantuan" className="mt-auto border-t border-slate-200/90 bg-white">
      <div className="grid gap-6 px-5 py-6 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-3 lg:px-7">
        <section>
          <h2 className="m-0 text-sm font-bold text-slate-900">PeatGuard</h2>
          <p className="m-0 mt-1.5 leading-relaxed">
            Pemantauan dan peringatan dini kebakaran lahan gambut berbasis sensor IoT, terbuka untuk umum.
          </p>
          <p className="m-0 mt-2 leading-relaxed text-slate-500">
            Status di dashboard ini dihitung otomatis dari sensor dan <strong className="text-slate-700">bukan</strong> penetapan
            status siaga/darurat resmi. Penetapan resmi dilakukan oleh pemerintah daerah dan BPBD.
          </p>
        </section>

        <section>
          <h2 className="m-0 text-sm font-bold text-slate-900">Melihat api atau asap?</h2>
          <ul className="m-0 mt-1.5 list-none space-y-1.5 p-0">
            <li>
              <a href="tel:112" className="cursor-pointer inline-flex items-center gap-2 font-semibold text-rose-600 no-underline hover:underline">
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-bold">112</span>
                Layanan Panggilan Darurat
              </a>
            </li>
            <li>BPBD kabupaten/kota setempat</li>
            <li>Daops Manggala Agni atau Masyarakat Peduli Api terdekat</li>
          </ul>
          <p className="m-0 mt-2 text-slate-500">Jangan mencoba memadamkan bara gambut sendirian.</p>
        </section>

        <section className="sm:col-span-2 lg:col-span-1">
          <h2 className="m-0 text-sm font-bold text-slate-900">Tentang data</h2>
          <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-slate-500">Sumber</dt>
            <dd className="m-0">{sensors.length} titik sensor (kelembapan, pH, suhu)</dd>
            <dt className="text-slate-500">Pembaruan</dt>
            <dd className="m-0">{lastUpdate}</dd>
            <dt className="text-slate-500">Ambang batas</dt>
            <dd className="m-0">
              <a href="/kondisi-lahan#rujukan" className="cursor-pointer text-blue-600 no-underline hover:underline">
                Rujukan ilmiah & regulasi
              </a>
            </dd>
            <dt className="text-slate-500">Unduh</dt>
            <dd className="m-0">
              <a href="/laporan" className="cursor-pointer text-blue-600 no-underline hover:underline">
                Laporan & data CSV
              </a>
            </dd>
          </dl>
        </section>
      </div>
      <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 lg:px-7">
        © 2026 PeatGuard · Analisis AI bersifat pendukung dan perlu dicek di lapangan.
      </div>
    </footer>
  );
}
