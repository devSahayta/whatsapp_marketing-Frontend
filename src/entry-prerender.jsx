// Build-time only: renders public pages to static HTML for search engines and
// link previews. Built with `vite build --ssr` and driven by
// scripts/prerender.mjs. Kinde is replaced by a logged-out stub there.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { AppContent } from "./App.jsx";

export { PUBLIC_ROUTES } from "./seo/publicRoutes.js";

export function render(url) {
  const helmetContext = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={url}>
        <AppContent />
      </StaticRouter>
    </HelmetProvider>
  );
  const { helmet } = helmetContext;
  const head = helmet
    ? [helmet.title, helmet.meta, helmet.link, helmet.script]
        .map((part) => part.toString())
        .filter(Boolean)
        .join("\n    ")
    : "";
  return { html, head };
}
