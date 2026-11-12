import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import SEO, { SITE_URL } from "../components/SEO";
import Footer from "../components/landing/Footer";
import { ICONS, CtaBand } from "./MarketingPage";
import { MARKETING_PAGES, FEATURES_HUB } from "../marketing/marketingPages";

const GROUPS = [
  { category: "Feature", title: "Core features" },
  { category: "Integration", title: "Integrations" },
  { category: "Use case", title: "Use cases" },
];

const FeaturesHub = () => {
  const jsonLd = [
    {
      "@type": "CollectionPage",
      "@id": `${SITE_URL}${FEATURES_HUB.path}#webpage`,
      url: `${SITE_URL}${FEATURES_HUB.path}`,
      name: FEATURES_HUB.metaTitle,
      description: FEATURES_HUB.metaDescription,
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@type": "ItemList",
      itemListElement: MARKETING_PAGES.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${p.path}`,
        name: p.navLabel,
      })),
    },
  ];

  return (
    <>
      <SEO
        title={FEATURES_HUB.metaTitle}
        description={FEATURES_HUB.metaDescription}
        path={FEATURES_HUB.path}
        jsonLd={jsonLd}
      />
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-5">
              Samvaadik features
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
              {FEATURES_HUB.h1}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
              {FEATURES_HUB.intro}
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
              {["Official WhatsApp Business API", "Meta-approved templates", "Built for Indian businesses"].map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {GROUPS.map(({ category, title }) => {
          const pages = MARKETING_PAGES.filter((p) => p.category === category);
          if (!pages.length) return null;
          return (
            <section key={category} className="px-4 sm:px-6 lg:px-8 py-10">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">
                  {title}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pages.map((p) => {
                    const Icon = ICONS[p.icon] || Check;
                    return (
                      <Link
                        key={p.path}
                        to={p.path}
                        className="group bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition"
                      >
                        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{p.navLabel}</h3>
                        <p className="text-gray-600 leading-relaxed">{p.summary}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                          Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}

        <CtaBand title="Ready to grow on WhatsApp?" />
      </div>
      <Footer />
    </>
  );
};

export default FeaturesHub;
