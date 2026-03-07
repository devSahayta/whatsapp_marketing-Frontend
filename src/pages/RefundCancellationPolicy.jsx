import React from "react";
import Footer from "../components/landing/Footer";

const RefundCancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            Refund & Cancellation Policy
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Refund and Cancellation Policy
          </h1>
          <p className="text-gray-600 text-lg">Last Updated: March 2026</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6 text-gray-700 leading-relaxed">
          <p>
            At Samvaadik, we aim to provide high-quality services. This policy
            outlines the terms for refunds and cancellations.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              1. Cancellation
            </h2>
            <p>
              Users may cancel their service request before the service has been
              delivered or activated. Once the service has been initiated or
              delivered, cancellation may not be possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Refunds
            </h2>
            <p>Refunds may be issued under the following conditions:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Duplicate payment made by the user</li>
              <li>
                Payment made but service not delivered due to technical issues
              </li>
              <li>Valid cancellation request approved by Samvaadik</li>
            </ul>
            <p className="mt-2">
              Approved refunds will be processed within 7-10 business days and
              credited to the original payment method.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. Non-Refundable Cases
            </h2>
            <p>Refunds will not be issued for:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Completed services</li>
              <li>Change of mind after service activation</li>
              <li>Misuse or violation of platform terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Contact
            </h2>
            <p>
              For refund or cancellation requests, users may contact us through
              the Contact page on our website.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundCancellationPolicy;
