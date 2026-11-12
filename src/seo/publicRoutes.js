// Single source of truth for the public (indexable) marketing pages.
// Used by the app (to decide robots meta), by scripts/prerender.mjs (which
// pages to bake into static HTML) and to generate sitemap.xml.
// Plain JS on purpose: it is imported from Node at build time.
// Feature / integration / use-case pages come from src/marketing/marketingPages.js.

import { MARKETING_PAGES, FEATURES_HUB } from "../marketing/marketingPages.js";

export const PUBLIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: FEATURES_HUB.path, changefreq: "weekly", priority: "0.9" },
  ...MARKETING_PAGES.map((p) => ({
    path: p.path,
    changefreq: "monthly",
    priority: "0.8",
  })),
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-and-conditions", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-cancellation-policy", changefreq: "yearly", priority: "0.3" },
];

export const isPublicPath = (pathname) => {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return PUBLIC_ROUTES.some((r) => r.path === p);
};

// --- Pre-rendered markup hand-off -----------------------------------------
// Build output puts static HTML in <div id="prerender"> next to #root. It
// stays on screen while Kinde resolves auth and is removed in the same frame
// React paints the real page. For users with the auth hint (logged in on
// this browser before) index.html hides it with CSS, so they keep seeing the
// normal loading state instead of a flash of the marketing page.

export const PRERENDER_ID = "prerender";
export const AUTH_HINT_KEY = "samvaadik_auth_hint";

export const isPrerenderVisible = () => {
  if (typeof document === "undefined") return false;
  return (
    !!document.getElementById(PRERENDER_ID) &&
    !document.documentElement.hasAttribute("data-auth-hint")
  );
};

export const removePrerender = () => {
  if (typeof document === "undefined") return;
  document.getElementById(PRERENDER_ID)?.remove();
};

export const setAuthHint = (loggedIn) => {
  try {
    if (loggedIn) localStorage.setItem(AUTH_HINT_KEY, "1");
    else localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    /* storage unavailable (private mode etc.) - hint is optional */
  }
};
