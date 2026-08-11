import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import useFacebookSDK from "../hooks/useFacebookSDK";
import {
  showError,
  showLoading,
  dismissToast,
  showSuccess,
} from "../utils/toast";

const MetaSignupButton = ({ userId, onSuccess }) => {
  const sdkReady = useFacebookSDK();
  const [isConnecting, setIsConnecting] = useState(false);
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Populated by the postMessage listener below while the Meta popup is open;
  // read by the FB.login callback once the user finishes (ref survives across
  // the popup's postMessage events without forcing re-renders).
  const signupEventRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        if (data.type === "WA_EMBEDDED_SIGNUP") {
          console.log("Embedded signup event:", data.event, data.data);
          // e.g. data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' for coexistence
          signupEventRef.current = {
            event: data.event,
            wabaId: data.data?.waba_id,
            phoneNumberId: data.data?.phone_number_id,
          };
        }
      } catch (e) {
        // Non-JSON postMessage from another source — ignore.
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Separate async function — NOT passed directly to FB.login
  const sendCodeToBackend = async (code, signupEventData) => {
    const loadingToastId = showLoading("Connecting your WhatsApp account...");
    try {
      const res = await fetch(`${backendURL}/api/waccount/embedded-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          user_id: userId,
          signup_event: signupEventData?.event,
          waba_id: signupEventData?.wabaId,
          phone_number_id: signupEventData?.phoneNumberId,
        }),
      });

      const data = await res.json();
      dismissToast(loadingToastId);

      if (data.success) {
        showSuccess("WhatsApp account connected successfully!");
        onSuccess();
      } else {
        showError(data.message || "Failed to connect WhatsApp account.");
      }
    } catch (err) {
      dismissToast(loadingToastId);
      console.error("Embedded signup error:", err);
      showError("Something went wrong. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = () => {
    if (!sdkReady || !window.FB) {
      showError("Facebook SDK not ready. Please wait a moment and try again.");
      return;
    }

    setIsConnecting(true);

    // Callback must be a regular function, NOT async
    window.FB.login(
      function (response) {
        if (!response || response.status !== "connected") {
          setIsConnecting(false);
          return;
        }

        const code = response.authResponse?.code;

        if (!code) {
          showError("No code received from Meta. Please try again.");
          setIsConnecting(false);
          return;
        }

        // Call the async function separately, passing along whatever the
        // postMessage listener captured (e.g. coexistence vs full-migration).
        sendCodeToBackend(code, signupEventRef.current);
        signupEventRef.current = null;
      },
      {
        config_id: import.meta.env.VITE_META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      },
    );
  };

  return (
    <button
      type="button"
      className="wa-meta-connect-btn"
      onClick={handleConnect}
      disabled={!sdkReady || isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 size={16} className="wa-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <img
            src="/images/meta.png"
            alt="Meta"
            style={{ width: 18, height: 18, objectFit: "contain" }}
          />
          <span>Connect with Meta</span>
        </>
      )}
    </button>
  );
};

export default MetaSignupButton;
