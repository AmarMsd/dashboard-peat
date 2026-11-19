import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const markerColors = {
  normal: "#73e0b3",
  warning: "#fa9a4b",
  critical: "#f06478",
};

function createMarkerIcon(leaflet, status) {
  const color = markerColors[status] || markerColors.normal;

  return leaflet.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border:3px solid #fff;border-radius:9999px;background:${color};box-shadow:0 0 0 5px ${color}33,0 3px 8px #0008"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export function SensorMap({ sensors, onSelect }) {
  const mapElement = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return undefined;

    let map;
    let disposed = false;

    import("leaflet").then(({ default: leaflet }) => {
      if (disposed || !mapElement.current) return;

      map = leaflet.map(mapElement.current, {
        center: [-0.45, 108.2],
        zoom: 5,
        zoomControl: false,
        attributionControl: true,
      });

      leaflet.control.zoom({ position: "bottomright" }).addTo(map);
      leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      sensors.forEach((sensor) => {
        const marker = leaflet.marker([sensor.lat, sensor.lng], {
          icon: createMarkerIcon(leaflet, sensor.status),
          title: sensor.name,
        }).addTo(map);

        marker.bindPopup(`
          <strong>${sensor.name}</strong><br />
          ${sensor.region} · Kelembapan ${sensor.moisture}%
        `);
        marker.on("click", () => onSelect(sensor));
      });

      mapInstance.current = map;
    });

    return () => {
      disposed = true;
      map?.remove();
      mapInstance.current = null;
    };
  }, [onSelect, sensors]);

  return <div className="sensor-map h-full min-h-[520px] w-full" ref={mapElement} />;
}
