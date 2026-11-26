import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Gift,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";
import {
  createOrder,
  getPlans,
  verifyPayment,
  listPaymentMethods,
  subscribeWithSavedMethod,
} from "../api/payment";
import useAuthUser from "../hooks/useAuthUser";
import useSubscription from "../hooks/useSubscription";
import { useUserCredits } from "../hooks/useUserCredits";
import AddCreditSection from "../components/credits/AddCreditSection";
import CustomPricingModal from "../components/pricing/CustomPricingModal";
import BillingHistorySection from "../components/billing/BillingHistorySection";
import PaymentDetailsSection from "../components/billing/PaymentDetailsSection";
import AutoReloadSection from "../components/billing/AutoReloadSection";
import SEO from "../components/SEO";
import { loadRazorpay } from "../utils/razorpay";
import { withGst } from "../utils/gst";
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

const getPlanDescription = (isPro) =>
  isPro
    ? "Built for teams ready to scale — AI auto-replies handle customers instantly while your campaigns, templates and chat all run from one dashboard."
    : "Everything you need to launch WhatsApp campaigns, chat with customers and track results — hands-on, with you in control of every reply.";

// Common value every active subscription gets, independent of the
// plan-level feature flags below — kept out of the flags so it isn't
// repeated as a "maybe" bullet on every tier.
const SHARED_PLAN_BENEFITS = [
  "Ready-made templates & campaign scheduling",
  "Real-time delivery & engagement analytics",
];

const FREE_CREDITS_LINE =
  "1000 free Samvaadik AI Assistant credits (first subscription)";

const CUSTOM_PLAN_BENEFITS = [
  "Volume-based WhatsApp messaging rates",
  "Dedicated onboarding & priority support",
  "Custom integrations (CRM, ERP & more)",
  "Tailored contract & billing terms",
];

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

  const {
    credits,
    loading: creditsLoading,
    refetchCredits,
  } = useUserCredits(userId, Boolean(userId));

  const username = user?.email ? user.email.split("@")[0] : "";

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [payingPlanId, setPayingPlanId] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [savedMethod, setSavedMethod] = useState(null);
  const [subscribingWithSaved, setSubscribingWithSaved] = useState(null); // plan_id or null

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
    // Fetch checkout in the background so "Pay" opens instantly.
    loadRazorpay();
  }, []);

  // Look up whether the user has a default saved card, so plan cards can
  // offer a one-click "pay with saved card" option instead of only the
  // Razorpay popup.
  useEffect(() => {
    if (!userId) {
      setSavedMethod(null);
      return undefined;
    }

    let active = true;

    listPaymentMethods(userId)
      .then(({ data }) => {
        if (!active) return;
        const methods = Array.isArray(data) ? data : data?.methods || [];
        setSavedMethod(
          methods.find((m) => m.is_default && m.status === "active") || null,
        );
      })
      .catch(() => {
        if (active) setSavedMethod(null);
      });

    return () => {
      active = false;
    };
  }, [userId]);

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

    if (!(await loadRazorpay())) {
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
          await refetchCredits(); // picks up the one-time free credit grant
          showSuccess("Payment successful. Subscription activated.");
          navigate("/");
        },
        modal: {
          ondismiss: () => {
            dismissToast(toastId);
          },
        },
        theme: {
          color: "#059669",
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

  // One-click: charges the saved card directly, no Razorpay popup. Works
  // even for a brand-new subscriber (no subscription row yet) or someone
  // resubscribing after a lapse.
  const handlePaySaved = async (plan) => {
    if (!userId) {
      login();
      return;
    }

    const toastId = showLoading("Charging your saved card...");
    setSubscribingWithSaved(plan.plan_id);

    try {
      await subscribeWithSavedMethod(userId, plan.plan_id);
      await refresh();
      await refetchCredits();
      showSuccess("Subscribed using your saved card!");
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Could not charge your saved card. Please try again.",
      );
    } finally {
      dismissToast(toastId);
      setSubscribingWithSaved(null);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-100/40 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold ring-1 ring-emerald-100">
              <Sparkles className="w-4 h-4" />
              Samvaadik Subscriptions
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4">
              Scale WhatsApp Campaigns With Confidence
            </h1>
            <p className="text-gray-600 text-lg mt-3 max-w-3xl mx-auto">
              Start with Basic today and unlock upcoming AI-powered automation
              in Pro soon.
            </p>
            <p className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <Gift className="w-4 h-4" />
              Get 1000 free Samvaadik AI credits with your first subscription
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
              <div className="inline-block w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading plans...</p>
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
              <p className="text-amber-800 font-medium">
                No plans are configured yet. Please contact support.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-emerald-600 mb-6">
                {active ? "Your Plan & AI Credits" : "Choose your plan"}
              </h2>
              {/* One shared row: every subscription plan, plus the AI Credits
                card, as equal-sized cards with the same badge → blurb →
                headline → checklist → button structure. */}
              <div className="flex flex-wrap justify-center items-stretch gap-6">
                {sortedPlans.map((plan, idx) => {
                  const planName = (plan.displayName || "").toLowerCase();
                  const isPro = planName.includes("pro");
                  const features = plan.features || {};
                  const basePlan = sortedPlans[0];
                  const baseFeatures = basePlan?.features || {};
                  const isCurrentPlan =
                    active &&
                    activePlan?.plan_id &&
                    activePlan.plan_id === plan.plan_id;

                  const ownFeatureBullets = [
                    features.campaigns &&
                      "Unlimited WhatsApp campaigns & broadcasts",
                    features.manual_chat &&
                      "Manual WhatsApp chat inbox for 1:1 replies",
                    features.ai_auto_reply &&
                      "AI auto-reply — responds to customers instantly, 24/7",
                  ].filter(Boolean);

                  // For every tier after the first, only call out what's new
                  // compared to the base plan — "Everything in Basic, plus"
                  // covers the rest, same convention most pricing pages use.
                  const isUpgrade = idx > 0 && basePlan;
                  const newBullets = isUpgrade
                    ? [
                        features.campaigns &&
                          !baseFeatures.campaigns &&
                          "Unlimited WhatsApp campaigns & broadcasts",
                        features.manual_chat &&
                          !baseFeatures.manual_chat &&
                          "Manual WhatsApp chat inbox for 1:1 replies",
                        features.ai_auto_reply &&
                          !baseFeatures.ai_auto_reply &&
                          "AI auto-reply — responds to customers instantly, 24/7",
                      ].filter(Boolean)
                    : [];

                  const checklist = isUpgrade
                    ? [
                        ...(newBullets.length ? newBullets : ownFeatureBullets),
                        FREE_CREDITS_LINE,
                      ]
                    : [
                        ...ownFeatureBullets,
                        ...SHARED_PLAN_BENEFITS,
                        FREE_CREDITS_LINE,
                      ];

                  return (
                    <div
                      key={plan.plan_id}
                      className="relative flex w-full sm:w-[340px] flex-col rounded-3xl border border-emerald-100 bg-white p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      {isCurrentPlan && (
                        <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          <ShieldCheck className="w-3 h-3" />
                          Current
                        </span>
                      )}

                      <span className="mb-4 inline-flex w-fit items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                        {plan.displayName}
                        {isPro ? " · Advanced" : ""}
                      </span>

                      <p className="mb-6 min-h-[72px] text-sm text-gray-500 leading-relaxed">
                        {getPlanDescription(isPro)}
                      </p>

                      <p className="mb-1 text-4xl font-extrabold text-gray-900">
                        {formatRupees(withGst(plan.price))}
                      </p>
                      <p className="mb-1 text-xs text-gray-400">
                        {formatRupees(plan.price)} + 18% GST
                      </p>
                      <p className="mb-6 text-sm text-gray-500">
                        per {plan.durationMonths} month
                        {plan.durationMonths > 1 ? "s" : ""}
                      </p>

                      <div className="mb-6 border-t border-gray-100" />

                      {isUpgrade && (
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Everything in {basePlan.displayName}, plus:
                        </p>
                      )}

                      <ul className="mb-8 flex-1 space-y-3">
                        {checklist.map((label) => (
                          <li
                            key={label}
                            className="flex items-center gap-2 text-gray-700"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                            {label}
                          </li>
                        ))}
                      </ul>

                      {!active && savedMethod ? (
                        <div className="mt-auto space-y-2">
                          <button
                            type="button"
                            disabled={subscribingWithSaved === plan.plan_id}
                            onClick={() => handlePaySaved(plan)}
                            className="w-full rounded-xl px-5 py-3 font-semibold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.01] disabled:opacity-50 transition-all"
                          >
                            {subscribingWithSaved === plan.plan_id
                              ? "Processing..."
                              : `Pay with saved ${savedMethod.card_network || "card"} ending ${savedMethod.card_last4 || "••••"}`}
                          </button>
                          <button
                            type="button"
                            disabled={payingPlanId === plan.plan_id}
                            onClick={() => handlePayment(plan)}
                            className="w-full rounded-xl px-5 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                          >
                            Pay with a different card instead
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={active || payingPlanId === plan.plan_id}
                          onClick={() => handlePayment(plan)}
                          className={`mt-auto w-full rounded-xl px-5 py-3 font-semibold text-sm transition-all ${
                            active
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.01]"
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
                      )}
                    </div>
                  );
                })}

                {/* Custom pricing — same card shape, "Let's Talk" instead
                  of a price, opens a contact form instead of checkout. */}
                <div className="relative flex w-full sm:w-[340px] flex-col rounded-3xl border border-gray-200 bg-gray-50/60 p-7 sm:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                    <Building2 className="w-3.5 h-3.5" />
                    Custom
                  </span>

                  <p className="mb-6 min-h-[72px] text-sm text-gray-500 leading-relaxed">
                    For teams with higher volume, specific integrations, or
                    compliance needs that a standard plan doesn't cover. We'll
                    scope a plan around what you actually need.
                  </p>

                  <p className="mb-1 text-4xl font-extrabold text-gray-900">
                    Let's Talk
                  </p>
                  <p className="mb-6 text-sm text-gray-500">
                    pricing based on your requirements
                  </p>

                  <div className="mb-6 border-t border-gray-200" />

                  <ul className="mb-8 flex-1 space-y-3">
                    {CUSTOM_PLAN_BENEFITS.map((label) => (
                      <li
                        key={label}
                        className="flex items-center gap-2 text-gray-700"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-gray-900" />
                        {label}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      userId ? setIsCustomModalOpen(true) : login()
                    }
                    className="mt-auto w-full rounded-xl bg-gray-900 px-5 py-3 font-semibold text-sm text-white hover:bg-gray-800 hover:shadow-lg transition-all"
                  >
                    Contact Sales
                  </button>
                </div>

                {/* Shown whether or not someone is logged in — logged-out
                  visitors still need to see what AI credits are and get a
                  login prompt, not a missing card (this page is also
                  statically prerendered for logged-out visitors/SEO). */}
                <AddCreditSection
                  userId={userId}
                  userEmail={user?.email}
                  userName={username}
                  credits={credits}
                  creditsLoading={creditsLoading}
                  onPurchased={refetchCredits}
                  onRequireLogin={login}
                />
              </div>

              <CustomPricingModal
                open={isCustomModalOpen}
                onClose={() => setIsCustomModalOpen(false)}
                userId={userId}
                userEmail={user?.email}
                userName={username}
              />
            </>
          )}

          {userId && (
            <>
              <div className="mt-10">
                <AutoReloadSection userId={userId} />
              </div>
              <div className="mt-10">
                <PaymentDetailsSection
                  userId={userId}
                  userName={username}
                  userEmail={user?.email}
                />
              </div>
              <div className="mt-10">
                <BillingHistorySection userId={userId} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PricingPage;
