// pages/LandingPage.jsx
// "/" shows the public marketing page to visitors and the analytics
// dashboard to logged-in users. The dashboard (charts, animations) is
// code-split so it never slows down the public page.

import React, { lazy, Suspense } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import NotLoggedInLandingPage from "../components/landing/NotLoggedInLandingPage";
import SEO from "../components/SEO";

const HomeDashboard = lazy(() => import("./HomeDashboard"));

const LandingPage = () => {
  const { isAuthenticated } = useKindeAuth();

  if (!isAuthenticated) {
    return (
      <>
        <SEO
          title="Samvaadik - WhatsApp Business API Marketing & Automation Platform"
          description="Samvaadik - Transform your WhatsApp into a powerful business tool. Send bulk messages, manage campaigns, track analytics, and grow your business with WhatsApp marketing automation."
          keywords="WhatsApp Business, Bulk WhatsApp Messaging, WhatsApp Marketing, Campaign Manager, Business Messaging Tool, WhatsApp Automation, Marketing Automation"
          path="/"
        />
        <NotLoggedInLandingPage />
      </>
    );
  }

  return (
    <Suspense fallback={null}>
      <HomeDashboard />
    </Suspense>
  );
};

export default LandingPage;
