import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Vite plugin for React
  plugins: [react()],
  
  // Prevent Vite from clearing the screen (useful for Tauri)
  clearScreen: false,
  
  // Server configuration for Tauri
  server: {
    // Use 127.0.0.1 instead of localhost for better Tauri compatibility
    host: "127.0.0.1",
    port: 3000,
    strictPort: true, // Keep port consistent with Tauri config
    
    // HMR (Hot Module Replacement) configuration
    hmr: {
      protocol: "ws",
      host: "127.0.0.1",
      port: 3000,
    },
    
    // Watch configuration - ignore Tauri files
    watch: {
      ignored: ["**/src-tauri/**"],
    },
    
    // CORS configuration for Tauri
    cors: true,
  },
  
  // Build configuration
  build: {
    // Generate source maps for debugging
    sourcemap: true,
  },
  
  // Environment variables
  envPrefix: ["VITE_", "TAURI_"],
});

