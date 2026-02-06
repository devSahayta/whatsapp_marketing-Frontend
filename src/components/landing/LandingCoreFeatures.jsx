import React from "react";
import {
  Link2,
  FileText,
  Users,
  Send,
  Megaphone,
  RefreshCw,
  BarChart3,
  MessageCircle,
} from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "WhatsApp Business API Connection",
    description: "Connect your WhatsApp Business number securely.",
    points: [
      "Official API connection",
      "Secure authentication",
      "Built for scale",
    ],
  },
  {
    icon: FileText,
    title: "Template Management (Spam-Safe)",
    description: "Send only Meta-approved messages.",
    points: [
      "Create WhatsApp templates",
      "View approval status",
      "Reuse templates anytime",
      "Templates keep messaging compliant",
    ],
  },
  {
    icon: Users,
    title: "Contact Groups (CSV Powered)",
    description: "Manage contacts efficiently.",
    points: [
      "Create unlimited groups",
      "Import contacts via CSV",
      "Add or remove contacts anytime",
      "Use groups across campaigns",
    ],
  },
  {
    icon: Send,
    title: "Safe Bulk Template Messaging",
    description: "Send messages at scale — without fear.",
    points: [
      "Send to thousands of contacts",
      "No manual limits",
      "No spam risk",
      "Fully Meta-compliant delivery",
    ],
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description: "Automate WhatsApp marketing.",
    points: [
      "Create campaigns",
      "Select groups & templates",
      "Schedule campaigns for any time",
      "Auto-run at scheduled time",
      "Update or delete campaigns",
    ],
  },
  {
    icon: RefreshCw,
    title: "Retry Failed Campaigns",
    description: "Recover failed messages easily.",
    points: [
      "Retry only failed messages",
      "No duplicate sends",
      "One-click retry option",
    ],
  },
  {
    icon: BarChart3,
    title: "Campaign Analytics",
    description: "Track real campaign performance.",
    points: ["Messages sent", "Delivered", "Read", "Campaign-wise analytics"],
  },
  {
    icon: MessageCircle,
    title: "Two-Way Chat Dashboard",
    description: "Turn messages into conversations.",
    points: [
      "View customer replies",
      "View your sent template messages",
      "Admin replies as per Meta rules",
      "Centralized WhatsApp inbox",
    ],
  },
];

const LandingCoreFeatures = () => {
  return (
    <section className="py-24 px-4 sm:px-11 bg-gradient-to-b from-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Everything You Need for WhatsApp Marketing
          </h2>
          <p className="text-lg text-gray-600">
            Built for safety, scale, automation, and real conversations.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-3xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-4">{feature.description}</p>

                {/* Points */}
                <ul className="space-y-2 text-sm text-gray-700">
                  {feature.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom Line */}
        {/* <div className="mt-20 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Campaigns bring reach. Analytics bring clarity. Conversations bring
            conversions.
          </p>
        </div> */}

        {/* Bottom Line */}
        <div className="mt-24 flex justify-center">
          <div className="relative bg-white rounded-2xl px-8 py-5 border border-gray-200 shadow-sm">
            <p className="text-lg font-semibold text-gray-900 text-center">
              Campaigns bring <span className="text-blue-600">reach</span>.
              Analytics bring <span className="text-purple-600">clarity</span>.
              Conversations bring{" "}
              <span className="text-green-600">conversions</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCoreFeatures;
