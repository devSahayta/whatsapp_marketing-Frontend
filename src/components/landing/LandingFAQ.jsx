import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaqList } from "../../pages/MarketingPage";

const faqs = [
  {
    q: "What is Samvaadik?",
    a: "Samvaadik is a WhatsApp marketing and automation platform built on the official WhatsApp Business API. It lets businesses send bulk campaigns, build chatbots and AI agents, manage customer chats in a shared inbox and connect WhatsApp with WooCommerce, Google Sheets and their own software.",
  },
  {
    q: "Is it safe to send bulk WhatsApp messages with Samvaadik?",
    a: "Yes. Samvaadik uses the official WhatsApp Business API and sends only Meta-approved templates, which is the method Meta supports for messaging customers at scale. Unofficial bulk-sender tools that automate the regular WhatsApp app are what typically get numbers banned.",
  },
  {
    q: "How many WhatsApp messages can I send per day?",
    a: "Meta sets a daily limit on how many unique customers each business number can start conversations with. It grows automatically as you keep sending quality messages. Samvaadik doesn't add its own cap on top of Meta's limit.",
  },
  {
    q: "Can I automate replies with a chatbot or AI?",
    a: "Yes. Build chatbot flows with a drag-and-drop builder using keyword and image triggers, conditions and delays, and add AI agents that answer customers in natural language and hand over to your team when needed.",
  },
  {
    q: "Which tools does Samvaadik integrate with?",
    a: "WooCommerce (order notifications and abandoned cart recovery), Google Sheets (contact import, sync and campaign export) and any custom software through scoped API keys and webhooks.",
  },
  {
    q: "How do I get started?",
    a: "Contact our team for a demo or choose a plan on the pricing page. You'll then connect your WhatsApp Business number and can start creating templates and campaigns.",
  },
];

const LandingFAQ = () => (
  <section className="px-4 sm:px-6 lg:px-8 py-20">
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}
      </script>
    </Helmet>
    <div className="text-center max-w-3xl mx-auto mb-10">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
        Frequently asked questions
      </h2>
      <p className="mt-3 text-lg text-gray-600">
        Still curious?{" "}
        <Link to="/features" className="text-indigo-600 font-semibold hover:underline">
          Explore all features
        </Link>
        ,{" "}
        <Link to="/blog" className="text-indigo-600 font-semibold hover:underline">
          read our guides
        </Link>{" "}
        or{" "}
        <Link to="/contact" className="text-indigo-600 font-semibold hover:underline">
          talk to us
        </Link>
        .
      </p>
    </div>
    <FaqList faqs={faqs} />
  </section>
);

export default LandingFAQ;
