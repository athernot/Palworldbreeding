import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron/simple";

const srcAlias = {
  "@": path.resolve(__dirname, "./src"),
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          resolve: {
            alias: srcAlias,
          },
        },
      },
      preload: {
        input: "electron/preload.ts",
        vite: {
          resolve: {
            alias: srcAlias,
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: srcAlias,
  },
});
