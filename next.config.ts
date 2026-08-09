import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera un servidor autosuficiente (.next/standalone) para imagen Docker mínima.
  output: "standalone",
  // Permite acceder al dev server desde otros dispositivos de la red local
  // (ej. el celular). Sin esto, Next.js rechaza las Server Actions con
  // "Invalid Server Actions request" cuando el origen no es localhost.
  // Si cambia tu IP de red, actualiza esta entrada.
  allowedDevOrigins: ["http://192.168.100.11:3000"],
};

export default nextConfig;
