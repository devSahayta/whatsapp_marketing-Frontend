import React from "react";
import { BarChart3, Users, Layers, Send, Eye, Calendar } from "lucide-react";

const LandingAnalyticsPreview = () => {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Advanced WhatsApp Analytics Dashboard
          </h2>
          <p className="text-lg text-gray-600">
            Clear insights to track performance, optimize campaigns, and grow
            faster.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-3xl p-8 shadow-sm">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            <MetricCard
              icon={Layers}
              title="Total Groups"
              subtitle="All active groups"
            />
            <MetricCard
              icon={Users}
              title="Total Contacts"
              subtitle="Reach at scale"
            />
            <MetricCard
              icon={Send}
              title="Messages Sent"
              subtitle="Template messages"
            />
            <MetricCard
              icon={BarChart3}
              title="Delivered"
              subtitle="Successful delivery"
            />
            <MetricCard
              icon={Eye}
              title="Open Rate"
              subtitle="Read performance"
            />
          </div>

          {/* Chart + Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Placeholder */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Message Performance Overview
                </h3>
              </div>

              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                Bar graph showing Sent, Delivered & Read messages
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  Date Range Filters
                </h3>
              </div>

              <ul className="space-y-3 list-disc pl-7 text-sm text-gray-700">
                <li>Filter analytics by date range</li>
                <li>Compare campaign performance</li>
                <li>Track growth over time</li>
                <li>Make data-driven decisions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        {/* <div className="mt-16 text-center">
          <p className="text-lg font-semibold text-gray-900">
            What gets measured, gets improved.
          </p>
          <p className="text-gray-600 mt-2">
            Samvaadik gives you visibility — not guesswork.
          </p>
        </div> */}

        {/* Bottom Line */}
        <div className="mt-24 flex justify-center">
          <div className="bg-white rounded-2xl px-10 py-6 border border-gray-200 shadow-sm text-center max-w-2xl">
            <p className="text-xl font-semibold text-gray-900">
              What gets measured,{" "}
              <span className="text-blue-600">gets improved</span>.
            </p>
            <p className="text-gray-600 mt-2">
              Samvaadik gives you visibility — not guesswork.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* Metric Card */
const MetricCard = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
      <Icon className="w-6 h-6 text-blue-600 mx-auto mb-3" />
      <p className="font-bold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
};

export default LandingAnalyticsPreview;
