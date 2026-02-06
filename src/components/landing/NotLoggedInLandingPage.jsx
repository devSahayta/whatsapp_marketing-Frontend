import React from "react";
import LandingHero from "./LandingHero";
import LandingProblemSolution from "./LandingProblemSolution";
import LandingWhySamvaadik from "./LandingWhySamvaadik";
import LandingCoreFeatures from "./LandingCoreFeatures";
import LandingCampaignAutomation from "./LandingCampaignAutomation";
import LandingAnalyticsPreview from "./LandingAnalyticsPreview";
import HowItWorksSection from "./HowItWorksSection";
import WhoIsSamvaadikForSection from "./WhoIsSamvaadikForSection";
import FinalCTASection from "./FinalCTASection";
import Footer from "./Footer";

const NotLoggedInLandingPage = () => {
  return (
    <div>
      <LandingHero />
      <LandingProblemSolution />
      <LandingWhySamvaadik />
      <LandingCoreFeatures />
      <LandingCampaignAutomation />
      <LandingAnalyticsPreview />
      <HowItWorksSection />
      <WhoIsSamvaadikForSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
};

export default NotLoggedInLandingPage;
