import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { reactSourceLocator } from "vite-plugin-react-source-locator";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    reactSourceLocator({ includeComponents: true }),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
})
