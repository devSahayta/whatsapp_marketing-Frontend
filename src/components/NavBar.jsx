// src/components/NavBar.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  Menu as MenuIcon,
  Sparkles,
  BarChart3,
  MessageSquare,
  Users,
  LayersIcon,
  Megaphone,
  Bot,
  PlugZap,
  Key,
  CreditCard,
  Smartphone,
  LayoutDashboard,
  Workflow,
  ChevronDown,
  ArrowRight,
  Send,
  MessagesSquare,
  Code2,
  ShoppingCart,
  Sheet,
  X,
  BookOpen,
  Info,
  Mail,
} from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useUserCredits } from "../hooks/useUserCredits";
import "../styles/navbar.css";
import NotificationBell from "./NotificationBell";
import "../styles/notification.css";
import SamvaadikAIMark from "./SamvaadikAIMark";

// Title + one-line description + icon for whichever page the user is on.
// Order matters: the first entry whose test passes wins, so specific paths
// sit above the broader prefixes they'd otherwise be swallowed by.
const PAGE_META = [
  {
    test: (p) => p === "/",
    title: "Analytics",
    sub: "How your campaigns and conversations are performing",
    icon: BarChart3,
  },
  {
    test: (p) => p.startsWith("/chat"),
    title: "Chat",
    sub: "Talk to your customers in real time",
    icon: MessageSquare,
  },
  {
    test: (p) => p.startsWith("/groups") || p.startsWith("/createGroup"),
    title: "Groups",
    sub: "Organise the contacts you send to",
    icon: Users,
  },
  {
    test: (p) => p.startsWith("/template"),
    title: "Templates",
    sub: "Build, preview and send approved Meta templates",
    icon: LayersIcon,
  },
  {
    test: (p) => p.startsWith("/campaigns/create"),
    title: "New campaign",
    sub: "Pick a group and a template, then schedule it",
    icon: Megaphone,
  },
  {
    test: (p) => p.startsWith("/campaigns"),
    title: "Campaigns",
    sub: "Track, schedule and manage every send",
    icon: Megaphone,
  },
  {
    test: (p) => p.startsWith("/chatbot"),
    title: "Chatbot flows",
    sub: "Automate replies with visual flows",
    icon: Bot,
  },
  {
    test: (p) => p.startsWith("/integrations"),
    title: "Integrations",
    sub: "Connect the tools you already use",
    icon: PlugZap,
  },
  {
    test: (p) => p.startsWith("/agents"),
    title: "Agents",
    sub: "Voice and chat agents that work for you",
    icon: Bot,
  },
  {
    test: (p) => p.startsWith("/api-keys"),
    title: "API keys",
    sub: "Access Samvaadik from your own systems",
    icon: Key,
  },
  {
    test: (p) => p.startsWith("/pricing") || p.startsWith("/payment-logs"),
    title: "Plan & credits",
    sub: "Your subscription, credits and billing",
    icon: CreditCard,
  },
  {
    test: (p) => p.startsWith("/whatsapp-account"),
    title: "WhatsApp account",
    sub: "The number and business profile you send from",
    icon: Smartphone,
  },
];

// Logged-out "Features" mega menu. Paths are the real marketing pages
// (see src/marketing/marketingPages.js).
const MENU_FEATURES = [
  {
    icon: Send,
    title: "Bulk campaigns",
    sub: "Send approved templates to thousands, scheduled",
    to: "/features/whatsapp-bulk-messaging",
  },
  {
    icon: Workflow,
    title: "Chatbot builder",
    sub: "Drag-and-drop flows with triggers and AI steps",
    to: "/features/whatsapp-chatbot-builder",
  },
  {
    icon: Sparkles,
    title: "AI agent",
    sub: "Replies in your words, with human handoff",
    to: "/features/whatsapp-ai-agent",
    tag: "New",
  },
  {
    icon: MessagesSquare,
    title: "Team inbox",
    sub: "One shared inbox for every customer reply",
    to: "/features/whatsapp-team-inbox",
  },
  {
    icon: Code2,
    title: "Developer API",
    sub: "API keys and webhooks for your own software",
    to: "/features/whatsapp-business-api",
  },
];

const MENU_INTEGRATIONS = [
  {
    icon: ShoppingCart,
    title: "WooCommerce",
    sub: "Order updates and cart recovery",
    to: "/woocommerce-whatsapp-integration",
  },
  {
    icon: Sheet,
    title: "Google Sheets",
    sub: "Import contacts, export results",
    to: "/google-sheets-whatsapp-integration",
  },
];

const MENU_RESOURCES = [
  {
    icon: BookOpen,
    title: "Blog",
    sub: "Guides on WhatsApp Business API",
    to: "/blog",
  },
  {
    icon: Info,
    title: "About us",
    sub: "Who is behind Samvaadik",
    to: "/about",
  },
  { icon: Mail, title: "Contact", sub: "Talk to our team", to: "/contact" },
];

const getPageMeta = (pathname) =>
  PAGE_META.find((m) => m.test(pathname)) || {
    title: "Samvaadik",
    sub: "WhatsApp marketing, made simple",
    icon: LayoutDashboard,
  };

// The authenticated navbar is deliberately light: the sidebar is the app's
// home base (nav links, account, plan and credits all live there — see
// Sidebar.jsx), so this bar just tells you where you are and shows the assistant
// credits left. On mobile the sidebar is an off-canvas
// drawer, so the hamburger + logo come back and the page title steps aside
// (see the lg breakpoint rules in navbar.css).
const NavBar = ({ onToggleSidebar, isSidebarOpen }) => {
  const { login, register, isAuthenticated } = useKindeAuth();
  const { userId } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();

  const meta = getPageMeta(location.pathname);
  const PageIcon = meta.icon;

  // Assistant credits left. Same balance the Samvaadik AI assistant spends
  // from; the hook refetches on every chat turn via the credits-changed event.
  const { credits, loading: creditsLoading } = useUserCredits(
    userId,
    isAuthenticated,
  );
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
  const creditsKnown = typeof credits === "number";
  const creditsLow = creditsKnown && credits <= 0;

  // Logged-out bar: shadow on scroll, dropdown menus, dismissible banner.
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "features" | "resources" | null
  const [bannerOpen, setBannerOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null); // "features" | "resources" | null
  const barRef = useRef(null);
  const closeTimer = useRef(null);
  const BANNER_KEY = "samvaadik_banner_ai_v1";

  useEffect(() => {
    try {
      if (window.localStorage.getItem(BANNER_KEY) === "1") setBannerOpen(false);
    } catch {
      /* storage blocked: just show the banner */
    }
  }, []);

  const dismissBanner = () => {
    setBannerOpen(false);
    try {
      window.localStorage.setItem(BANNER_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [location.pathname]);

  // Mobile menu: Esc closes it, and the page behind it stops scrolling.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpenMenu(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  const openNow = (name) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(name);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  };

  // Logged-out visitors get a standard top bar: logo and links on the left, Log in /
  // Sign up on the right, with a Features mega menu. Colors
  // come from the Samvaadik logo (rose "S" + indigo wordmark).
  if (!isAuthenticated) {
    const onFeaturesPath =
      location.pathname.startsWith("/features") ||
      location.pathname.includes("whatsapp-integration");
    const onResourcesPath = ["/blog", "/about", "/contact"].some((x) =>
      location.pathname.startsWith(x),
    );

    return (
      <>
        {bannerOpen && (
          <div className="nav-banner">
            <Link to="/features/whatsapp-ai-agent" className="nav-banner-link">
              <Sparkles size={15} />
              <span>
                Meet Samvaadik AI: create campaigns and templates just by
                chatting.
              </span>
              <strong>
                Explore AI <ArrowRight size={14} />
              </strong>
            </Link>
            <button
              type="button"
              className="nav-banner-close"
              onClick={dismissBanner}
              aria-label="Dismiss announcement"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {mobileOpen && (
          <div
            className="nav-mobile-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav
          ref={barRef}
          className={`navbar navbar--public${scrolled ? " is-scrolled" : ""}${
            mobileOpen ? " is-menu-open" : ""
          }`}
        >
          <div className="nav-shell">
            <Link to="/" className="logo-link" aria-label="Samvaadik home">
              <img
                src="/images/logo-samvaadik.webp"
                alt="Samvaadik Logo"
                width="332"
                height="128"
                className="nav-logo-img nav-logo-img--public"
              />
            </Link>

            <div className="nav-public-links">
              {/* Features mega menu */}
              <div
                className="nav-menu-wrap"
                onMouseEnter={() => openNow("features")}
                onMouseLeave={closeSoon}
              >
                <button
                  type="button"
                  className={`nav-public-link nav-menu-trigger${
                    openMenu === "features" || onFeaturesPath
                      ? " is-active"
                      : ""
                  }`}
                  aria-expanded={openMenu === "features"}
                  aria-haspopup="true"
                  onClick={() =>
                    window.innerWidth <= 720
                      ? navigate("/features")
                      : setOpenMenu((m) =>
                          m === "features" ? null : "features",
                        )
                  }
                >
                  Features
                  <ChevronDown
                    size={15}
                    className={`nav-menu-chevron${
                      openMenu === "features" ? " is-open" : ""
                    }`}
                  />
                </button>

                <div
                  className={`nav-mega nav-mega--wide${
                    openMenu === "features" ? " is-open" : ""
                  }`}
                >
                  <div className="nav-mega-cols">
                    <div className="nav-mega-col">
                      <div className="nav-mega-heading">Features</div>
                      {MENU_FEATURES.map(
                        ({ icon: Icon, title, sub, to, tag }) => (
                          <Link key={to} to={to} className="nav-mega-item">
                            <span className="nav-mega-icon">
                              <Icon size={18} />
                            </span>
                            <span className="nav-mega-text">
                              <span className="nav-mega-title">
                                {title}
                                {tag && <em className="nav-mega-tag">{tag}</em>}
                              </span>
                              <span className="nav-mega-sub">{sub}</span>
                            </span>
                          </Link>
                        ),
                      )}
                    </div>

                    <div className="nav-mega-col nav-mega-col--side">
                      <div className="nav-mega-heading">Integrations</div>
                      {MENU_INTEGRATIONS.map(
                        ({ icon: Icon, title, sub, to }) => (
                          <Link key={to} to={to} className="nav-mega-item">
                            <span className="nav-mega-icon">
                              <Icon size={18} />
                            </span>
                            <span className="nav-mega-text">
                              <span className="nav-mega-title">{title}</span>
                              <span className="nav-mega-sub">{sub}</span>
                            </span>
                          </Link>
                        ),
                      )}

                      <div className="nav-mega-promo">
                        <div className="nav-mega-promo-title">
                          Start sending on WhatsApp today
                        </div>
                        <div className="nav-mega-promo-sub">
                          Official Business API, approved templates, one inbox.
                        </div>
                        <button
                          type="button"
                          className="nav-mega-promo-btn"
                          onClick={register}
                        >
                          Sign up free <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Link to="/features" className="nav-mega-foot">
                    <span>See everything Samvaadik can do</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <Link
                to="/pricing"
                className={`nav-public-link${
                  location.pathname.startsWith("/pricing") ? " is-active" : ""
                }`}
              >
                Pricing
              </Link>

              {/* Resources dropdown */}
              <div
                className="nav-menu-wrap"
                onMouseEnter={() => openNow("resources")}
                onMouseLeave={closeSoon}
              >
                <button
                  type="button"
                  className={`nav-public-link nav-menu-trigger${
                    openMenu === "resources" || onResourcesPath
                      ? " is-active"
                      : ""
                  }`}
                  aria-expanded={openMenu === "resources"}
                  aria-haspopup="true"
                  onClick={() =>
                    window.innerWidth <= 720
                      ? navigate("/blog")
                      : setOpenMenu((m) =>
                          m === "resources" ? null : "resources",
                        )
                  }
                >
                  Resources
                  <ChevronDown
                    size={15}
                    className={`nav-menu-chevron${
                      openMenu === "resources" ? " is-open" : ""
                    }`}
                  />
                </button>

                <div
                  className={`nav-mega nav-mega--small${
                    openMenu === "resources" ? " is-open" : ""
                  }`}
                >
                  {MENU_RESOURCES.map(({ icon: Icon, title, sub, to }) => (
                    <Link key={to} to={to} className="nav-mega-item">
                      <span className="nav-mega-icon">
                        <Icon size={18} />
                      </span>
                      <span className="nav-mega-text">
                        <span className="nav-mega-title">{title}</span>
                        <span className="nav-mega-sub">{sub}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="nav-public-actions">
              <Link to="/contact" className="nav-btn-contact">
                Contact
              </Link>
              <button onClick={login} className="nav-btn-ghost">
                Log in
              </button>
              <button onClick={register} className="nav-btn-primary">
                <span>Sign up free</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                className="nav-burger"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
              </button>
            </div>
          </div>

          {/* Phone / tablet menu: everything the desktop bar offers */}
          <div className={`nav-mobile${mobileOpen ? " is-open" : ""}`}>
            <div className="nav-mobile-inner">
              {/* Features accordion */}
              <button
                type="button"
                className={`nav-mrow${mobileSection === "features" ? " is-open" : ""}`}
                aria-expanded={mobileSection === "features"}
                onClick={() =>
                  setMobileSection((m) =>
                    m === "features" ? null : "features",
                  )
                }
              >
                <span className="nav-mrow-icon">
                  <Sparkles size={18} />
                </span>
                <span className="nav-mrow-label">Features</span>
                <ChevronDown size={18} className="nav-mrow-chev" />
              </button>
              <div
                className={`nav-acc${mobileSection === "features" ? " is-open" : ""}`}
              >
                <div className="nav-acc-inner">
                  <div className="nav-mobile-group">Features</div>
                  {MENU_FEATURES.map(({ icon: Icon, title, sub, to, tag }) => (
                    <Link key={to} to={to} className="nav-mega-item">
                      <span className="nav-mega-icon">
                        <Icon size={18} />
                      </span>
                      <span className="nav-mega-text">
                        <span className="nav-mega-title">
                          {title}
                          {tag && <em className="nav-mega-tag">{tag}</em>}
                        </span>
                        <span className="nav-mega-sub">{sub}</span>
                      </span>
                    </Link>
                  ))}
                  <div className="nav-mobile-group">Integrations</div>
                  {MENU_INTEGRATIONS.map(({ icon: Icon, title, sub, to }) => (
                    <Link key={to} to={to} className="nav-mega-item">
                      <span className="nav-mega-icon">
                        <Icon size={18} />
                      </span>
                      <span className="nav-mega-text">
                        <span className="nav-mega-title">{title}</span>
                        <span className="nav-mega-sub">{sub}</span>
                      </span>
                    </Link>
                  ))}
                  <Link to="/features" className="nav-mega-foot">
                    <span>See everything Samvaadik can do</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>

              <Link to="/pricing" className="nav-mrow">
                <span className="nav-mrow-icon">
                  <CreditCard size={18} />
                </span>
                <span className="nav-mrow-label">Pricing</span>
                <ArrowRight size={16} className="nav-mrow-arrow" />
              </Link>

              {/* Resources accordion */}
              <button
                type="button"
                className={`nav-mrow${mobileSection === "resources" ? " is-open" : ""}`}
                aria-expanded={mobileSection === "resources"}
                onClick={() =>
                  setMobileSection((m) =>
                    m === "resources" ? null : "resources",
                  )
                }
              >
                <span className="nav-mrow-icon">
                  <BookOpen size={18} />
                </span>
                <span className="nav-mrow-label">Resources</span>
                <ChevronDown size={18} className="nav-mrow-chev" />
              </button>
              <div
                className={`nav-acc${mobileSection === "resources" ? " is-open" : ""}`}
              >
                <div className="nav-acc-inner">
                  {MENU_RESOURCES.map(({ icon: Icon, title, sub, to }) => (
                    <Link key={to} to={to} className="nav-mega-item">
                      <span className="nav-mega-icon">
                        <Icon size={18} />
                      </span>
                      <span className="nav-mega-text">
                        <span className="nav-mega-title">{title}</span>
                        <span className="nav-mega-sub">{sub}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <Link to="/contact" className="nav-mrow">
                <span className="nav-mrow-icon">
                  <Mail size={18} />
                </span>
                <span className="nav-mrow-label">Contact</span>
                <ArrowRight size={16} className="nav-mrow-arrow" />
              </Link>

              <div className="nav-mobile-cta">
                <button
                  onClick={register}
                  className="nav-btn-primary nav-mobile-signup"
                >
                  <span>Sign up free</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>
                <button onClick={login} className="nav-mobile-login">
                  I already have an account · Log in
                </button>
              </div>
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav className={`navbar${isAuthenticated ? " navbar--fixed" : ""}`}>
      <div className="nav-left">
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

        <div className={`nav-logo${isAuthenticated ? " nav-logo--app" : ""}`}>
          <Link to="/" className="logo-link">
            <img
              src="/images/logo-samvaadik.webp"
              alt="Samvaadik Logo"
              width="332"
              height="128"
              className="nav-logo-img"
            />
          </Link>
        </div>

        {isAuthenticated && (
          <div className="nav-page">
            <span className="nav-page-icon">
              <PageIcon size={18} />
            </span>
            <div className="nav-page-text">
              <h1 className="nav-page-title">{meta.title}</h1>
              <p className="nav-page-sub">{meta.sub}</p>
            </div>
          </div>
        )}
      </div>

      <div className="nav-right">
        {isAuthenticated && (
          <Link
            to="/pricing"
            className={`nav-credits${creditsLow ? " is-empty" : ""}${
              creditsPulsing ? " pulse" : ""
            }`}
            title="Assistant credits left — click to top up"
          >
            <SamvaadikAIMark size={22} />
            <span className="nav-credits-value">
              {creditsKnown
                ? credits.toLocaleString("en-IN")
                : creditsLoading
                  ? "…"
                  : "—"}
            </span>
            <span className="nav-credits-label">credits left</span>
          </Link>
        )}

        {isAuthenticated && <NotificationBell userId={userId} />}
      </div>
    </nav>
  );
};

export default NavBar;
