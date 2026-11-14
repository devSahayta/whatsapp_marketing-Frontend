// components/landing/Footer.jsx

import { Link } from "react-router-dom";
import { Mail, Globe, ShieldCheck } from "lucide-react";
import { MARKETING_PAGES } from "../../marketing/marketingPages";

const Footer = () => {
  return (
    <footer className="relative bg-white/80 backdrop-blur border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-3 max-w-80">
            {/* <h3 className="text-2xl font-bold text-gray-900 mb-3">Samvaadik</h3> */}
            <img
              src="/images/logo-samvaadik.webp"
              alt="Samvaadik Logo"
              width="332"
              height="128"
              loading="lazy"
              className="h-10 w-auto"
            />
            <p className="text-gray-600 text-sm leading-relaxed">
              Safe, scalable WhatsApp marketing using the official WhatsApp
              Business API. No bans. No limits. Just growth.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/features" className="hover:text-gray-900">
                  All Features
                </Link>
              </li>
              {MARKETING_PAGES.filter((p) => p.category === "Feature").map(
                (p) => (
                  <li key={p.path}>
                    <Link to={p.path} className="hover:text-gray-900">
                      {p.navLabel}
                    </Link>
                  </li>
                )
              )}
              <li>
                <Link to="/pricing" className="hover:text-gray-900">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrations & use cases */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Solutions
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {MARKETING_PAGES.filter((p) => p.category !== "Feature").map(
                (p) => (
                  <li key={p.path}>
                    <Link to={p.path} className="hover:text-gray-900">
                      {p.navLabel}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/about" className="hover:text-gray-900">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-and-conditions"
                  className="hover:text-gray-900"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-cancellation-policy"
                  className="hover:text-gray-900"
                >
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
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
