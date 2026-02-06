import React from "react";
import { ShieldCheck, XCircle, CheckCircle, Server, Zap } from "lucide-react";

const LandingWhySamvaadik = () => {
  return (
    <section className="py-20 px-4 sm:px-11 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Why Businesses Choose Samvaadik
          </h2>
          <p className="text-lg text-gray-600">
            Not all WhatsApp marketing tools are built the right way.
          </p>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Others */}
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-red-600 font-semibold">
              <XCircle className="w-5 h-5" />
              Manual / Unofficial Tools
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
                <span className="text-gray-800">
                  Automation hacks & unsafe scripts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
                <span className="text-gray-800">
                  High risk of WhatsApp number ban
                </span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
                <span className="text-gray-800">No official Meta approval</span>
              </li>
              <li className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
                <span className="text-gray-800">
                  Poor reliability & delivery issues
                </span>
              </li>
            </ul>
          </div>

          {/* Samvaadik */}
          <div className="bg-green-50 border border-green-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-green-700 font-semibold">
              <ShieldCheck className="w-5 h-5" />
              Samvaadik Platform
            </div>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  100% Official WhatsApp Business API
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">Zero risk of block or ban</span>
              </li>
              <li className="flex items-start gap-3">
                <Server className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  Built for scale & high delivery rates
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-green-600 mt-1" />
                <span className="text-gray-800">
                  Campaigns, retries, analytics & chat in one place
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Statement */}
        {/* <div className="mt-14 text-center">
          <p className="text-lg font-semibold text-gray-900">
            This is how serious businesses use WhatsApp.
          </p>
        </div> */}

        {/* Bottom Statement */}
        <div className="mt-20 flex justify-center">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <p className="text-lg font-semibold text-gray-900">
              This is how serious businesses use WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingWhySamvaadik;
