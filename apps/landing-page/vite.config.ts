import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import vitePluginPreviewAnnotations from "./plugins/vite-plugin-preview-annotations";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["@heroui/react", "@heroui-pro/react", "@iconify/react"],
  },
  plugins: [
    vitePluginPreviewAnnotations(),
    // `tsDecorators` enables legacy TS decorators + emit-metadata so SWC accepts
    // @Injectable() / @Inject() from `@academorix/container` (NestJS-style DI).
    // The type-checker gets the same flags via `@academorix/config-tsconfig`.
    react({ tsDecorators: true }),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true,
    host: "0.0.0.0",
    port: 3001,
  },
});
