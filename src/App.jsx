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
import CallBatchPage from "./pages/CallBatchPage";
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
import useAuthUser from "./hooks/useAuthUser";
import KnowledgeBases from "./pages/KnowledgeBases";
import CreateKnowledgeBase from "./pages/CreateKnowledgeBase";
import KnowledgeBaseDetail from "./pages/KnowledgeBaseDetail";
import { Toaster } from "react-hot-toast";
import FlightStatus from "./pages/FlightStatus";
import CreateCampaign from "./pages/CreateCampaign";
import Campaigns from "./pages/Campaigns";
import EditCampaign from "./pages/EditCampaign";
import CampaignDetails from "./pages/CampaignDetails";
import Iridescence from "./components/Iridescence";

function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useKindeAuth();
  if (isLoading) return <p>Loading...</p>;
  return isAuthenticated ? children : <LandingPage />;
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

  // Don't render sidebar on landing page "/"
  const hideSidebarPath = location.pathname === "/";

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
              <PrivateRoute>
                <EventsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/createGroup"
            element={
              <PrivateRoute>
                <CreateEvent />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/:eventId"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
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
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            }
          />

          <Route path="/whatsapp-account" element={<WAccountPage />} />

          <Route
            path="/templates"
            element={
              <PrivateRoute>
                <WhatsappAccountRoute>
                  <TemplateList />
                </WhatsappAccountRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/template/create"
            element={
              <PrivateRoute>
                <WhatsappAccountRoute>
                  <CreateTemplate />
                </WhatsappAccountRoute>
              </PrivateRoute>
            }
          />

          <Route
            path="/templates/send/:templateId"
            element={
              <PrivateRoute>
                <WhatsappAccountRoute>
                  <SendTemplate />
                </WhatsappAccountRoute>
              </PrivateRoute>
            }
          />

          <Route path="/campaigns/create" element={<CreateCampaign />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route
            path="/campaigns/edit/:campaignId"
            element={<EditCampaign />}
          />

          <Route path="/campaigns/:id" element={<CampaignDetails />} />

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

          <Route path="/knowledge-bases" element={<KnowledgeBases />} />
          <Route
            path="/knowledge-bases/create"
            element={<CreateKnowledgeBase />}
          />
          <Route
            path="/knowledge-bases/:id"
            element={<KnowledgeBaseDetail />}
          />

          <Route path="/flight-status/:eventId" element={<FlightStatus />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
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
