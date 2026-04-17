// src/components/NavBar.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  LogOut,
  ShieldCheck,
  Clock3,
  Menu as MenuIcon,
} from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import useSubscription from "../hooks/useSubscription";
import "../styles/navbar.css";

const NavBar = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { login, register, logout, isAuthenticated, user } = useKindeAuth();
  const { userId } = useAuthUser();
  const username = user?.email ? user.email.split("@")[0] : "";

  const { loading, active, plan, expiresAt } = useSubscription(userId, {
    enabled: isAuthenticated,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const getRemainingDays = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const diff = date.getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const remainingDays = getRemainingDays(expiresAt);

  const subscriptionLabel = loading
    ? "Checking plan..."
    : active
      ? `${plan?.name ?? "Active Plan"}${
          typeof remainingDays === "number"
            ? ` - ${remainingDays} day${remainingDays !== 1 ? "s" : ""} left`
            : ""
        }`
      : "No active subscription";

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleWhatsappAccount = () => {
    setIsDropdownOpen(false);
    navigate("/whatsapp-account");
  };

  return (
    <nav className={`navbar${isAuthenticated ? " navbar--fixed" : ""}`}>
      <div className="nav-left">
        {/* Show hamburger only when authenticated */}
        {isAuthenticated && (
          <button
            className="hamburger-btn"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={isSidebarOpen}
          >
            <MenuIcon size={20} />
          </button>
        )}

        <div className="nav-logo">
          <Link to="/" className="logo-link">
            <img
              src="/images/logo-samvaadik.png"
              alt="Samvaadik Logo"
              className="nav-logo-img"
            />
          </Link>
        </div>
      </div>

      <div className="nav-right">
        {isAuthenticated && (
          <div className="subscription-inline" title="Your subscription">
            {active ? <ShieldCheck size={16} /> : <Clock3 size={16} />}
            <span
              className={`subscription-badge ${active ? "active" : "inactive"}`}
            >
              {subscriptionLabel}
            </span>
          </div>
        )}

        {isAuthenticated ? (
          <div className="profile-wrapper" ref={dropdownRef}>
            <button
              className="nav-username"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <User size={18} className="user-icon" /> {username}
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="name">{username}</p>
                  <p className="email">{user?.email}</p>
                </div>

                <div className="dropdown-item">
                  <div className="left">
                    {active ? (
                      <ShieldCheck size={16} className="plan-icon-active" />
                    ) : (
                      <Clock3 size={16} className="plan-icon-inactive" />
                    )}
                    <Link to="/pricing">Subscription</Link>
                  </div>
                  <div className="right">
                    <span
                      className={`subscription-mini ${active ? "active" : "inactive"}`}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleWhatsappAccount}
                  className="dropdown-link"
                >
                  WhatsApp Account
                </button>

                <button onClick={handleLogout} className="dropdown-logout">
                  <LogOut size={14} className="inline mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Link
                to="/pricing"
                className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all duration-200 hover:-translate-y-0.5"
              >
                Pricing
              </Link>

              <button
                onClick={login}
                className="rounded-full px-5 py-2 text-sm font-medium text-gray-700 bg-white/60 backdrop-blur-md hover:bg-white/80 transition-all duration-200"
              >
                Login
              </button>

              <button
                onClick={register}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                Sign Up
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
