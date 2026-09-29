import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { studioPages } from "./studio-build"

// The studio app: one Vite project, one folder per model under src/variants/.
// `vite build` writes ../candidates/<variant>/<screen>.html for every screen in
// ../project.json, plus each variant's variant.json with the shadcn parts it uses.
// `vite dev` serves the same pages with the studio's tokens through a proxy.
const studioUrl = process.env.STUDIO_URL || "http://127.0.0.1:4173"

export default defineConfig({
  root: "entries",
  base: "/candidates/",
  publicDir: false,
  plugins: [react(), tailwindcss(), studioPages()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    fs: { allow: [path.resolve(import.meta.dirname)] },
    proxy: { "/_studio": studioUrl, "/api": studioUrl, "/data.js": studioUrl },
  },
  build: {
    outDir: "../../candidates",
    emptyOutDir: false,
  },
})
