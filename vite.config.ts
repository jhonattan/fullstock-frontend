import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only apply manual chunks to client builds, not SSR
          if (id.includes("node_modules")) {
            if (id.includes("react") && !id.includes("react-router")) {
              return "react-vendor";
            }
            if (id.includes("react-router")) {
              return "router-vendor";
            }
            if (id.includes("@radix-ui")) {
              return "ui-vendor";
            }
            if (
              id.includes("react-hook-form") ||
              id.includes("@hookform") ||
              id.includes("zod")
            ) {
              return "form-vendor";
            }
            if (id.includes("@prisma/client")) {
              return "prisma-vendor";
            }
          }
        },
      },
    },
    // Optimize for production
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.warn"],
      },
      mangle: {
        safari10: true,
      },
    },
    // Target modern browsers for better optimization
    target: "esnext",
    // Disable source maps in production for smaller bundles
    sourcemap: false,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "@radix-ui/react-select",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
    ],
    exclude: ["lucide-react"], // Exclude to allow tree-shaking
  },
  // CSS optimization
  css: {
    devSourcemap: false,
  },
});
