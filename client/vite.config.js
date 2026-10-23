
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Green-Wallet/",
  server: {
    port: 5173,
  },
});
