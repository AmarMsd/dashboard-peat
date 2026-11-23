import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const markerColors = {
  normal: "#10b981",  // Emerald (Aman)
  warning: "#f59e0b", // Amber (Waspada)
  critical: "#ef4444",// Rose / Merah (Kritis)
};

// Buat icon marker dengan nomor titik (P1, P2, P3) & efek radar pulsasi
function createMarkerIcon(leaflet, status, nodeIndex = 1) {
  const color = markerColors[status] || markerColors.normal;

  return leaflet.divIcon({
    className: "cursor-pointer custom-sensor-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <span style="position:absolute;width:34px;height:34px;border-radius:9999px;background:${color};opacity:0.25;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="width:26px;height:26px;border-radius:9999px;background:${color};border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:11px;font-weight:800;font-family:system-ui,sans-serif;position:relative;z-index:10;user-select:none;">
          P${nodeIndex}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function generatePopupContent(sensor) {
  const statusBadge =
    sensor.status === "critical"
      ? '<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:9999px;font-weight:bold;font-size:10px;">Kritis / Bahaya</span>'
      : sensor.status === "warning"
      ? '<span style="background:#fef3c7;color:#b45309;padding:2px 8px;border-radius:9999px;font-weight:bold;font-size:10px;">Waspada</span>'
      : '<span style="background:#d1fae5;color:#047857;padding:2px 8px;border-radius:9999px;font-weight:bold;font-size:10px;">Aman</span>';

  return `
    <div style="font-family:system-ui,sans-serif;font-size:12px;line-height:1.4;color:#1e293b;min-width:180px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:8px;">
        <strong style="font-size:13px;color:#0f172a;">${sensor.name}</strong>
        ${statusBadge}
      </div>
      <p style="margin:0 0 8px 0;color:#64748b;font-size:11px;">${sensor.id} · ${sensor.region || "Stasiun Pantau"}</p>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;background:#f8fafc;padding:8px;border-radius:8px;border:1px solid #e2e8f0;">
        <div>
          <span style="color:#64748b;font-size:10px;display:block;">Kelembapan</span>
          <strong style="font-size:13px;color:#0f172a;">${sensor.moisture}%</strong>
        </div>
        <div>
          <span style="color:#64748b;font-size:10px;display:block;">Suhu Tanah</span>
          <strong style="font-size:13px;color:#0f172a;">${sensor.temperature}°C</strong>
        </div>
        <div style="grid-column: span 2;">
          <span style="color:#64748b;font-size:10px;display:block;">Derajat Keasaman</span>
          <strong style="font-size:13px;color:#0f172a;">${sensor.ph ?? 4.2} pH</strong>
        </div>
      </div>

      <div style="font-size:10px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:4px;">
        📍 GPS Hardware: ${Number(sensor.lat).toFixed(4)}, ${Number(sensor.lng).toFixed(4)}<br/>
        ⏱ Terakhir: ${sensor.lastReading || "Baru saja"}
      </div>
    </div>
  `;
}

// Offset spasial tetap & konsisten jika koordinat GPS bertumpuk persis di satu titik
const FIXED_OFFSETS = {
  1: { dLat: 0.0, dLng: 0.0 },           // Titik 1: Di pusat GPS
  2: { dLat: -0.0016, dLng: 0.0022 },    // Titik 2: Bergeser sedikit ke Timur-Selatan (~200m)
  3: { dLat: 0.0018, dLng: -0.0020 },    // Titik 3: Bergeser sedikit ke Barat-Utara (~200m)
};

export function SensorMap({ sensors, onSelect }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);
  const markersLayerRef = useRef(null);
  const markersMapRef = useRef({}); // Menyimpan referensi marker agar TIDAK di-destroy ulang (flicker-free)
  const leafletRef = useRef(null);
  const hasFittedBoundsRef = useRef(false);

  // 1. Inisialisasi Map Leaflet SEKALI saja
  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return undefined;

    let disposed = false;

    import("leaflet").then(({ default: leaflet }) => {
      if (disposed || !mapElement.current) return;
      leafletRef.current = leaflet;

      // Ambil titik koordinat rata-rata dari sensor awal
      const validCoords = sensors.filter((s) => s.lat != null && s.lng != null);
      const initialCenter =
        validCoords.length > 0
          ? [Number(validCoords[0].lat), Number(validCoords[0].lng)]
          : [-6.8303, 107.5867];

      const map = leaflet.map(mapElement.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
      });

      leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map);

      const markersLayer = leaflet.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstance.current = map;

      // Pasang marker persisten
      syncMarkers(leaflet, map, markersLayer, markersMapRef.current, sensors, onSelect, true);
    });

    return () => {
      disposed = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markersLayerRef.current = null;
      markersMapRef.current = {};
      leafletRef.current = null;
    };
  }, []);

  // 2. Perbarui warna dan posisi marker secara mulus (IN-PLACE) tanpa menghapus marker
  useEffect(() => {
    if (!mapInstance.current || !markersLayerRef.current || !leafletRef.current) return;
    syncMarkers(
      leafletRef.current,
      mapInstance.current,
      markersLayerRef.current,
      markersMapRef.current,
      sensors,
      onSelect,
      false
    );
  }, [sensors, onSelect]);

  return (
    <div className="sensor-map relative z-0 isolate h-full min-h-[440px] w-full" ref={mapElement} />
  );
}

/**
 * Sinkronisasi marker secara in-place agar titik-titik TIDAK BERKEDIP / HILANG
 */
function syncMarkers(leaflet, map, markersLayer, markersMap, sensors, onSelect, isInitial = false) {
  const validBounds = [];

  // Periksa apakah ketiga sensor berada di koordinat yang hampir sama persis
  const baseLat = sensors[0]?.lat != null ? Number(sensors[0].lat) : -6.8303;
  const baseLng = sensors[0]?.lng != null ? Number(sensors[0].lng) : 107.5867;

  const isCoincident = sensors.every(
    (s) =>
      s.lat != null &&
      s.lng != null &&
      Math.abs(Number(s.lat) - baseLat) < 0.0008 &&
      Math.abs(Number(s.lng) - baseLng) < 0.0008
  );

  sensors.forEach((sensor) => {
    const rawLat = sensor.lat != null && !isNaN(sensor.lat) ? Number(sensor.lat) : baseLat;
    const rawLng = sensor.lng != null && !isNaN(sensor.lng) ? Number(sensor.lng) : baseLng;

    // Jika koordinat bertumpuk persis di satu titik uji coba,
    // sebarkan secara konsisten agar P1, P2, P3 terlihat jelas berdampingan
    const offset = isCoincident ? FIXED_OFFSETS[sensor.nodeIndex] || { dLat: 0, dLng: 0 } : { dLat: 0, dLng: 0 };
    const displayLat = rawLat + offset.dLat;
    const displayLng = rawLng + offset.dLng;

    const latLng = [displayLat, displayLng];
    validBounds.push(latLng);

    const markerId = sensor.id || `node-${sensor.nodeIndex}`;
    const newIcon = createMarkerIcon(leaflet, sensor.status, sensor.nodeIndex);
    const popupHtml = generatePopupContent(sensor);

    if (markersMap[markerId]) {
      // Marker SUDAH ADA: Update in-place tanpa menghapus!
      const existing = markersMap[markerId];
      existing.setLatLng(latLng);
      existing.setIcon(newIcon);
      existing.setPopupContent(popupHtml);
    } else {
      // Marker BARU: Buat sekali dan simpan referensinya
      const newMarker = leaflet
        .marker(latLng, {
          icon: newIcon,
          title: sensor.name,
        })
        .addTo(markersLayer);

      newMarker.bindPopup(popupHtml);
      newMarker.on("click", () => {
        if (typeof onSelect === "function") onSelect(sensor);
      });

      markersMap[markerId] = newMarker;
    }
  });

  // Hanya lakukan auto-fit saat pertama kali map dimuat
  if (isInitial && validBounds.length > 0) {
    if (validBounds.length === 1) {
      map.setView(validBounds[0], 12);
    } else {
      map.fitBounds(validBounds, { padding: [40, 40], maxZoom: 13 });
    }
  }
}
