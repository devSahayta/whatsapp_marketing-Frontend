//src/components/credits/AddCreditModal.jsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Coins, Star, CreditCard } from "lucide-react";
import { withGst } from "../../utils/gst";

const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

// Short, one-line caption for each fixed package tile — purely cosmetic.
const PACKAGE_CAPTION = {
  starter: "Starting out",
  growth: "Regular use",
  pro: "Recommended",
  scale: "High volume",
  bulk: "Agencies",
};

/**
 * "Add credits" dialog — pick a package or a custom amount, see the exact
 * total, then hand off to Razorpay. Deliberately modeled on the familiar
 * "Add credits" pattern (preset amounts + Other + live total) rather than a
 * sprawling in-page grid.
 *
 * When `savedMethod` is present (the user has a default saved card), the
 * primary action becomes a one-click charge against that card instead of
 * opening the Razorpay popup; "Pay with a different card" falls back to the
 * normal Razorpay checkout flow.
 */
const AddCreditModal = ({
  open,
  onClose,
  pricing,
  loadingPricing,
  credits,
  buyingKey,
  onBuyPackage,
  onBuyCustom,
  savedMethod,
  onBuySavedPackage,
  onBuySavedCustom,
}) => {
  const [selectedId, setSelectedId] = useState(null); // package id or "custom"
  const [customValue, setCustomValue] = useState("");

  // Reset to a sensible default every time the modal opens.
  useEffect(() => {
    if (!open || !pricing) return;
    const popular = pricing.packages.find((p) => p.popular);
    setSelectedId(popular?.id ?? pricing.packages[0]?.id ?? "custom");
    setCustomValue("");
  }, [open, pricing]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const isCustom = selectedId === "custom";
  const selectedPackage = pricing?.packages.find((p) => p.id === selectedId);

  const customNum = Number(customValue);
  const customTouched = isCustom && customValue !== "";
  const customValid =
    isCustom &&
    pricing &&
    Number.isFinite(customNum) &&
    customNum >= pricing.minCustomCredits &&
    customNum <= pricing.maxCustomCredits;

  const activeCredits = isCustom
    ? customValid
      ? customNum
      : null
    : (selectedPackage?.credits ?? null);

  // Base (pre-GST) price, then the GST-inclusive total actually charged —
  // same math the backend applies when it creates the Razorpay order, so
  // what's shown here matches what Razorpay/the saved-card charge collects.
  const baseRupees =
    activeCredits != null && pricing
      ? activeCredits * pricing.pricePerCredit
      : null;
  const totalRupees = baseRupees != null ? withGst(baseRupees) : null;
  const gstRupees = baseRupees != null ? totalRupees - baseRupees : null;

  const isBuying = Boolean(buyingKey);
  const canBuy = activeCredits != null && !isBuying;
  const hasSavedMethod = Boolean(savedMethod);

  const handleBuyClick = () => {
    if (!canBuy) return;
    onClose();
    if (isCustom) onBuyCustom(activeCredits);
    else onBuyPackage(selectedPackage);
  };

  const handleBuySavedClick = () => {
    if (!canBuy) return;
    onClose();
    if (isCustom) onBuySavedCustom(activeCredits);
    else onBuySavedPackage(selectedPackage);
  };

  // Rendered via a portal straight into <body>, so the modal is always
  // positioned against the real viewport — immune to any parent element
  // elsewhere in the app that sets a CSS transform (which would otherwise
  // turn that parent into the containing block for "fixed" children and
  // make the modal drift with the page instead of staying centered).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold text-gray-900">Buy Credits</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors -mt-1 -mr-1 p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1 mb-1">
          Current balance:{" "}
          <span className="font-semibold text-gray-700">
            {Number(credits ?? 0).toLocaleString("en-IN")} credits
          </span>
        </p>
        <p className="text-xs text-gray-400 mb-5">1 credit = ₹1</p>

        {loadingPricing || !pricing ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading pricing...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {pricing.packages.map((pkg) => {
                const active = selectedId === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedId(pkg.id)}
                    className={`relative rounded-xl border px-3 py-2.5 text-left transition-all ${
                      active
                        ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 right-2 inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                        <Star className="w-2 h-2 fill-current" />
                        Top
                      </span>
                    )}
                    <p className="text-sm font-bold text-gray-900 leading-tight">
                      {pkg.credits.toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {PACKAGE_CAPTION[pkg.id] ?? pkg.label}
                    </p>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedId("custom")}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  isCustom
                    ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  Other
                </p>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Custom amount
                </p>
              </button>
            </div>

            {isCustom && (
              <div className="mt-4">
                <label
                  htmlFor="custom-credits-modal"
                  className="block text-xs font-medium text-gray-600 mb-1.5"
                >
                  Enter amount{" "}
                  <span className="text-gray-400 font-normal">
                    ({pricing.minCustomCredits.toLocaleString("en-IN")}–
                    {pricing.maxCustomCredits.toLocaleString("en-IN")} credits)
                  </span>
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="custom-credits-modal"
                    type="number"
                    autoFocus
                    min={pricing.minCustomCredits}
                    max={pricing.maxCustomCredits}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={`e.g. ${pricing.minCustomCredits}`}
                    className={`w-full rounded-xl border pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      customTouched && !customValid
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-300 focus:ring-emerald-500"
                    }`}
                  />
                </div>
                {customTouched && !customValid && (
                  <p className="text-xs text-red-500 mt-1.5">
                    Enter a value between {pricing.minCustomCredits} and{" "}
                    {pricing.maxCustomCredits.toLocaleString("en-IN")}.
                  </p>
                )}
              </div>
            )}

            {/* ── Price breakdown ─────────────────────────────────────── */}
            <div className="mt-5 rounded-xl border border-gray-200 divide-y divide-gray-100 text-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-500">Credits</span>
                <span className="font-medium text-gray-900">
                  {activeCredits != null
                    ? activeCredits.toLocaleString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {baseRupees != null ? formatINR(baseRupees) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-medium text-gray-900">
                  {gstRupees != null ? formatINR(gstRupees) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <span className="font-semibold text-gray-700">Total due</span>
                <span className="text-lg font-bold text-gray-900">
                  {totalRupees != null ? formatINR(totalRupees) : "—"}
                </span>
              </div>
            </div>

            {hasSavedMethod ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs text-gray-500">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                  Pay with your saved {savedMethod.card_network || "card"}{" "}
                  ending {savedMethod.card_last4 || "••••"}
                </div>
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={handleBuySavedClick}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:hover:shadow-none transition-all"
                >
                  {isBuying
                    ? "Processing..."
                    : `Pay ${totalRupees != null ? formatINR(totalRupees) : ""} now`}
                </button>
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={handleBuyClick}
                  className="w-full rounded-xl py-2 text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                >
                  Pay with a different card instead
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canBuy}
                onClick={handleBuyClick}
                className="w-full mt-4 rounded-xl py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-200 disabled:opacity-50 disabled:hover:shadow-none transition-all"
              >
                {isBuying ? "Processing..." : "Buy credits"}
              </button>
            )}

            <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
              Credits power the Samvaadik AI Assistant — used when it creates
              campaigns, builds templates and automates other actions for you.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default AddCreditModal;
