import React from "react";
import Footer from "../components/landing/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Privacy Policy
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-gray-600 text-lg">Last Updated: March 2026</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            Samvaadik values your privacy and is committed to protecting your
            personal information. This Privacy Policy explains how we collect,
            use, and safeguard your data.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              1. Information We Collect
            </h2>
            <p>We may collect the following information:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Usage data and website interaction information</li>
              <li>Any information voluntarily submitted through forms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. How We Use Information
            </h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Provide and improve our services</li>
              <li>Communicate with users</li>
              <li>Process transactions</li>
              <li>Respond to customer inquiries</li>
              <li>Enhance website functionality and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. Data Protection
            </h2>
            <p>
              We implement reasonable security measures to protect user
              information from unauthorized access, misuse, or disclosure.
            </p>
            <p className="mt-2">
              However, no online platform can guarantee complete security of
              data transmission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Sharing of Information
            </h2>
            <p>
              Samvaadik does not sell, rent, or trade personal information with
              third parties. Information may only be shared when required by law
              or to provide services through trusted partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. Cookies
            </h2>
            <p>
              Our website may use cookies and similar technologies to improve
              user experience and analyze website traffic.
            </p>
            <p className="mt-2">
              Users may choose to disable cookies through their browser
              settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              6. Third-Party Services
            </h2>
            <p>
              Our platform may use third-party tools such as payment gateways
              or analytics services. These services have their own privacy
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              7. User Rights
            </h2>
            <p>
              Users may request access, correction, or deletion of their
              personal data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              8. Updates to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Updates will
              be posted on this page with the revised date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              9. Contact
            </h2>
            <p>
              For privacy-related inquiries, please contact us through the
              Contact page on our website.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
