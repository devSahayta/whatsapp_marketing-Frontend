// Post-build step: turns the SPA build in dist/ into SEO-friendly output.
//
//   dist/index.html, dist/<route>/index.html  -> public pages with real HTML,
//                                                per-page title/description/canonical
//   dist/app-shell.html                        -> plain SPA shell for app screens
//   dist/404.html                              -> "Page not found" (served with 404)
//   dist/sitemap.xml                           -> generated from PUBLIC_ROUTES
//
// Requires `vite build` and `vite build --ssr src/entry-prerender.jsx --outDir dist-ssr`
// to have run first (see the "build" script in package.json).
//
// Fail-safe: if rendering a page fails, the app shell is written in its place
// so the deployed app keeps working exactly like a normal SPA.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SITE_URL = "https://samvaadik.com";
const root = process.cwd();
const distDir = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-prerender.js");

const template = fs.readFileSync(path.join(distDir, "index.html"), "utf8");

if (!template.includes("<!--seo:start-->") || !template.includes("<!--prerender-->")) {
  throw new Error("index.html is missing the <!--seo:start--> or <!--prerender--> marker.");
}

const shell = template.replace("<!--prerender-->", "");

const write = (relPath, html) => {
  const out = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
};

const outFileFor = (route) =>
  route === "/" ? "index.html" : path.join(route.slice(1), "index.html");

// Written first so app routes always have a shell, even if rendering fails.
write("app-shell.html", shell);

const buildPage = (render, url, headExtra = "") => {
  const { html, head } = render(url);
  return template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `${head}${headExtra}`)
    .replace("<!--prerender-->", `<div id="prerender">${html}</div>`);
};

let failures = 0;

let mod;
try {
  mod = await import(pathToFileURL(ssrEntry).href);
} catch (err) {
  console.warn("\n[prerender] WARNING: could not load SSR bundle, shipping plain SPA.\n", err);
  failures++;
}

const routes = mod?.PUBLIC_ROUTES ?? [];

for (const { path: route } of routes) {
  try {
    const page = buildPage(mod.render, route);
    if (!page.includes('rel="canonical"')) {
      throw new Error(`no canonical rendered for ${route} (missing <SEO /> on the page?)`);
    }
    write(outFileFor(route), page);
    console.log(`[prerender] ${route}`);
  } catch (err) {
    failures++;
    console.warn(`[prerender] WARNING: ${route} failed, using app shell.`, err);
    write(outFileFor(route), shell);
  }
}

// 404 page. It is still the full app, so if a real app route was ever missed
// in vercel.json, the app still loads and renders it (only the status is 404).
try {
  if (!mod) throw new Error("SSR bundle not loaded");
  write("404.html", buildPage(mod.render, "/__not-found__"));
  console.log("[prerender] 404.html");
} catch (err) {
  failures++;
  console.warn("[prerender] WARNING: 404 page failed, using app shell.", err);
  write("404.html", shell);
}

// Sitemap
const today = new Date().toISOString().slice(0, 10);
const sitemapRoutes = routes.length ? routes : [{ path: "/", changefreq: "weekly", priority: "1.0" }];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes
  .map(
    (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
write("sitemap.xml", sitemap);
console.log("[prerender] sitemap.xml");

fs.rmSync(path.join(root, "dist-ssr"), { recursive: true, force: true });

if (failures) {
  console.warn(`\n[prerender] Finished with ${failures} warning(s) - see above.\n`);
} else {
  console.log(`[prerender] Done: ${routes.length} pages + 404.`);
}
