import React from "react";
import Footer from "../components/landing/Footer";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Terms & Conditions
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 text-lg">Last Updated: March 2026</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            Welcome to Samvaadik. By accessing or using our website and
            services, you agree to comply with and be bound by the following
            Terms and Conditions.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing this website and using our services, you agree to
              accept and comply with these Terms and Conditions. If you do not
              agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Services
            </h2>
            <p>
              Samvaadik provides digital communication and engagement solutions
              through its platform. The services provided may include messaging
              tools, digital interactions, event communication services, and
              related digital services.
            </p>
            <p className="mt-2">
              We reserve the right to modify, suspend, or discontinue any
              service at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. User Responsibilities
            </h2>
            <p>
              Users agree to use the platform responsibly and not engage in any
              activity that:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violates applicable laws or regulations</li>
              <li>Attempts to gain unauthorized access to the platform</li>
              <li>Disrupts or interferes with platform operations</li>
              <li>Uses the platform for fraudulent or harmful activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Payments
            </h2>
            <p>
              All payments made through the platform are processed securely
              through authorized payment gateways. By making a payment, you
              agree to provide accurate payment information and authorize the
              transaction.
            </p>
            <p className="mt-2">
              Samvaadik does not store sensitive payment information such as
              credit or debit card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. Intellectual Property
            </h2>
            <p>
              All content, trademarks, logos, and materials on this website are
              the property of Samvaadik unless otherwise stated. Unauthorized
              use, reproduction, or distribution is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              6. Limitation of Liability
            </h2>
            <p>
              Samvaadik shall not be liable for any indirect, incidental, or
              consequential damages arising from the use or inability to use our
              services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              7. Changes to Terms
            </h2>
            <p>
              We reserve the right to update or modify these Terms at any time.
              Continued use of the website after changes constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              8. Governing Law
            </h2>
            <p>
              These Terms and Conditions shall be governed by and interpreted in
              accordance with the laws of India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              9. Contact Information
            </h2>
            <p>
              For any questions regarding these Terms and Conditions, please
              contact us through the Contact page on our website.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
