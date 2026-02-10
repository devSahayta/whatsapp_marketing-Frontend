// src/components/NavBar.jsx

import React, { useState, useEffect, useRef } from "react";
import { User, LogOut, Coins, Calendar, Menu as MenuIcon } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useUserCredits } from "../hooks/useUserCredits";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const NavBar = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { login, register, logout, isAuthenticated, user } = useKindeAuth();
  const username = user?.email ? user.email.split("@")[0] : "";

  const { credits, loading, refetchCredits } = useUserCredits(
    user?.id,
    isAuthenticated,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    // Only add listener if dropdown is open
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [navigate]);

  const getCreditBadgeClass = () => {
    if (loading) return "credit-badge gray";
    if (credits <= 5) return "credit-badge red";
    if (credits <= 20) return "credit-badge yellow";
    return "credit-badge green";
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const handleWhatsappAccount = () => {
    setIsDropdownOpen(false);
    navigate("/whatsapp-account");
  };

  return (
    <nav className="navbar ">
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
        {/* Credits visible in navbar (left of profile) */}
        {isAuthenticated && (
          <div className="credits-inline" title="Your credits">
            <Coins size={16} />
            <span className={getCreditBadgeClass()}>
              {loading ? "..." : (credits ?? 0)}
            </span>
            <button
              className="refresh-small"
              onClick={refetchCredits}
              title="Refresh credits"
            >
              🔄
            </button>
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
                    <Coins size={16} className="coin" />
                    <span>Credits</span>
                  </div>
                  <div className="right">
                    <span className={getCreditBadgeClass()}>
                      {loading ? "..." : (credits ?? 0)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        refetchCredits();
                      }}
                      className="refresh-btn"
                      title="Refresh credits"
                    >
                      🔄
                    </button>
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
                to="/contact"
                className="rounded-full px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 shadow-lg shadow-orange-500/30 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 transition-all duration-200 hover:-translate-y-0.5"
              >
                Pricing
              </Link>

              {/* <Link
                to="/pricing"
                className="text-sm font-medium text-gray-700 
             hover:text-indigo-600 
             relative after:absolute after:-bottom-1 after:left-0 
             after:h-[2px] after:w-0 after:bg-rose-500 
             hover:after:w-full after:transition-all after:duration-300"
              >
                Pricing
              </Link> */}

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
