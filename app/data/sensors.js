// Data sensor awal untuk 3 titik pantau utama lahan gambut yang terhubung ke MQTT
export const defaultSensors = [
  {
    id: "PG-001",
    nodeIndex: 1,
    name: "Parongpong",
    region: "Stasiun 1 (Koordinat Telemetri)",
    lat: -6.8303,
    lng: 107.5867,
    status: "normal",
    moisture: 65.0,
    ph: 4.2,
    temperature: 28.5,
    waterLevel: 42,
    lastReading: "Baru saja",
  },
  {
    id: "PG-002",
    nodeIndex: 2,
    name: "Baleendah",
    region: "Stasiun 2 (Koordinat Telemetri)",
    lat: -6.8320,
    lng: 107.5910,
    status: "warning",
    moisture: 42.1,
    ph: 3.8,
    temperature: 32.8,
    waterLevel: 25,
    lastReading: "Baru saja",
  },
  {
    id: "PG-003",
    nodeIndex: 3,
    name: "Rancaupas",
    region: "Stasiun 3 (Koordinat Telemetri)",
    lat: -6.8285,
    lng: 107.5815,
    status: "normal",
    moisture: 71.3,
    ph: 4.5,
    temperature: 27.9,
    waterLevel: 56,
    lastReading: "Baru saja",
  },
];

// Daftar 9 Topik Telemetri MQTT Aktif (3 Parameter x 3 Titik Pantau)
export const initialMqttTopics = [
  // Parongpong
  {
    topic: "sensor/soil/moisture1",
    param: "moisture",
    nodeIndex: 1,
    stationName: "Parongpong",
    label: "Kelembapan Tanah 1",
    unit: "%",
    value: 65.0,
    status: "normal",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/ph1",
    param: "ph",
    nodeIndex: 1,
    stationName: "Parongpong",
    label: "pH Tanah 1",
    unit: "pH",
    value: 5.55,
    status: "warning",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/temp1",
    param: "temp",
    nodeIndex: 1,
    stationName: "Parongpong",
    label: "Suhu Lapisan Tanah 1",
    unit: "°C",
    value: 28.5,
    status: "normal",
    lastUpdate: "Baru saja",
  },
  // Baleendah
  {
    topic: "sensor/soil/moisture2",
    param: "moisture",
    nodeIndex: 2,
    stationName: "Baleendah",
    label: "Kelembapan Tanah 2",
    unit: "%",
    value: 41.8,
    status: "warning",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/ph2",
    param: "ph",
    nodeIndex: 2,
    stationName: "Baleendah",
    label: "pH Tanah 2",
    unit: "pH",
    value: 3.8,
    status: "normal",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/temp2",
    param: "temp",
    nodeIndex: 2,
    stationName: "Baleendah",
    label: "Suhu Lapisan Tanah 2",
    unit: "°C",
    value: 33.7,
    status: "warning",
    lastUpdate: "Baru saja",
  },
  // Rancaupas
  {
    topic: "sensor/soil/moisture3",
    param: "moisture",
    nodeIndex: 3,
    stationName: "Rancaupas",
    label: "Kelembapan Tanah 3",
    unit: "%",
    value: 71.3,
    status: "normal",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/ph3",
    param: "ph",
    nodeIndex: 3,
    stationName: "Rancaupas",
    label: "pH Tanah 3",
    unit: "pH",
    value: 4.6,
    status: "normal",
    lastUpdate: "Baru saja",
  },
  {
    topic: "sensor/soil/temp3",
    param: "temp",
    nodeIndex: 3,
    stationName: "Rancaupas",
    label: "Suhu Lapisan Tanah 3",
    unit: "°C",
    value: 28.6,
    status: "normal",
    lastUpdate: "Baru saja",
  },
];

// Standar Ambang Batas Ilmiah Deteksi Kebakaran Hutan & Lahan Gambut
export const PEAT_FIRE_THRESHOLDS = {
  moisture: {
    safe: { min: 60.0, label: "Aman", desc: "Kadar air pori mencukupi; penyalaan bara padam dengan sendirinya." },
    warning: { min: 40.0, max: 59.9, label: "Waspada", desc: "Defisit air pori; bara berpotensi menjalar jika tersulut atau terpaan angin." },
    critical: { max: 39.9, label: "Bahaya / Kritis", desc: "Critical Moisture of Extinction (CME); gambut sangat mudah menyala dan bara bawah tanah bertahan berhari-hari." },
  },
  temperature: {
    safe: { min: 25.0, max: 31.9, label: "Aman", desc: "Suhu mikroklimat tanah gambut tropis normal dan terhidrasi." },
    warning: { min: 32.0, max: 34.9, label: "Waspada", desc: "Pemanasan lapisan gambut meningkat, laju evaporasi tinggi." },
    critical: { min: 35.0, label: "Bahaya / Kritis", desc: "Anomali termal ekstrem; indikasi bara api bawah tanah (subsurface smouldering hotspot)." },
  },
  ph: {
    normal: { min: 3.5, max: 5.0, label: "Normal Gambut", desc: "Kondisi alami gambut oligotropik masam." },
    extremeAcid: { max: 3.2, label: "Anomali Pirit", desc: "Indikasi oksidasi pirit (FeS2) akibat drainase berlebihan." },
    alkalineSpike: { min: 5.5, label: "Anomali Abu", desc: "Indikasi pelepasan kation basa dari abu sisa pembakaran gambut." },
  },
  references: [
    {
      authors: "Huang, X., & Rein, G. (2015)",
      title: "Smouldering combustion of peat in wildfires: Critical moisture content and ignition thresholds",
      journal: "International Journal of Wildland Fire, 24(7), 963-973",
    },
    {
      authors: "Usup, A., Hashimoto, Y., Takahashi, H., & Hayasaka, H. (2004)",
      title: "Combustion characteristics of peat in Central Kalimantan, Indonesia",
      journal: "Tropics, 14(1), 1-19, Hokkaido University",
    },
    {
      authors: "Saharjo, B. H., & Nurhayati, A. D. (2006)",
      title: "Karakteristik Pembakaran dan Suhu Bawah Permukaan Lahan Gambut Terdegradasi",
      journal: "Jurnal Silvikultur Tropika, Fakultas Kehutanan IPB",
    },
    {
      authors: "Badan Restorasi Gambut dan Mangrove (BRGM) & PP No. 57 Tahun 2016",
      title: "Kriteria Baku Kerusakan dan Ambang Batas Hidrologis Ekosistem Gambut",
      journal: "Standar Perlindungan dan Pengelolaan Ekosistem Gambut Nasional",
    },
  ],
};

// Evaluasi status risiko kebakaran hutan & lahan gambut multivariat berbasis bukti ilmiah
export function evaluateSensorStatus(moisture, temperature, ph) {
  const m = Number(moisture);
  const t = Number(temperature);
  const p = Number(ph);

  // KONDISI KRITIS (Bahaya Kebakaran Tinggi / Critical):
  // 1. Kelembapan di bawah 40% (Batas CME Huang & Rein 2015, di mana penyalaan bara mencapai probabilitas 100%)
  // 2. ATAU Suhu tanah >= 35°C (Indikasi bara panas bawah tanah / smouldering hotspot)
  if (m < 40.0 || t >= 35.0) {
    return "critical";
  }

  // KONDISI WASPADA (Siaga / Warning):
  // 1. Kelembapan berada di rentang 40.0% s/d 59.9% (Defisit hidrasi, mudah tersulut jika ada angin atau percikan)
  // 2. ATAU Suhu tanah 32.0°C s/d 34.9°C (Radiasi matahari ekstrem / pengeringan cepat)
  // 3. ATAU pH anomali (< 3.2 karena pirit teroksidasi atau > 5.5 karena abu bakar)
  if (m < 60.0 || t >= 32.0 || p < 3.2 || p > 5.5) {
    return "warning";
  }

  // KONDISI AMAN (Safe / Normal):
  // Kelembapan >= 60%, Suhu < 32°C, dan pH normal (3.5 - 5.0)
  return "normal";
}

// Helper memberikan penjelasan kenapa titik tersebut berstatus demikian
export function getStatusReason(sensor) {
  const m = Number(sensor.moisture);
  const t = Number(sensor.temperature);
  const p = Number(sensor.ph);

  if (m < 40.0) {
    return `Kelembapan sangat rendah (${m}%), berada di bawah batas kritis hidrofobisitas (<40%). Rawan penyalaan bara api bawah tanah.`;
  }
  if (t >= 35.0) {
    return `Suhu tanah tinggi (${t}°C), terdeteksi anomali panas yang berpotensi sebagai titik bara api bawah tanah (hotspot).`;
  }
  if (m < 60.0) {
    return `Kelembapan (${m}%) di zona waspada (40-60%). Lapisan gambut mulai mengering dan membutuhkan pemantauan/pembasahan berkala.`;
  }
  if (t >= 32.0) {
    return `Suhu tanah hangat (${t}°C) di atas rata-rata normal, mempercepat laju penguapan air pori tanah.`;
  }
  if (p < 3.2) {
    return `pH sangat asam (${p}), mengindikasikan pengeringan dalam yang memicu oksidasi pirit.`;
  }
  return "Kelembapan tanah cukup (>60%), suhu normal (<32°C), dan pH stabil pada rentang alami gambut terhidrasi.";
}

// Kompatibilitas mundur
export const sensors = defaultSensors;
