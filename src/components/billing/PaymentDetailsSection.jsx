// src/components/billing/PaymentDetailsSection.jsx
// "Payment details" — saved cards used for invoices, credit purchases and
// auto-reload. Adding a card uses a refundable ₹1 Razorpay authorization
// purely to tokenize it; the user is never actually charged for this step.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Plus,
  Loader2,
  Star,
  Trash2,
  ShieldCheck,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import {
  createCardAuthOrder,
  verifyCardAuthorization,
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from "../../api/payment";
import { loadRazorpay } from "../../utils/razorpay";
import { showError, showSuccess } from "../../utils/toast";

const NETWORK_STYLES = {
  mastercard: "bg-gradient-to-r from-orange-500 to-red-500",
  visa: "bg-blue-600",
  amex: "bg-sky-700",
  rupay: "bg-emerald-600",
};

const networkStyle = (network) =>
  NETWORK_STYLES[(network || "").toLowerCase()] || "bg-gray-500";

export default function PaymentDetailsSection({
  userId,
  userName,
  userEmail,
  userContact,
}) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const menuRef = useRef(null);

  // Close the open row menu on any click outside it, or if the page scrolls
  // (the menu is positioned by viewport coordinates captured at open time,
  // so it won't follow a scroll — closing it is simpler than re-tracking).
  useEffect(() => {
    if (!menuOpenId) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    const onScroll = () => setMenuOpenId(null);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menuOpenId]);

  const toggleMenu = (paymentMethodId, e) => {
    if (menuOpenId === paymentMethodId) {
      setMenuOpenId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.right - 176, // 176px = menu width (w-44), right-aligned to the button
    });
    setMenuOpenId(paymentMethodId);
  };

  const fetchMethods = async () => {
    try {
      const res = await listPaymentMethods(userId);
      setMethods(res.data || []);
    } catch {
      showError("Couldn't load your saved payment methods.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleAddCard = async () => {
    setAdding(true);
    try {
      const ready = await loadRazorpay();
      if (!ready) {
        showError("Couldn't load the payment window. Please try again.");
        return;
      }

      const { data } = await createCardAuthOrder(userId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        customer_id: data.customerId,
        recurring: 1,
        name: "Samvaadik",
        description: "Save card for future payments (refunded instantly)",
        prefill: {
          name: userName || undefined,
          email: userEmail || undefined,
          // Card mandate/recurring registration needs a contact number to
          // run its authentication step — without one, Razorpay silently
          // declines the token request. `users` has no phone column yet,
          // so this falls back to a placeholder for now; once you collect
          // real phone numbers, pass the real one in via this prop.
          contact: userContact || "9999999999",
        },
        notes: data.order.notes,
        theme: { color: "#059669" },
        handler: async (response) => {
          try {
            await verifyCardAuthorization({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
            });
            showSuccess("Card saved successfully.");
            fetchMethods();
          } catch (err) {
            showError(
              err?.response?.data?.message ||
                "Couldn't save the card. Please try again.",
            );
          } finally {
            setAdding(false);
          }
        },
        modal: {
          ondismiss: () => setAdding(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        showError("Card verification failed. Please try again.");
        setAdding(false);
      });
      rzp.open();
    } catch (err) {
      showError(err?.response?.data?.message || "Couldn't start card setup.");
      setAdding(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    setBusyId(paymentMethodId);
    try {
      await setDefaultPaymentMethod(userId, paymentMethodId);
      await fetchMethods();
    } catch {
      showError("Couldn't update the default payment method.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (paymentMethodId) => {
    setBusyId(paymentMethodId);
    try {
      await deletePaymentMethod(userId, paymentMethodId);
      await fetchMethods();
    } catch {
      showError("Couldn't remove this payment method.");
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment details
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              The default payment method is charged for invoices, credit
              purchases, and auto-reload. If it's declined, auto-reload may
              charge another saved payment method.
            </p>
          </div>
        </div>
        <button
          onClick={handleAddCard}
          disabled={adding}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {adding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add payment method
        </button>
      </div>

      {loading ? (
        <div className="py-10 flex justify-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : methods.length === 0 ? (
        <div className="py-8 flex flex-col items-center text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60">
          <CreditCard className="w-7 h-7 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No payment method saved yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add one to enable invoices, credit purchases and auto-reload.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-4 font-medium align-middle">
                  Payment method
                </th>
                <th className="py-2 pr-4 font-medium align-middle">Issuer</th>
                <th className="py-2 pr-4 font-medium align-middle" />
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr
                  key={m.payment_method_id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-3 pr-4 align-middle h-14">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-5 rounded ${networkStyle(m.card_network)} shrink-0`}
                      />
                      <span className="text-gray-800 font-medium">
                        {m.card_network || "Card"} •••• {m.card_last4 || "----"}
                      </span>
                      {m.is_default && (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 align-middle h-14 text-gray-500">
                    {m.card_issuer || "—"}
                  </td>
                  <td className="py-3 pr-4 align-middle h-14">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => toggleMenu(m.payment_method_id, e)}
                        disabled={busyId === m.payment_method_id}
                        title="More options"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        {busyId === m.payment_method_id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MoreVertical className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {menuOpenId === m.payment_method_id &&
                        menuPosition &&
                        createPortal(
                          <div
                            ref={menuRef}
                            style={{
                              top: menuPosition.top,
                              left: menuPosition.left,
                            }}
                            className="fixed z-50 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
                          >
                            {!m.is_default && (
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  handleSetDefault(m.payment_method_id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                              >
                                <Star className="w-3.5 h-3.5" />
                                Make default
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                setConfirmTarget(m);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>,
                          document.body,
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400 mt-5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Card details are stored securely by Razorpay — Samvaadik never sees or
        stores your full card number.
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Remove this payment method?
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {confirmTarget.card_network || "Card"} ••••{" "}
              {confirmTarget.card_last4 || "----"}
              {confirmTarget.is_default
                ? " is your default payment method — another saved card will be made default automatically."
                : " will be removed from your account."}
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmTarget.payment_method_id)}
                disabled={busyId === confirmTarget.payment_method_id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {busyId === confirmTarget.payment_method_id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
