import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/Calculadora-Inteligente-de-Trade-Binario/", // 👈 Substitua pelo nome do seu repositório
});
