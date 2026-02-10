import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const LandingHero = () => {
  const { login, register } = useKindeAuth();
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  useEffect(() => {
    if (!isDemoOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDemoOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDemoOpen]);

  return (
    <section
      className="relative min-h-[90vh] py-14 flex items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundImage: "url('/background-image.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          Official WhatsApp Business API
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Send Unlimited WhatsApp Messages
          <span className=" mt-2 block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Without Fear of Block or Ban
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto mb-10">
          Samvaadik helps businesses send WhatsApp messages safely using the
          official WhatsApp Business API — with campaigns, analytics, retries,
          and two-way chat.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {/* <button
            onClick={() => register()}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Get Started Free
          </button> */}

          <button
            onClick={() => setIsDemoOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Demo
          </button>

          {/* <button
            onClick={() => login()}
            className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            Login
          </button> */}

          <Link
            to="/contact"
            className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200"
          >
            Contact Us
          </Link>
        </div>

        {/* Trust Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-gray-200 shadow-sm">
            <Zap className="w-6 h-6 text-blue-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Unlimited Messaging</p>
            <p className="text-sm text-gray-600 mt-1">
              No daily sending limits
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-gray-200 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Ban-Safe</p>
            <p className="text-sm text-gray-600 mt-1">Fully Meta-compliant</p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-2xl p-5 border border-gray-200 shadow-sm">
            <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Live Analytics</p>
            <p className="text-sm text-gray-600 mt-1">Track delivery & reads</p>
          </div>
        </div>
      </div>

      {isDemoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
          role="dialog"
          aria-modal="true"
          aria-label="Product demo video"
          onClick={() => setIsDemoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-black shadow-2xl border border-white/10 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 z-10 rounded-full bg-white/10 text-white px-3 py-1 text-sm hover:bg-white/20 transition"
              onClick={() => setIsDemoOpen(false)}
              aria-label="Close demo"
            >
              Close
            </button>
            <video
              className="w-full h-auto"
              src="https://ygynmoezdffuencztefl.supabase.co/storage/v1/object/public/tool%20video/Recording%202026-02-09%20172822.mp4"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default LandingHero;
