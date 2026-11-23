import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Variabel server (tanpa awalan VITE_) dari .env agar route /api/chat bisa membacanya saat `npm run dev`.
  // Di produksi (react-router-serve / Docker) isi lewat variabel lingkungan biasa.
  const env = loadEnv(mode, process.cwd(), "");
  if (env.N8N_CHAT_URL && !process.env.N8N_CHAT_URL) process.env.N8N_CHAT_URL = env.N8N_CHAT_URL;

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      allowedHosts: ["dashboard-peat.amarmsd.my.id"],
    },
  };
});
