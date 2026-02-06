// components/landing/SecurityComplianceSection.jsx

import { ShieldCheck, FileCheck2, Server, Lock, Ban } from "lucide-react";

const securityPoints = [
  {
    title: "Official WhatsApp Business API",
    desc: "We use Meta’s official WhatsApp Business API — no unofficial tools or risky workarounds.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
  {
    title: "Meta-Approved Templates Only",
    desc: "All outbound messages are sent using Meta-approved templates to ensure compliance.",
    icon: <FileCheck2 className="w-6 h-6" />,
  },
  {
    title: "Safe Messaging Limits Managed by API",
    desc: "Rate limits, quality scores, and message caps are handled automatically by Meta’s API.",
    icon: <Server className="w-6 h-6" />,
  },
  {
    title: "Secure Webhook-Based Chat Sync",
    desc: "Incoming & outgoing messages are synced securely via verified webhooks.",
    icon: <Lock className="w-6 h-6" />,
  },
  {
    title: "Zero Risk of Spam Bans",
    desc: "No spam behavior, no unsafe automation — your business number stays protected.",
    icon: <Ban className="w-6 h-6" />,
  },
];

const SecurityComplianceSection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            Security & Compliance
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Trust. Approved by Meta.
          </h2>
          <p className="text-lg text-gray-600">
            Samvaadik is designed for businesses that care about safety,
            compliance, and long-term growth.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityPoints.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                {item.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-gray-800 font-semibold">
              100% Meta-Compliant • No Automation Hacks • No Ban Risk
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityComplianceSection;
