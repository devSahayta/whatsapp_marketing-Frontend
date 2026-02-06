// // components/landing/FinalCTASection.jsx

// import { ArrowRight, ShieldCheck, Rocket } from "lucide-react";
// import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

// const FinalCTASection = () => {
//   const { login, register } = useKindeAuth();

//   return (
//     <section className="relative py-28 overflow-hidden">
//       {/* Background Gradient */}
//       <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>

//       {/* Glow Effects */}
//       <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
//       <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black/10 rounded-full blur-3xl"></div>

//       {/* Content */}
//       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
//         {/* Badge */}
//         <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm font-semibold mb-6">
//           <ShieldCheck className="w-4 h-4 text-green-300" />
//           Official WhatsApp Business API • Meta-Compliant
//         </div>

//         {/* Heading */}
//         <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
//           Stop Risking Your WhatsApp Number.
//           <br />
//           Start Messaging the Right Way.
//         </h2>

//         {/* Subtext */}
//         <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-10">
//           Send unlimited WhatsApp messages using the official WhatsApp Business
//           API — no bans, no limits, no stress.
//         </p>

//         {/* CTA Buttons */}
//         <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
//           <button
//             onClick={() => register()}
//             className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
//           >
//             Get Started Free
//             <Rocket className="w-5 h-5" />
//           </button>

//           <button
//             onClick={() => login()}
//             className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200"
//           >
//             Login
//             <ArrowRight className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Trust Line */}
//         <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
//           <span>✔ No Credit Card Required</span>
//           <span>✔ Meta-Compliant Messaging</span>
//           <span>✔ Secure & Scalable</span>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default FinalCTASection;

// components/landing/FinalCTASection.jsx

import { ArrowRight, ShieldCheck, Rocket } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const FinalCTASection = () => {
  const { login, register } = useKindeAuth();

  return (
    <section
      className="relative py-28 bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/background-image.jpg')",
      }}
    >
      {/* Soft overlay for readability */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-gray-200 text-sm font-semibold text-gray-700 mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          Official WhatsApp Business API • Meta-Compliant
        </div>

        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Stop Risking Your WhatsApp Number.
          <br />
          <span className=" block mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Start Messaging the Right Way.
          </span>
        </h2>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto mb-10">
          Send unlimited WhatsApp messages using the{" "}
          <span className="font-semibold text-gray-900">
            official WhatsApp Business API
          </span>
          — no bans, no limits, no stress.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
          <button
            onClick={() => register()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Get Started
            <Rocket className="w-5 h-5" />
          </button>

          <button
            onClick={() => login()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/80 border border-gray-300 text-gray-800 font-semibold rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
          >
            Login
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Trust Line */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <span>✔ Meta-Compliant Messaging</span>
          <span>✔ Transparent Pricing</span>
          <span>✔ Secure & Scalable</span>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;
