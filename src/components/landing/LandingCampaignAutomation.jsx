import React from "react";
import { CalendarClock, RefreshCw, CheckCircle2 } from "lucide-react";

const LandingCampaignAutomation = () => {
  return (
    <section className="py-24 px-4 sm:px-11 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Automate WhatsApp Campaigns with Confidence
          </h2>
          <p className="text-lg text-gray-600">
            Schedule once, relax later — Samvaadik handles delivery, retries,
            and tracking.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
              <CalendarClock className="w-7 h-7 text-blue-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Schedule Campaigns
            </h3>

            <p className="text-gray-600 mb-4">
              Plan campaigns in advance and send messages at the perfect time.
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>Select groups & templates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>Choose date & time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>Auto-run at scheduled time</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
              <RefreshCw className="w-7 h-7 text-purple-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Smart Retry for Failed Messages
            </h3>

            <p className="text-gray-600 mb-4">
              Temporary failures shouldn’t cost you customers.
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>Retry only failed messages</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>No duplicate sends</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>One-click retry option</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Reliable Delivery at Scale
            </h3>

            <p className="text-gray-600 mb-4">
              Built to handle high volumes without breaking or risking bans.
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>Official WhatsApp API delivery</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>High deliverability rates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-1" />
                <span>No manual follow-ups needed</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Statement */}
        {/* <div className="mt-20 text-center">
          <p className="text-xl font-semibold text-gray-900">
            Create once. Schedule once. Deliver reliably — every time.
          </p>
        </div> */}

        {/* Bottom Statement */}
        <div className="mt-24 flex justify-center">
          <div className="relative bg-white rounded-2xl px-10 py-6 border border-gray-200 shadow-sm">
            <p className="text-xl font-semibold text-gray-900 text-center">
              Create once. Schedule once.{" "}
              <span className="text-blue-600">Deliver reliably</span> — every
              time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCampaignAutomation;
