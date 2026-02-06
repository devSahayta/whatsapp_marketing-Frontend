// components/landing/HowItWorksSection.jsx

import {
  Link,
  FileCheck,
  Users,
  Send,
  RotateCcw,
  BarChart3,
} from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Connect Your WhatsApp Business Number",
    desc: "Securely connect your number using the official WhatsApp Business API.",
    points: [
      "Official API connection",
      "One-time secure setup",
      "Zero block or ban risk",
    ],
    icon: <Link className="w-6 h-6" />,
  },
  {
    step: "02",
    title: "Create Meta-Approved Templates",
    desc: "Send only approved messages to stay 100% compliant.",
    points: [
      "Create message templates",
      "Submit for Meta approval",
      "Reuse templates anytime",
    ],
    icon: <FileCheck className="w-6 h-6" />,
  },
  {
    step: "03",
    title: "Upload Contacts & Create Groups",
    desc: "Organize your audience for targeted messaging.",
    points: [
      "CSV contact upload",
      "Unlimited groups",
      "Easy contact management",
    ],
    icon: <Users className="w-6 h-6" />,
  },
  {
    step: "04",
    title: "Send or Schedule Campaigns",
    desc: "Run campaigns automatically at scale.",
    points: [
      "Instant or scheduled campaigns",
      "Unlimited messaging",
      "Fully automated delivery",
    ],
    icon: <Send className="w-6 h-6" />,
  },
  {
    step: "05",
    title: "Retry Failed Messages",
    desc: "Recover missed reach without duplication.",
    points: [
      "Retry only failed messages",
      "One-click retry",
      "No duplicate sends",
    ],
    icon: <RotateCcw className="w-6 h-6" />,
  },
  {
    step: "06",
    title: "Track Analytics & Chat with Customers",
    desc: "Turn campaigns into conversations.",
    points: [
      "Sent, delivered & read tracking",
      "Open rate analytics",
      "Centralized chat dashboard",
    ],
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            How It Works
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Launch WhatsApp Campaigns in 6 Simple Steps
          </h2>
          <p className="text-lg text-gray-600">
            Samvaadik removes complexity, risk, and manual effort — so you can
            focus on growth.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div
              key={item.step}
              className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 p-6 group"
            >
              {/* Step number */}
              <div className="absolute -top-4 -right-4 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {item.step}
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 mb-4">{item.desc}</p>

              <ul className="space-y-2 text-sm text-gray-600">
                {item.points.map((point, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to launch your first WhatsApp campaign?
          </h3>
          <p className="text-gray-600 mb-6">
            Start safely. Scale confidently. Stay Meta-compliant.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
            Get Started with Samvaadik
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
