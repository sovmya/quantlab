import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev, /api is forwarded to the backend, so the browser sees ONE origin.
    // That means first-party cookies and no CORS configuration.
    proxy: { "/api": "http://localhost:5000" },
  },
});