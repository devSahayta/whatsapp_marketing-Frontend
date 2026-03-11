import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Samvaadik - WhatsApp Business Solution",
  description = "Transform your WhatsApp into a powerful business tool. Bulk messaging, campaign management, analytics, and more.",
  keywords = "WhatsApp Business, Bulk WhatsApp, WhatsApp Marketing, Campaign Manager, Business Messaging",
  image = "https://samvaadik.com/images/og-image.jpg",
  url = "https://samvaadik.com"
}) => {
  const siteTitle = title.includes('Samvaadik') ? title : `${title} | Samvaadik`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;