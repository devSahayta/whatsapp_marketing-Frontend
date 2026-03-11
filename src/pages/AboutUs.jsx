import React from "react";
import Footer from "../components/landing/Footer";
import SEO from "../components/SEO";

const AboutUs = () => {
  return (
  <>
    <SEO
      title="About Samvaadik"
      description="Learn about Samvaadik — a WhatsApp Business platform helping companies manage campaigns, automation, and customer engagement at scale."
      keywords="About Samvaadik, WhatsApp Business platform, WhatsApp communication tool"
      url="https://samvaadik.com/about"
    />

    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            About Samvaadik
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            WhatsApp engagement built for growth
          </h1>
          <p className="text-gray-600 text-lg">
            Samvaadik helps teams run reliable, compliant, and scalable
            communication on WhatsApp Business API.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Who we are
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Samvaadik is a digital communication platform focused on helping
              businesses connect with their audience through trusted WhatsApp
              messaging.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              What we offer
            </h2>
            <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1">
              <li>Campaign and audience management tools</li>
              <li>Template-based communication workflows</li>
              <li>Analytics and engagement visibility</li>
              <li>Secure and compliant integrations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Our focus
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We build for reliability, transparency, and long-term customer
              trust so teams can run communication operations with confidence.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  </>
  );
};

export default AboutUs;
