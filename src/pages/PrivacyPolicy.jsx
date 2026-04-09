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
          <p className="text-gray-600 text-lg">Last Updated: April 2026</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            Samvaadik values your privacy and is committed to protecting your
            personal information. This Privacy Policy explains how we collect,
            use, and safeguard your data when you use our WhatsApp marketing
            platform.
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
              <li>
                WhatsApp Business Account credentials including WhatsApp
                Business Account ID (WABA ID), Phone Number ID, and access
                tokens obtained through Meta's Embedded Signup flow
              </li>
              <li>
                WhatsApp Business Account metadata including messaging tier,
                quality rating, and account status retrieved from Meta's Graph
                API
              </li>
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
              <li>
                Connect your WhatsApp Business Account to our platform so you
                can manage and send WhatsApp campaigns to your customers
              </li>
              <li>
                Send WhatsApp messages on your behalf to your customers through
                the WhatsApp Business API, including campaign messages,
                automated follow-ups, and transactional notifications
              </li>
              <li>
                Monitor your WhatsApp account's messaging tier, quality rating,
                and daily usage to help you stay within Meta's limits
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. WhatsApp Business Account Data
            </h2>
            <p>
              Samvaadik integrates with Meta's WhatsApp Business Platform to
              provide our services. When you connect your WhatsApp Business
              Account through our platform:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                We collect and securely store your WhatsApp Business Account ID
                (WABA ID), Phone Number ID, and API access tokens
              </li>
              <li>
                Access tokens are encrypted and stored securely in our database.
                They are used solely to send messages and retrieve account
                information on your behalf
              </li>
              <li>
                We do not share your WhatsApp Business Account credentials or
                access tokens with any third parties
              </li>
              <li>
                We retrieve your account's messaging tier and quality rating
                from Meta's API to display them on your dashboard
              </li>
              <li>
                Message content and recipient data you provide for campaigns is
                used only to deliver those messages and is not sold or shared
                with third parties
              </li>
              <li>
                You can disconnect your WhatsApp Business Account from Samvaadik
                at any time by contacting us or through your account settings.
                Upon disconnection, your access tokens will be deleted from our
                systems
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Meta Platform and WhatsApp Business API
            </h2>
            <p>
              Our platform uses Meta's WhatsApp Business API and Embedded Signup
              to allow businesses to connect their WhatsApp accounts. By
              connecting your WhatsApp Business Account through Samvaadik, you
              also agree to Meta's terms and policies:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <a
                  href="https://www.whatsapp.com/legal/business-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  WhatsApp Business Policy
                </a>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Meta Platform Terms
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/privacy/policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Meta Privacy Policy
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Samvaadik acts as a technology platform that enables businesses to
              manage their own WhatsApp Business Accounts. We do not own or
              control the WhatsApp accounts of our users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. Data Protection
            </h2>
            <p>
              We implement reasonable security measures to protect user
              information from unauthorized access, misuse, or disclosure. This
              includes encryption of sensitive credentials such as WhatsApp API
              access tokens stored in our systems.
            </p>
            <p className="mt-2">
              However, no online platform can guarantee complete security of
              data transmission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              6. Sharing of Information
            </h2>
            <p>
              Samvaadik does not sell, rent, or trade personal information with
              third parties. We do not sell or share your WhatsApp Business
              Account credentials, access tokens, or messaging data with any
              third parties. Information may only be shared when required by law
              or to provide services through trusted infrastructure partners
              such as our cloud hosting and database providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              7. Cookies
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
              8. Third-Party Services
            </h2>
            <p>
              Our platform uses third-party tools including Meta's WhatsApp
              Business API, payment gateways, and analytics services. These
              services have their own privacy policies which govern their data
              usage independently of Samvaadik.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              9. User Rights
            </h2>
            <p>
              Users may request access, correction, or deletion of their
              personal data by contacting us. This includes the right to request
              deletion of your WhatsApp Business Account credentials and access
              tokens stored in our systems. Upon a verified deletion request, we
              will remove your data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              10. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your Samvaadik account
              is active. WhatsApp Business Account credentials and access tokens
              are deleted immediately upon account disconnection or account
              closure. Campaign data and message logs may be retained for up to
              90 days for analytics and troubleshooting purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              11. Updates to this Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Updates will
              be posted on this page with the revised date. Continued use of
              Samvaadik after updates constitutes acceptance of the revised
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              12. Contact
            </h2>
            <p>
              For privacy-related inquiries including requests to access,
              correct, or delete your data, please contact us at{" "}
              <a
                href="mailto:dev@sahayta.co.in"
                className="text-blue-600 underline"
              >
                dev@sahayta.co.in
              </a>{" "}
              or through the Contact page on our website.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
