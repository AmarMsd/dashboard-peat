import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("riwayat", "routes/riwayat.jsx"),
  route("peta-sensor", "routes/peta-sensor.jsx"),
  route("kondisi-lahan", "routes/kondisi-lahan.jsx"),
  route("peringatan", "routes/peringatan.jsx"),
  route("laporan", "routes/laporan.jsx"),
  route("agent", "routes/agent.jsx"),
];
