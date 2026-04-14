import { useEffect, useState } from "react";

const useFacebookSDK = () => {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // If already loaded, just mark ready
    if (window.FB) {
      setSdkReady(true);
      return;
    }

    // Set up the init callback
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
      setSdkReady(true);
    };

    // Inject the SDK script
    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  return sdkReady;
};

export default useFacebookSDK;
