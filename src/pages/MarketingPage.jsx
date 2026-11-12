import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BarChart3,
  Bot,
  Braces,
  CalendarClock,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Code2,
  Cpu,
  Download,
  FileBadge,
  FileText,
  FlaskConical,
  GalleryHorizontal,
  GitBranch,
  Image,
  Inbox,
  KeyRound,
  KeySquare,
  ListChecks,
  Lock,
  LogOut,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  PackageCheck,
  Paperclip,
  PartyPopper,
  Plane,
  RefreshCw,
  Repeat,
  Send,
  Sheet,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Timer,
  ToggleRight,
  Upload,
  UserCheck,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";
import SEO, { SITE_URL } from "../components/SEO";
import Footer from "../components/landing/Footer";
import {
  MARKETING_PAGES,
  FEATURES_HUB,
  getMarketingPage,
} from "../marketing/marketingPages";

export const ICONS = {
  Bell, BarChart3, Bot, Braces, CalendarClock, Car, ClipboardList, Code2, Cpu,
  Download, FileBadge, FileText, FlaskConical, GalleryHorizontal, GitBranch,
  Image, Inbox, KeyRound, KeySquare, ListChecks, Lock, LogOut, Megaphone,
  MessageSquare, MessagesSquare, PackageCheck, Paperclip, PartyPopper, Plane,
  RefreshCw, Repeat, Send, Sheet, ShieldCheck, ShoppingCart, Smartphone, Timer,
  ToggleRight, Upload, UserCheck, Users, Webhook, Workflow,
};

const Icon = ({ name, className }) => {
  const Cmp = ICONS[name] || Check;
  return <Cmp className={className} aria-hidden="true" />;
};

const SectionHeading = ({ children, sub }) => (
  <div className="text-center max-w-3xl mx-auto mb-10">
    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
      {children}
    </h2>
    {sub && <p className="mt-3 text-lg text-gray-600">{sub}</p>}
  </div>
);

const buildJsonLd = (page) => {
  const url = `${SITE_URL}${page.path}`;
  const crumbs = [
    { name: "Home", item: `${SITE_URL}/` },
    { name: "Features", item: `${SITE_URL}${FEATURES_HUB.path}` },
    { name: page.navLabel, item: url },
  ];
  return [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.metaTitle,
      description: page.metaDescription,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: c.item,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];
};

export const FaqList = ({ faqs }) => (
  <div className="max-w-3xl mx-auto space-y-3">
    {faqs.map((f) => (
      <details
        key={f.q}
        className="group bg-white rounded-xl border border-gray-200 shadow-sm open:shadow-md transition-shadow"
      >
        <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 py-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
          <h3 className="text-base sm:text-lg">{f.q}</h3>
          <ChevronDown className="w-5 h-5 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
        </summary>
        <p className="px-5 pb-5 text-gray-600 leading-relaxed">{f.a}</p>
      </details>
    ))}
  </div>
);

export const CtaBand = ({ title = "See Samvaadik in action" }) => (
  <section className="px-4 sm:px-6 lg:px-8 py-16">
    <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-12 sm:px-12 text-center text-white shadow-xl">
      <h2 className="text-3xl sm:text-4xl font-extrabold">{title}</h2>
      <p className="mt-3 text-indigo-100 text-lg max-w-2xl mx-auto">
        Talk to our team for a walkthrough, or compare plans and get started.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Contact us <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/pricing"
          className="inline-flex items-center justify-center rounded-full border border-white/60 px-7 py-3 font-semibold text-white hover:bg-white/10"
        >
          See pricing
        </Link>
      </div>
    </div>
  </section>
);

const MarketingPage = ({ path }) => {
  const page = getMarketingPage(path);
  if (!page) return null;

  const related = page.related
    .map((p) => MARKETING_PAGES.find((m) => m.path === p))
    .filter(Boolean);

  return (
    <>
      <SEO
        title={page.metaTitle}
        description={page.metaDescription}
        keywords={page.keywords}
        path={page.path}
        jsonLd={buildJsonLd(page)}
      />

      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
              <ol className="flex flex-wrap items-center gap-1">
                <li>
                  <Link to="/" className="hover:text-gray-900">Home</Link>
                </li>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
                <li>
                  <Link to="/features" className="hover:text-gray-900">Features</Link>
                </li>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
                <li className="text-gray-900 font-medium" aria-current="page">
                  {page.navLabel}
                </li>
              </ol>
            </nav>

            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-5">
                <Icon name={page.icon} className="w-4 h-4" />
                {page.category}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
                {page.h1}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {page.intro}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                >
                  Book a demo <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center rounded-full px-7 py-3 font-semibold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50"
                >
                  See pricing
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-700">
                {page.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/60">
          <div className="max-w-6xl mx-auto">
            <SectionHeading>{page.featuresTitle}</SectionHeading>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {page.features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon name={f.icon} className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <SectionHeading>{page.stepsTitle}</SectionHeading>
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {page.steps.map((s, i) => (
                <li key={s.title} className="relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold mb-4">
                    {i + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Use cases */}
        <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/60">
          <div className="max-w-5xl mx-auto">
            <SectionHeading>{page.useCasesTitle}</SectionHeading>
            <div className="grid gap-6 md:grid-cols-3">
              {page.useCases.map((u) => (
                <div key={u.title} className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{u.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <SectionHeading>Frequently asked questions</SectionHeading>
          <FaqList faqs={page.faqs} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Explore related features
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.path}
                    to={r.path}
                    className="group bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name={r.icon} className="w-5 h-5 text-indigo-600" />
                      <span className="font-semibold text-gray-900">{r.navLabel}</span>
                    </div>
                    <p className="text-sm text-gray-600">{r.summary}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                      Learn more <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaBand />
      </div>
      <Footer />
    </>
  );
};

export default MarketingPage;
