import React from "react";
import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://samvaadik.com";
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.jpg`;

/**
 * Per-page head tags. Rendered on the client by react-helmet-async and also
 * baked into static HTML at build time by scripts/prerender.mjs.
 *
 * `path` is the route ("/pricing"); `url` (absolute) is still accepted for
 * backwards compatibility.
 */
const SEO = ({
  title = "Samvaadik - WhatsApp Business Solution",
  description = "Transform your WhatsApp into a powerful business tool. Bulk messaging, campaign management, analytics, and more.",
  keywords,
  image = DEFAULT_IMAGE,
  path,
  url,
  noindex = false,
  jsonLd, // optional schema.org object (or array of objects)
}) => {
  const siteTitle = title.includes("Samvaadik") ? title : `${title} | Samvaadik`;
  const canonical = url || `${SITE_URL}${path && path !== "/" ? path : "/"}`;

  if (noindex) {
    return (
      <Helmet>
        <title>{siteTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook / WhatsApp link previews */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Samvaadik" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(jsonLd)
              ? { "@context": "https://schema.org", "@graph": jsonLd }
              : { "@context": "https://schema.org", ...jsonLd }
          )}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
