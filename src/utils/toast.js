import toast from "react-hot-toast";

export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

export const showInfo = (message) => {
  toast(message);
};

export const showLoading = (message = "Loading...") => {
  return toast.loading(message, { duration: Infinity });
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Small, non-blocking nudge after the Samvaadik AI Assistant spends credits
// on a turn — short-lived and low-key, not a confirmation dialog. Styled to
// match the app's own emerald/teal card language (pricing, credits modal)
// instead of react-hot-toast's plain default black pill.
export const showCreditUsage = (creditsUsed, creditsRemaining) => {
  if (!creditsUsed) return;
  const remainingLabel =
    typeof creditsRemaining === "number"
      ? `${creditsRemaining.toLocaleString("en-IN")} credits left`
      : "";
  toast(
    `${creditsUsed} credit${creditsUsed === 1 ? "" : "s"} used${
      remainingLabel ? ` · ${remainingLabel}` : ""
    }`,
    {
      duration: 2500,
      icon: "⚡",
      style: {
        background: "#ffffff",
        color: "#065f46",
        border: "1px solid #a7f3d0",
        borderLeft: "4px solid #059669",
        borderRadius: "12px",
        padding: "10px 14px",
        fontSize: "13px",
        fontWeight: 600,
        boxShadow:
          "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.06)",
      },
      iconTheme: {
        primary: "#059669",
        secondary: "#ecfdf5",
      },
    },
  );
};
