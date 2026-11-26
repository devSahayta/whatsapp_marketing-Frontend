// src/components/Sidebar.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  Calendar,
  MessageSquare,
  LayersIcon,
  BarChart3,
  PlugZap,
  Bot,
  Key,
  ShieldCheck,
  Clock3,
  Coins,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  Smartphone,
  X,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import useSubscription from "../hooks/useSubscription";
import { useUserCredits } from "../hooks/useUserCredits";
import "../styles/sidebar.css";
import SamvaadikAIMark from "./SamvaadikAIMark";

const links = [
  { name: "Analytics", path: "/", icon: <BarChart3 size={18} /> },
  { name: "Chat", path: "/chat", icon: <MessageSquare size={18} /> },
  { name: "Groups", path: "/groups", icon: <Calendar size={18} /> },
  { name: "Templates", path: "/templates", icon: <LayersIcon size={18} /> },
  { name: "Campaigns", path: "/campaigns", icon: <Calendar size={18} /> },
  { name: "Chatbot Flows", path: "/chatbot", icon: <Bot size={18} /> },
  { name: "Integrations", path: "/integrations", icon: <PlugZap size={18} /> },
  { name: "Agents", path: "/agents", icon: <Bot size={18} /> },
  { name: "API Keys", path: "/api-keys", icon: <Key size={18} /> },
];

const getRemainingDays = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getDisplayName = (user) => {
  if (!user) return "";
  if (user.given_name) return user.given_name;
  if (user.full_name) return user.full_name.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "";
};

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout, user } = useKindeAuth();
  const { userId } = useAuthUser();
  const location = useLocation();
  const drawerRef = useRef(null);
  const accountRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { loading, active, plan, expiresAt } = useSubscription(userId, {
    enabled: true,
  });
  const { credits } = useUserCredits(userId, true);

  // Briefly pulse the credits row whenever the balance actually changes (not
  // on first load) — the same quiet "something just happened" cue the
  // navbar used to give, now living where the number actually lives.
  const [creditsPulsing, setCreditsPulsing] = useState(false);
  const prevCreditsRef = useRef(null);
  useEffect(() => {
    if (typeof credits !== "number") return;
    if (prevCreditsRef.current !== null && prevCreditsRef.current !== credits) {
      setCreditsPulsing(true);
      const timer = setTimeout(() => setCreditsPulsing(false), 650);
      prevCreditsRef.current = credits;
      return () => clearTimeout(timer);
    }
    prevCreditsRef.current = credits;
  }, [credits]);

  // Account menu: close on outside click, Escape, or route change
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // close on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Prevent scroll when sidebar open (mobile overlay only)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const remainingDays = getRemainingDays(expiresAt);
  const subscriptionLabel = loading
    ? "Checking plan…"
    : active
      ? `${plan?.name ?? "Active plan"}${
          typeof remainingDays === "number"
            ? ` · ${remainingDays} day${remainingDays !== 1 ? "s" : ""} left`
            : ""
        }`
      : "No active subscription";

  const displayName = getDisplayName(user);
  const initial = (displayName || user?.email || "?").charAt(0).toUpperCase();

  const handleLogout = () => {
    setMenuOpen(false);
    onClose();
    logout();
  };

  const handleWhatsappAccount = () => {
    setMenuOpen(false);
    onClose();
    navigate("/whatsapp-account");
  };

  return (
    <>
      {/* Overlay — mobile/tablet only, see sidebar.css */}
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside
        ref={drawerRef}
        className={`sidebar-drawer ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
      >
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-brand-link" onClick={onClose}>
            <img
              src="/images/logo-samvaadik.webp"
              alt="Samvaadik Logo"
              width="332"
              height="128"
              className="sidebar-brand-img"
            />
          </Link>
          <button
            onClick={onClose}
            className="sidebar-close"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-links">
          {links.map((l) => (
            <NavLink
              key={l.path}
              to={l.path}
              end={l.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <span className="icon">{l.icon}</span>
              <span className="label">{l.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" ref={accountRef}>
          {menuOpen && (
            <div className="sidebar-menu" role="menu">
              <Link
                to="/pricing"
                className="sidebar-menu-row"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClose();
                }}
              >
                <span
                  className={`sidebar-stat-icon ${active ? "is-active" : "is-inactive"}`}
                >
                  {active ? <ShieldCheck size={15} /> : <Clock3 size={15} />}
                </span>
                <span className="sidebar-menu-text">
                  <span className="sidebar-menu-label">Subscription</span>
                  <span className="sidebar-menu-value">
                    {subscriptionLabel}
                  </span>
                </span>
                <ChevronRight size={14} className="sidebar-stat-chevron" />
              </Link>

              <Link
                to="/pricing"
                className={`sidebar-menu-row ${creditsPulsing ? "pulse" : ""}`}
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClose();
                }}
              >
                <span className="sidebar-stat-icon is-credits">
                  <SamvaadikAIMark size={24} />
                </span>
                <span className="sidebar-menu-text">
                  <span className="sidebar-menu-label">Credits</span>
                  <span className="sidebar-menu-value">
                    {typeof credits === "number"
                      ? `${credits.toLocaleString("en-IN")} available`
                      : "Loading…"}
                  </span>
                </span>
                <ChevronRight size={14} className="sidebar-stat-chevron" />
              </Link>

              <button
                onClick={handleWhatsappAccount}
                className="sidebar-menu-row"
                role="menuitem"
              >
                <span className="sidebar-stat-icon is-neutral">
                  <Smartphone size={15} />
                </span>
                <span className="sidebar-menu-text">
                  <span className="sidebar-menu-label">WhatsApp account</span>
                  <span className="sidebar-menu-value">Number & profile</span>
                </span>
                <ChevronRight size={14} className="sidebar-stat-chevron" />
              </button>

              <div className="sidebar-menu-divider" />

              <button
                onClick={handleLogout}
                className="sidebar-menu-row danger"
                role="menuitem"
              >
                <span className="sidebar-stat-icon is-danger">
                  <LogOut size={15} />
                </span>
                <span className="sidebar-menu-text">
                  <span className="sidebar-menu-label">Log out</span>
                </span>
              </button>
            </div>
          )}

          <button
            className={`sidebar-profile${menuOpen ? " is-open" : ""}${
              creditsPulsing ? " pulse" : ""
            }`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="sidebar-avatar">{initial}</div>
            <div className="sidebar-profile-info">
              <p className="sidebar-profile-name">
                {displayName || "Your account"}
              </p>
              <p className="sidebar-profile-email">{user?.email}</p>
            </div>
            <ChevronsUpDown size={16} className="sidebar-profile-caret" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
