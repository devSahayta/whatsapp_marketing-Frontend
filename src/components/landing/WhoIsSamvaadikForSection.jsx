// components/landing/WhoIsSamvaadikForSection.jsx

import {
  Briefcase,
  Megaphone,
  Users,
  Building2,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";

const useCases = [
  {
    title: "Growing Businesses",
    desc: "Businesses that want to send bulk WhatsApp messages without worrying about blocks or bans.",
    icon: <Briefcase className="w-6 h-6" />,
  },
  {
    title: "Marketing & Sales Teams",
    desc: "Teams running promotions, follow-ups, and campaigns at scale with full analytics.",
    icon: <Megaphone className="w-6 h-6" />,
  },
  {
    title: "Agencies & Consultants",
    desc: "Agencies managing WhatsApp campaigns for multiple clients using one secure platform.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: "Enterprises & Startups",
    desc: "High-volume messaging with compliance, automation, and reliable delivery.",
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    title: "E-commerce & D2C Brands",
    desc: "Order updates, offers, abandoned cart reminders, and customer engagement.",
    icon: <ShoppingBag className="w-6 h-6" />,
  },
  {
    title: "Any Business That Values Safety",
    desc: "If WhatsApp matters to your business, Samvaadik keeps your number safe and scalable.",
    icon: <ShieldCheck className="w-6 h-6" />,
  },
];

const WhoIsSamvaadikForSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            Who Is Samvaadik For?
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Built for Businesses That Take WhatsApp Seriously
          </h2>
          <p className="text-lg text-gray-600">
            Whether you’re sending hundreds or millions of messages, Samvaadik
            is designed to grow with you — safely.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((item, index) => (
            <div
              key={index}
              className="group bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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

        {/* Bottom Statement */}
        {/* <div className="mt-20 text-center">
          <p className="text-lg font-semibold text-gray-800">
            If WhatsApp is critical to your business —
            <span className="text-blue-600"> Samvaadik is essential.</span>
          </p>
        </div> */}

        {/* Bottom Statement */}
        <div className="mt-24 flex justify-center">
          <div className="bg-white rounded-2xl px-10 py-6 border border-gray-200 shadow-sm text-center">
            <p className="text-lg font-semibold text-gray-800">
              If WhatsApp is critical to your business —
              <span className="text-blue-600"> Samvaadik is essential.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoIsSamvaadikForSection;
