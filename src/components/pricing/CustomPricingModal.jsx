//src/components/CustomPricingModal.jsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { submitCustomPricingRequest } from "../../api/customPricing";
import { showError } from "../../utils/toast";

const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const emptyForm = {
  fullName: "",
  workEmail: "",
  companyName: "",
  phone: "",
  teamSize: "",
  message: "",
};

/**
 * "Contact Sales" dialog for the Custom pricing card — same portal /
 * escape-to-close / scroll-lock pattern as AddCreditModal, so both modals on
 * this page behave identically.
 */
const CustomPricingModal = ({ open, onClose, userId, userEmail, userName }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      ...emptyForm,
      fullName: userName || "",
      workEmail: userEmail || "",
    });
    setSubmitted(false);
  }, [open, userName, userEmail]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit =
    form.fullName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      await submitCustomPricingRequest({ userId, ...form });
      setSubmitted(true);
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          "Could not send your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Thanks, {form.fullName.split(" ")[0] || "there"}!
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              We've received your request and sent a confirmation to{" "}
              <span className="font-medium text-gray-700">
                {form.workEmail}
              </span>
              . Our team will reach out shortly to talk through pricing for your
              needs.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Let's talk pricing
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tell us about your team and we'll put together a plan that
                  fits.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mt-1 -mr-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={setField("fullName")}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Work email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.workEmail}
                    onChange={setField("workEmail")}
                    placeholder="jane@company.com"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={setField("companyName")}
                    placeholder="Acme Inc."
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField("phone")}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Team size
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, teamSize: size }))}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        form.teamSize === size
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-50 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  What are you looking to do?
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={setField("message")}
                  placeholder="Tell us about your volume, integrations you need, or anything else that'll help us scope this."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Sending..." : "Contact Sales"}
              </button>

              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                We'll email you a confirmation and get back to you at the work
                email above.
              </p>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default CustomPricingModal;
