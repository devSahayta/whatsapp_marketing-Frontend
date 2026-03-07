// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import NavBar from "./components/NavBar";
import Sidebar from "./components/Sidebar"; // sliding drawer

import CreateEvent from "./pages/CreateGroup";
import Dashboard from "./pages/GroupDashboard";
import LandingPage from "./pages/LandingPage";
import EventsPage from "./pages/GroupsPage";
import DocumentUpload from "./pages/DocumentUpload";
import DocumentViewer from "./components/DocumentViewer";
import ChatPage from "./pages/ChatPage";
import TemplateList from "./pages/TemplateList";
import CreateTemplate from "./pages/CreateTemplate";
import SendTemplate from "./pages/SendTemplate";
// import MediaList from "./pages/MediaList";
import WAccountPage from "./pages/WAccountPage";

import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { addUserToBackend } from "./api/userApi";

import "./styles/global.css";
import { fetchWhatsappAccount } from "./api/waccount";
import KnowledgeBases from "./pages/KnowledgeBases";
import CreateKnowledgeBase from "./pages/CreateKnowledgeBase";
import KnowledgeBaseDetail from "./pages/KnowledgeBaseDetail";
import { Toaster } from "react-hot-toast";
import FlightStatus from "./pages/FlightStatus";
import CreateCampaign from "./pages/CreateCampaign";
import Campaigns from "./pages/Campaigns";
import EditCampaign from "./pages/EditCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import ContactUs from "./pages/ContactUs";
import PricingPage from "./pages/PricingPage";
import SubscriptionExpired from "./pages/SubscriptionExpired";
import SubscriptionGuard from "./components/SubscriptionGuard";

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

function AppContent() {
  const { user, isAuthenticated, isLoading } = useKindeAuth();
  const location = useLocation();

  // Sidebar open/close state managed here
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Hide NavBar on document upload
  const hideNavBar = location.pathname.startsWith("/document-upload");

  // Sync user on first login
  useEffect(() => {
    if (isAuthenticated && user) {
      addUserToBackend(user);
    }
  }, [isAuthenticated, user]);

  // Close sidebar on route change (so X works predictably)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) return <p>Loading authentication...</p>;

  return (
    <div className="app-root root-background ">
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
      <main
        className={hideNavBar ? "content no-navbar" : "content with-navbar"}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />

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

          {/* <Route
            path="/templates/media"
            element={
              <PrivateRoute>
                <MediaList />
              </PrivateRoute>
            }
          /> */}

          <Route
            path="/document-upload/:participantId"
            element={<DocumentUpload />}
          />
          <Route
            path="/document-viewer/:participantId"
            element={<DocumentViewer />}
          />

          <Route
            path="/knowledge-bases"
            element={
              <PrivateSubscribedRoute>
                <KnowledgeBases />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/knowledge-bases/create"
            element={
              <PrivateSubscribedRoute>
                <CreateKnowledgeBase />
              </PrivateSubscribedRoute>
            }
          />
          <Route
            path="/knowledge-bases/:id"
            element={
              <PrivateSubscribedRoute>
                <KnowledgeBaseDetail />
              </PrivateSubscribedRoute>
            }
          />

          <Route
            path="/flight-status/:eventId"
            element={
              <PrivateSubscribedRoute>
                <FlightStatus />
              </PrivateSubscribedRoute>
            }
          />

          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/expired" element={<SubscriptionExpired />} />

          <Route path="/contact" element={<ContactUs />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
