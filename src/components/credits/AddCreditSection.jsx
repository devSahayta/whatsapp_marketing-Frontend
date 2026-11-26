//src/components/credits/AddCreditSection.jsx

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import {
  createCreditOrder,
  getCreditPricing,
  purchaseWithSavedMethod,
  verifyCreditPurchase,
} from "../../api/credits";
import { listPaymentMethods } from "../../api/payment";
import { loadRazorpay } from "../../utils/razorpay";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../../utils/toast";
import AddCreditModal from "./AddCreditModal";

const ASSISTANT_HIGHLIGHTS = [
  "Creates campaigns just by chatting",
  "Builds WhatsApp templates for you",
  "Automates the busywork, end to end",
  "1000 free credits on your first subscription",
];

/**
 * Credit balance + a "Buy Credits" button that opens AddCreditModal, which
 * houses the actual package/custom-amount picker and hands off to Razorpay.
 *
 * If the user has a default saved card (see PaymentDetailsSection on the
 * pricing page), the modal also offers a one-click "pay with saved card"
 * path that skips the Razorpay popup/OTP entirely.
 */
const AddCreditSection = ({
  userId,
  userEmail,
  userName,
  credits,
  creditsLoading,
  onPurchased,
  onRequireLogin,
}) => {
  const [pricing, setPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [buyingKey, setBuyingKey] = useState(null); // packageId or "custom"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedMethod, setSavedMethod] = useState(null);

  useEffect(() => {
    const loadPricing = async () => {
      setLoadingPricing(true);
      try {
        const { data } = await getCreditPricing();
        setPricing(data);
      } catch (err) {
        showError("Unable to load credit pricing right now.");
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricing();
  }, []);

  // Look up whether the user has a default saved card, so the modal can
  // offer one-click purchase. Silently falls back to "no saved card" on
  // any error — the normal Razorpay checkout always still works.
  useEffect(() => {
    if (!userId) {
      setSavedMethod(null);
      return;
    }

    let active = true;

    listPaymentMethods(userId)
      .then(({ data }) => {
        if (!active) return;
        const methods = Array.isArray(data) ? data : data?.methods || [];
        const defaultMethod = methods.find(
          (m) => m.is_default && m.status === "active",
        );
        setSavedMethod(defaultMethod || null);
      })
      .catch(() => {
        if (active) setSavedMethod(null);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const runCheckout = async ({ credits: creditsAmount, packageId, key }) => {
    if (!userId) {
      showError("Please log in to buy credits.");
      return;
    }

    if (!(await loadRazorpay())) {
      showError(
        "Razorpay checkout is not loaded. Please refresh and try again.",
      );
      return;
    }

    const toastId = showLoading("Opening secure checkout...");
    setBuyingKey(key);

    try {
      const { data } = await createCreditOrder({
        userId,
        credits: creditsAmount,
        packageId,
      });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: data.amount,
        currency: "INR",
        order_id: data.id,
        name: "Samvaadik",
        description: `${data.credits} AI credits`,
        prefill: {
          email: userEmail ?? "",
          name: userName ?? "",
        },
        handler: async (response) => {
          try {
            await verifyCreditPurchase(response);
            showSuccess(`${data.credits} credits added to your account!`);
            onPurchased?.();
          } catch (err) {
            showError(
              "Payment went through, but we couldn't confirm it automatically. Please contact support.",
            );
          }
        },
        modal: {
          ondismiss: () => dismissToast(toastId),
        },
        theme: {
          color: "#059669",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Could not start checkout. Please try again.",
      );
    } finally {
      dismissToast(toastId);
      setBuyingKey(null);
    }
  };

  // One-click path: charges the saved card directly, no Razorpay popup.
  const runSavedCheckout = async ({
    credits: creditsAmount,
    packageId,
    key,
  }) => {
    if (!userId) {
      showError("Please log in to buy credits.");
      return;
    }

    const toastId = showLoading("Charging your saved card...");
    setBuyingKey(key);

    try {
      await purchaseWithSavedMethod({
        userId,
        credits: creditsAmount,
        packageId,
      });
      showSuccess("Credits added using your saved card!");
      onPurchased?.();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Could not charge your saved card. Please try again.",
      );
    } finally {
      dismissToast(toastId);
      setBuyingKey(null);
    }
  };

  const handleBuyPackage = (pkg) =>
    runCheckout({ packageId: pkg.id, key: pkg.id });

  const handleBuyCustom = (n) => runCheckout({ credits: n, key: "custom" });

  const handleBuySavedPackage = (pkg) =>
    runSavedCheckout({ packageId: pkg.id, key: pkg.id });

  const handleBuySavedCustom = (n) =>
    runSavedCheckout({ credits: n, key: "custom" });

  const handleAddCreditsClick = () => {
    if (!userId) {
      onRequireLogin?.();
      return;
    }
    setIsModalOpen(true);
  };

  return (
    // Same card shape/rhythm as the subscription plan cards (badge → blurb →
    // headline number → divider → checklist → button pinned to the bottom),
    // just with a tinted "special" background, so it reads as one more card
    // in the same row rather than a mismatched section underneath them.
    <div className="relative flex w-full flex-col rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 shadow-sm ring-1 ring-emerald-100 sm:w-[340px] sm:p-8">
      <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
        <Sparkles className="h-3.5 w-3.5" />
        Samvaadik AI
      </span>

      <p className="mb-6 min-h-[72px] text-sm text-gray-600 leading-relaxed">
        An agentic assistant that works alongside your plan — just chat with it
        and it creates campaigns, builds WhatsApp templates and handles the
        busywork automatically.
      </p>

      {userId ? (
        <>
          <p className="mb-1 text-4xl font-extrabold text-gray-900">
            {creditsLoading
              ? "…"
              : Number(credits ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mb-6 text-sm text-gray-500">
            credits available{" "}
            <span className="text-xs text-gray-400">(1 credit = ₹1)</span>
          </p>
        </>
      ) : (
        <>
          <p className="mb-1 text-4xl font-extrabold text-gray-900">
            Pay As You Go
          </p>
          <p className="mb-6 text-sm text-gray-500">
            <span className="font-medium text-gray-600">
              Log in to see your balance
            </span>{" "}
            <span className="text-xs text-gray-400">(1 credit = ₹1)</span>
          </p>
        </>
      )}

      <div className="mb-6 border-t border-emerald-200/70" />

      <ul className="mb-8 flex-1 space-y-3">
        {ASSISTANT_HIGHLIGHTS.map((label) => (
          <li key={label} className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {label}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={userId && (loadingPricing || !pricing)}
        onClick={handleAddCreditsClick}
        className="mt-auto w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 hover:shadow-lg disabled:opacity-50 transition-all"
      >
        {userId ? "Buy Credits" : "Log In to Buy Credits"}
      </button>

      <AddCreditModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pricing={pricing}
        loadingPricing={loadingPricing}
        credits={credits}
        buyingKey={buyingKey}
        onBuyPackage={handleBuyPackage}
        onBuyCustom={handleBuyCustom}
        savedMethod={savedMethod}
        onBuySavedPackage={handleBuySavedPackage}
        onBuySavedCustom={handleBuySavedCustom}
      />
    </div>
  );
};

export default AddCreditSection;
