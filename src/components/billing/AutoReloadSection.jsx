//src/components/billing/AutoReloadSection.jsx

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { getAutoPaySettings, updateAutoPaySettings } from "../../api/autoPay";
import { listPaymentMethods } from "../../api/payment";
import { showError, showSuccess } from "../../utils/toast";

const DEFAULT_THRESHOLD = 100;
const DEFAULT_RELOAD = 500;

/**
 * One switch, modeled on Claude Console's billing page: "Auto-reload is
 * off/on" + a single button. When on, it automatically tops up credits
 * (and, once that piece exists, renews the subscription) using the user's
 * default saved card — no separate toggle per feature.
 */
const AutoReloadSection = ({ userId }) => {
  const [settings, setSettings] = useState(null);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [reloadAmount, setReloadAmount] = useState(DEFAULT_RELOAD);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    // allSettled, not all — a failure on one call (e.g. autopay route not
    // mounted yet) must not wipe out a successful result from the other.
    Promise.allSettled([
      getAutoPaySettings(userId),
      listPaymentMethods(userId),
    ]).then(([settingsResult, methodsResult]) => {
      if (!active) return;

      if (settingsResult.status === "fulfilled") {
        const s = settingsResult.value.data;
        setSettings(s);
        setThreshold(s?.low_credit_threshold ?? DEFAULT_THRESHOLD);
        setReloadAmount(s?.reload_credits ?? DEFAULT_RELOAD);
      } else {
        console.error(
          "Could not load auto-reload settings:",
          settingsResult.reason,
        );
        setSettings({ enabled: false });
      }

      if (methodsResult.status === "fulfilled") {
        const data = methodsResult.value.data;
        const methods = Array.isArray(data) ? data : data?.methods || [];
        setHasSavedCard(
          methods.some((m) => m.is_default && m.status === "active"),
        );
      } else {
        console.error("Could not load payment methods:", methodsResult.reason);
        setHasSavedCard(false);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const openEditor = () => {
    if (!hasSavedCard) {
      showError("Add a default payment method before enabling auto-reload.");
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateAutoPaySettings(userId, {
        enabled: true,
        lowCreditThreshold: Number(threshold),
        reloadCredits: Number(reloadAmount),
      });
      setSettings(data);
      setIsEditing(false);
      showSuccess("Auto-reload is on.");
    } catch (err) {
      showError(
        err?.response?.data?.message || "Could not enable auto-reload.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      const { data } = await updateAutoPaySettings(userId, {
        enabled: false,
        lowCreditThreshold: threshold,
        reloadCredits: reloadAmount,
      });
      setSettings(data);
      showSuccess("Auto-reload is off.");
    } catch (err) {
      showError(
        err?.response?.data?.message || "Could not turn off auto-reload.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!userId || loading) return null;

  const isOn = Boolean(settings?.enabled);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            Auto-reload is {isOn ? "on" : "off"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {isOn ? (
              <>
                Tops up{" "}
                {Number(settings.reload_credits).toLocaleString("en-IN")}{" "}
                credits automatically whenever your balance drops below{" "}
                {Number(settings.low_credit_threshold).toLocaleString("en-IN")},
                using your saved card.
              </>
            ) : (
              "Automatically top up credits using your saved card when your balance runs low, so the AI Assistant never stops working."
            )}
          </p>
        </div>
      </div>

      {isOn ? (
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleDisable}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Turn off
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openEditor}
          className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
        >
          Set up auto-reload
        </button>
      )}

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          onClick={() => setIsEditing(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Auto-reload settings
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Charged automatically to your default saved card.
            </p>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              When balance drops below
            </label>
            <input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Add this many credits
            </label>
            <input
              type="number"
              min={1}
              value={reloadAmount}
              onChange={(e) => setReloadAmount(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoReloadSection;
