import { useEffect, useMemo, useState } from "react";
import { Sparkles, ShieldCheck, Zap, Bot } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";
import { createOrder, getPlans, verifyPayment } from "../api/payment";
import useAuthUser from "../hooks/useAuthUser";
import useSubscription from "../hooks/useSubscription";
import SEO from "../components/SEO";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const formatRupees = (amount) => {
  if (amount == null) return "Contact Sales";

  const value = Number(amount);
  if (Number.isNaN(value)) return "Contact Sales";

  // Support either paise (1400000) or rupees (14000) from backend records.
  const rupees = value >= 100000 ? value / 100 : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getRemainingDays = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { login, user } = useKindeAuth();
  const { userId } = useAuthUser();
  const {
    active,
    loading: subLoading,
    expiresAt,
    plan: activePlan,
    refresh,
  } = useSubscription(userId, { enabled: Boolean(userId) });

  const username = user?.email ? user.email.split("@")[0] : "";

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState(null);

  useEffect(() => {
    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const res = await getPlans();
        const payload = res?.data ?? [];
        setPlans(Array.isArray(payload) ? payload : []);
      } catch (err) {
        showError("Unable to load pricing plans right now.");
      } finally {
        setLoadingPlans(false);
      }
    };

    loadPlans();
  }, []);

  const sortedPlans = useMemo(() => {
    const normalizedPlans = plans
      .filter((plan) => plan?.is_active !== false)
      .map((plan) => ({
        ...plan,
        plan_id: plan.plan_id ?? plan.planId,
        displayName: plan.name ?? plan.plan_name ?? "Plan",
        durationMonths: plan.duration_months ?? plan.durationMonths ?? 12,
        features: plan.features ?? {},
      }));

    return normalizedPlans.sort((a, b) => Number(a.price) - Number(b.price));
  }, [plans]);

  const remainingDays = useMemo(() => getRemainingDays(expiresAt), [expiresAt]);

  const handlePayment = async (plan) => {
    if (!userId) {
      login();
      return;
    }

    if (active) {
      showError("You already have an active subscription.");
      return;
    }

    if (!window.Razorpay) {
      showError(
        "Razorpay checkout is not loaded. Please refresh and try again.",
      );
      return;
    }

    const toastId = showLoading("Opening secure checkout...");
    setPayingPlanId(plan.plan_id);

    try {
      const { data } = await createOrder(plan.plan_id, userId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: data.amount,
        currency: "INR",
        order_id: data.id,
        name: "Samvaadik",
        description: `${plan.displayName} Subscription`,
        prefill: {
          email: user?.email ?? "",
          name: username ?? "",
        },
        handler: async (response) => {
          await verifyPayment(response);
          await refresh();
          showSuccess("Payment successful. Subscription activated.");
          navigate("/");
        },
        modal: {
          ondismiss: () => {
            dismissToast(toastId);
          },
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showError("Payment failed to initialize. Please try again.");
    } finally {
      dismissToast(toastId);
      setPayingPlanId(null);
    }
  };

  return (
    <>
    <SEO
  title="Pricing - Samvaadik WhatsApp Marketing Platform"
  description="Explore Samvaadik pricing plans for WhatsApp marketing, campaign automation, analytics, and business messaging."
  keywords="WhatsApp marketing pricing, WhatsApp API pricing, Samvaadik plans"
  url="https://samvaadik.com/pricing"
/>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
            <Sparkles className="w-4 h-4" />
            Samvaadik Subscriptions
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4">
            Scale WhatsApp Campaigns With Confidence
          </h1>
          <p className="text-gray-600 text-lg mt-3 max-w-3xl mx-auto">
            Start with Basic today and unlock upcoming AI-powered automation in
            Pro soon.
          </p>
        </div>

        {!subLoading && active && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-emerald-800 font-semibold">
                Your subscription is active
                {activePlan?.name ? `: ${activePlan.name}` : "."}
              </p>
              {expiresAt && (
                <p className="text-emerald-700 text-sm">
                  Valid till {formatDate(expiresAt)}
                  {typeof remainingDays === "number"
                    ? ` (${remainingDays} day${remainingDays !== 1 ? "s" : ""} left)`
                    : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {loadingPlans ? (
          <div className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur px-6 py-12 text-center">
            <div className="inline-block w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading plans...</p>
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
            <p className="text-amber-800 font-medium">
              No plans are configured yet. Please contact support.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedPlans.map((plan, idx) => {
              const planName = (plan.displayName || "").toLowerCase();
              const isPro = planName.includes("pro");
              const features = plan.features || {};
              const hasAiAutoReply = Boolean(features.ai_auto_reply);
              const isCurrentPlan =
                active &&
                activePlan?.plan_id &&
                activePlan.plan_id === plan.plan_id;

              return (
                <div
                  key={plan.plan_id}
                  className={`rounded-3xl p-7 border shadow-sm bg-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    idx === 0
                      ? "border-blue-200"
                      : "border-amber-200 bg-gradient-to-br from-white to-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {plan.displayName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isCurrentPlan
                          ? "bg-emerald-100 text-emerald-700"
                          : isPro
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isCurrentPlan ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : isPro ? (
                        <Bot className="w-3.5 h-3.5" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      {isCurrentPlan
                        ? "Current Plan"
                        : isPro
                          ? "Advanced"
                          : "Available Now"}
                    </span>
                  </div>

                  <p className="text-4xl font-extrabold text-gray-900 mb-1">
                    {formatRupees(plan.price)}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    per {plan.durationMonths} month
                    {plan.durationMonths > 1 ? "s" : ""}
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="text-gray-700">
                      {features.campaigns
                        ? "Campaigns enabled"
                        : "Campaigns not included"}
                    </li>
                    <li className="text-gray-700">
                      {features.manual_chat
                        ? "Manual WhatsApp chat included"
                        : "Manual WhatsApp chat not included"}
                    </li>
                    <li
                      className={`flex items-center gap-2 ${
                        hasAiAutoReply ? "text-gray-700" : "text-gray-500"
                      }`}
                    >
                      <Bot
                        className={`w-4 h-4 ${
                          hasAiAutoReply ? "text-indigo-600" : "text-gray-400"
                        }`}
                      />
                      AI auto reply{" "}
                      {hasAiAutoReply ? "included" : "not included"}
                    </li>
                  </ul>

                  <button
                    type="button"
                    disabled={active || payingPlanId === plan.plan_id}
                    onClick={() => handlePayment(plan)}
                    className={`w-full rounded-xl px-5 py-3 font-semibold text-sm transition-all ${
                      active
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.01]"
                    }`}
                  >
                    {active
                      ? isCurrentPlan
                        ? "Active Subscription"
                        : "Subscription Already Active"
                      : payingPlanId === plan.plan_id
                        ? "Processing..."
                        : "Subscribe Now"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    </>
  );
};

export default PricingPage;
