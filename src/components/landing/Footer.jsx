// components/landing/Footer.jsx

import { Mail, Globe, ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-white/80 backdrop-blur border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className=" col-span-2 space-y-3 max-w-80 ">
            {/* <h3 className="text-2xl font-bold text-gray-900 mb-3">Samvaadik</h3> */}
            <img
              src="/images/logo-samvaadik.png"
              alt="Samvaadik Logo"
              className="h-10 w-auto"
            />
            <p className="text-gray-600 text-sm leading-relaxed">
              Safe, scalable WhatsApp marketing using the official WhatsApp
              Business API. No bans. No limits. Just growth.
            </p>
          </div>

          {/* Product */}
          {/* <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>WhatsApp Campaigns</li>
              <li>Template Management</li>
              <li>Contact Groups</li>
              <li>Analytics Dashboard</li>
              <li>Chat Inbox</li>
            </ul>
          </div> */}

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>About</li>
              <li>Privacy Policy</li>
              <li>Terms & Conditions</li>
              <li>Contact</li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Trust & Compliance
            </h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Official WhatsApp Business API
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Meta-Compliant Messaging
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Secure Webhook Integration
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Samvaadik.com. All rights reserved.
          </p>

          <p className="text-sm text-gray-500">
            Built with ❤️ for WhatsApp-first businesses
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
