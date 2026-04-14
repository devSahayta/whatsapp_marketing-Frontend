import React, { useState } from "react";
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

  // Separate async function — NOT passed directly to FB.login
  const sendCodeToBackend = async (code) => {
    const loadingToastId = showLoading("Connecting your WhatsApp account...");
    try {
      const res = await fetch(`${backendURL}/api/waccount/embedded-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, user_id: userId }),
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

        // Call the async function separately
        sendCodeToBackend(code);
      },
      {
        config_id: import.meta.env.VITE_META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
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
