// src/App.jsx
import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import NavBar from "./components/NavBar";
import Sidebar from "./components/Sidebar"; // sliding drawer

import LandingPage from "./pages/LandingPage";

// App screens (logged-in only) are code-split: public visitors and Google
// never download them, which keeps the marketing pages fast.
const CreateEvent = lazy(() => import("./pages/CreateGroup"));
const Dashboard = lazy(() => import("./pages/GroupDashboard"));
const EventsPage = lazy(() => import("./pages/GroupsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const TemplateList = lazy(() => import("./pages/TemplateList"));
const CreateTemplate = lazy(() => import("./pages/CreateTemplate"));
const CreateCarouselTemplate = lazy(() => import("./pages/CreateCarouselTemplate"));
const SendTemplate = lazy(() => import("./pages/SendTemplate"));
const WAccountPage = lazy(() => import("./pages/WAccountPage"));
const CreateCampaign = lazy(() => import("./pages/CreateCampaign"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const EditCampaign = lazy(() => import("./pages/EditCampaign"));
const CampaignDetails = lazy(() => import("./pages/CampaignDetails"));
const SubscriptionExpired = lazy(() => import("./pages/SubscriptionExpired"));
const Integrations = lazy(() => import("./pages/Integrations"));
const ChatbotFlows = lazy(() => import("./pages/ChatbotFlows"));
const ChatbotBuilder = lazy(() => import("./pages/ChatbotBuilder"));
const AgentsPage = lazy(() => import("./pages/AgentsPage"));
const CreateAgent = lazy(() => import("./pages/CreateAgent"));
const TestAgent = lazy(() => import("./pages/TestAgent"));
const WooCommercePage = lazy(() => import("./pages/WooCommercePage"));
const WooCommerceTemplateGuide = lazy(() => import("./pages/WooCommerceTemplateGuide"));
const ShopifyPage = lazy(() => import("./pages/ShopifyPage"));
const ApiKeysPage = lazy(() => import("./pages/ApiKeysPage"));
const SamvaadikAssistant = lazy(() => import("./components/SamvaadikAssistant"));

import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { addUserToBackend } from "./api/userApi";
import { setAuthToken } from "./api/apiClient";

import "./styles/global.css";
import { fetchWhatsappAccount } from "./api/waccount";
import { Toaster } from "react-hot-toast";
import ContactUs from "./pages/ContactUs";
import PricingPage from "./pages/PricingPage";
import SubscriptionGuard from "./components/SubscriptionGuard";
import AboutUs from "./pages/AboutUs";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundCancellationPolicy from "./pages/RefundCancellationPolicy";

import NotFound from "./pages/NotFound";
import MarketingPage from "./pages/MarketingPage";
import FeaturesHub from "./pages/FeaturesHub";
import { MARKETING_PAGES } from "./marketing/marketingPages";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import { BLOG_POSTS, BLOG_INDEX, blogPath } from "./blog/posts";
import {
  isPublicPath,
  isPrerenderVisible,
  removePrerender,
  setAuthHint,
} from "./seo/publicRoutes";

// useLayoutEffect in the browser, useEffect during the build-time pre-render.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Shown for a moment while a code-split app screen downloads.
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);

  return null;
}

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useKindeAuth();
  if (isLoading) return <p>Loading...</p>;
  return isAuthenticated ? children : <LandingPage />;
}

function PrivateSubscribedRoute({ children }) {
  return (
    <PrivateRoute>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </PrivateRoute>
  );
}

// ── Samvaadik AI — dev access only ──────────────────────────
// const AI_ALLOWED_USERS = [
//   "kp_35285dbc61994bbb8d6b01d869f50c42", // your user ID
//   "kp_c7f2725ff7a74158bb7eae3060d6f1de",
//   // add more IDs here when ready
// ];

function WhatsappAccountRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useKindeAuth();
  const [hasAccount, setHasAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const loadWhatsappAccount = async () => {
      try {
        const res = await fetchWhatsappAccount(user.id);

        // if account exists
        if (res?.data?.data?.wa_id) {
          setHasAccount(true);
        } else {
          setHasAccount(false);
        }
      } catch (err) {
        setHasAccount(false);
      } finally {
        setLoadingAccount(false);
      }
    };

    loadWhatsappAccount();
  }, [user?.id]);

  if (isLoading || loadingAccount) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return hasAccount ? children : <Navigate to="/whatsapp-account" replace />;
}

// Exported for build-time pre-rendering (src/entry-prerender.jsx).
export function AppContent() {
  const { user, isAuthenticated, isLoading, getToken } = useKindeAuth();
  const location = useLocation();

  // Sidebar open/close state managed here
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hide NavBar on document upload
  const hideNavBar = location.pathname.startsWith("/document-upload");

  // Sync user on first login and set auth token
  useEffect(() => {
    if (isAuthenticated && user) {
      addUserToBackend(user);
      getToken()
        .then((token) => {
          setAuthToken(token);
          // console.log("Kinde Bearer Token:", token);
        })
        .catch((err) => {
          console.error("getToken failed:", err);
        });
    }
  }, [isAuthenticated, user]);

  // Close sidebar on route change (so X works predictably)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Static pre-rendered HTML (see scripts/prerender.mjs) is shown until auth
  // resolves; captured once so it doesn't change mid-load.
  const [showingPrerender] = useState(isPrerenderVisible);

  // Remember on this browser whether the user is logged in, so index.html can
  // hide the pre-rendered marketing page for returning logged-in users.
  useEffect(() => {
    if (!isLoading) setAuthHint(isAuthenticated);
  }, [isLoading, isAuthenticated]);

  // Swap static HTML for the live app in the same frame (before paint).
  useIsomorphicLayoutEffect(() => {
    if (!isLoading) removePrerender();
  }, [isLoading]);

  if (isLoading) {
    return showingPrerender ? null : <p>Loading authentication...</p>;
  }

  return (
    <div className="app-root root-background ">
      {/* App screens are private: keep them out of search results. */}
      {!isPublicPath(location.pathname) && (
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
      )}
      {/* Navbar: pass toggle and state. NavBar itself decides whether hamburger is shown based on auth */}
      {!hideNavBar && (
        <NavBar
          onToggleSidebar={() => setIsSidebarOpen((s) => !s)}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      {/* Sidebar overlay/drawer - only when authenticated and not on landing/doc-upload */}
      {isAuthenticated && !hideNavBar && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      {/* Add conditional margin-top for authenticated users to prevent content from being hidden behind the fixed navbar. Also conditionally apply classes based on whether the navbar is hidden or not. */}
      <main
        // className={hideNavBar ? "content no-navbar" : "content with-navbar"}
        className={` ${isAuthenticated ? "mt-14" : ""} ${hideNavBar ? "content no-navbar" : "content with-navbar"}`}
      >
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateSubscribedRoute>
                <LandingPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <PrivateSubscribedRoute>
                <EventsPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/createGroup"
            element={
              <PrivateSubscribedRoute>
                <CreateEvent />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/dashboard/:eventId"
            element={
              <PrivateSubscribedRoute>
                <Dashboard />
              </PrivateSubscribedRoute>
            }
          />
          {/* <Route
            path="/call-batch/:eventId"
            element={
              <PrivateRoute>
                <CallBatchPage />
              </PrivateRoute>
            }
          /> */}
          <Route
            path="/chat"
            element={
              <PrivateSubscribedRoute>
                <ChatPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/whatsapp-account"
            element={
              <PrivateSubscribedRoute>
                <WAccountPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <PrivateSubscribedRoute>
                <Integrations />
              </PrivateSubscribedRoute>
            }
          />
          // Inside your routes:
          <Route
            path="/integrations/woocommerce"
            element={
              <PrivateSubscribedRoute>
                <WooCommercePage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/integrations/woocommerce/templates"
            element={
              <PrivateSubscribedRoute>
                <WooCommerceTemplateGuide />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/integrations/shopify"
            element={
              <PrivateSubscribedRoute>
                <ShopifyPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <PrivateSubscribedRoute>
                <WhatsappAccountRoute>
                  <TemplateList />
                </WhatsappAccountRoute>
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/template/create"
            element={
              <PrivateSubscribedRoute>
                <WhatsappAccountRoute>
                  <CreateTemplate />
                </WhatsappAccountRoute>
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/template/create-carousel"
            element={
              <PrivateSubscribedRoute>
                <WhatsappAccountRoute>
                  <CreateCarouselTemplate />
                </WhatsappAccountRoute>
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/templates/send/:templateId"
            element={
              <PrivateSubscribedRoute>
                <WhatsappAccountRoute>
                  <SendTemplate />
                </WhatsappAccountRoute>
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/campaigns/create"
            element={
              <PrivateSubscribedRoute>
                <CreateCampaign />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <PrivateSubscribedRoute>
                <Campaigns />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/campaigns/edit/:campaignId"
            element={
              <PrivateSubscribedRoute>
                <EditCampaign />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <PrivateSubscribedRoute>
                <CampaignDetails />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <PrivateSubscribedRoute>
                <ChatbotFlows />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/chatbot/builder/:flowId"
            element={
              <PrivateSubscribedRoute>
                <ChatbotBuilder />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/agents"
            element={
              <PrivateSubscribedRoute>
                <AgentsPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/agents/create"
            element={
              <PrivateSubscribedRoute>
                <CreateAgent />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/agents/:agent_id/edit"
            element={
              <PrivateSubscribedRoute>
                <CreateAgent />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/agents/:agent_id/test"
            element={
              <PrivateSubscribedRoute>
                <TestAgent />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/api-keys"
            element={
              <PrivateSubscribedRoute>
                <ApiKeysPage />
              </PrivateSubscribedRoute>
            }
          />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/expired" element={<SubscriptionExpired />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route
            path="/terms-and-conditions"
            element={<TermsAndConditions />}
          />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route
            path="/refund-cancellation-policy"
            element={<RefundCancellationPolicy />}
          />
          {/* Public SEO pages: features, integrations, use cases */}
          <Route path="/features" element={<FeaturesHub />} />
          {MARKETING_PAGES.map((p) => (
            <Route
              key={p.path}
              path={p.path}
              element={<MarketingPage path={p.path} />}
            />
          ))}
          {/* Blog (content in src/blog/posts.js) */}
          <Route path={BLOG_INDEX.path} element={<BlogIndex />} />
          {BLOG_POSTS.map((p) => (
            <Route
              key={p.slug}
              path={blogPath(p.slug)}
              element={<BlogPost slug={p.slug} />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>

        {isAuthenticated && (
          <Suspense fallback={null}>
            <SamvaadikAssistant userId={user?.id} />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* <Iridescence
        color={[0.5, 0.6, 0.8]}
        mouseReact
        amplitude={0.1}
        speed={1}
      /> */}
      {/* Global toaster */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
        }}
        // toastOptions={{
        //   duration: 3000,
        //   success: {
        //     style: {
        //       background: "#16a34a",
        //       color: "#fff",
        //     },
        //   },
        //   error: {
        //     style: {
        //       background: "#dc2626",
        //       color: "#fff",
        //     },
        //   },
        // }}
      />
      <AppContent />
    </Router>
  );
}
