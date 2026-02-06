import React from "react";
import { AlertTriangle, ShieldCheck, Ban, Infinity } from "lucide-react";

const LandingProblemSolution = () => {
  return (
    <section className="relative py-20 px-4 sm:px-11 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Manual WhatsApp Marketing Is Risky
          </h2>
          <p className="text-lg text-gray-600">
            Most businesses unknowingly put their WhatsApp number at risk.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Problem Card */}
          <div className="relative bg-red-50 border border-red-200 rounded-3xl p-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <AlertTriangle className="w-4 h-4" />
              The Problem
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Using Normal WhatsApp for Business
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 mt-1" />
                <span className="text-gray-800">
                  Limited manual sending (around 100 messages)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 mt-1" />
                <span className="text-gray-800">
                  Bulk messages trigger spam detection
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 mt-1" />
                <span className="text-gray-800">
                  High risk of number block or permanent ban
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 mt-1" />
                <span className="text-gray-800">
                  No scheduling, no automation, no analytics
                </span>
              </li>
            </ul>

            <p className="mt-6 text-sm font-semibold text-red-700">
              One wrong move can block your business number forever.
            </p>
          </div>

          {/* Solution Card */}
          <div className="relative bg-green-50 border border-green-200 rounded-3xl p-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" />
              The Samvaadik Way
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Official WhatsApp Business API
            </h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Infinity className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  Send unlimited messages safely
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">Zero risk of block or ban</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  Fully Meta-compliant messaging
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  Campaigns, retries, analytics & chat — all included
                </span>
              </li>
            </ul>

            <p className="mt-6 text-sm font-semibold text-green-700">
              Your number stays safe. Your business scales confidently.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingProblemSolution;
