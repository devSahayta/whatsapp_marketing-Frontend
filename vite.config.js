import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
// import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    react(),
    // basicSsl(), // ← add this
  ],
  server: {
    // https: true,
    port: 5173,
  },
  resolve: {
    // The build-time pre-render (scripts/prerender.mjs) renders public pages
    // as a logged-out visitor. Browser builds use the real Kinde SDK.
    alias: isSsrBuild
      ? {
          "@kinde-oss/kinde-auth-react": fileURLToPath(
            new URL("./src/seo/kindeSsrStub.jsx", import.meta.url)
          ),
        }
      : {},
  },
  ssr: {
    // Bundle deps into the SSR output so CSS/asset imports inside packages
    // don't break when Node loads the bundle.
    noExternal: true,
  },
}));
