// src/components/ConnectWhatsappAssistant.jsx
//
// Lets the user link their own WhatsApp number(s) to their Samvaadik
// account, so they can use the Samvaadik AI Assistant (the same one in
// SamvaadikAssistant.jsx) by texting it directly instead of opening the
// dashboard. A user can link more than one number (e.g. a teammate's phone,
// or a backup) — each gets its own conversation thread server-side.
//
// Drop this into any settings/integrations page, e.g.:
//   import ConnectWhatsappAssistant from "../components/ConnectWhatsappAssistant";
//   ...
//   <ConnectWhatsappAssistant />

import { useEffect, useState } from "react";
import { MessageCircle, RefreshCw, Smartphone, Unlink } from "lucide-react";
import {
  listWaAssistantLinks,
  startWaAssistantLink,
  unlinkWaAssistantLink,
} from "../api/agents";
import { showError, showSuccess } from "../utils/toast";

const formatDateTime = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Light masking so a screenshot of this page doesn't leak a full number:
// "919876543210" -> "+91 98765 ••210"
const maskWaId = (waId) => {
  const digits = String(waId || "");
  if (digits.length < 6) return digits;
  const country = digits.slice(0, 2);
  const visibleStart = digits.slice(2, 7);
  const visibleEnd = digits.slice(-3);
  return `+${country} ${visibleStart} ••${visibleEnd}`;
};

const ConnectWhatsappAssistant = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState(null);
  const [pendingLink, setPendingLink] = useState(null); // { code, wa_me_link, expires_in_minutes }
  const [generating, setGenerating] = useState(false);
  // Samvaadik's assistant number (digits), shown so the code can be sent
  // manually when the wa.me button isn't available (e.g. on desktop)
  const [assistantNumber, setAssistantNumber] = useState(null);
  // null = checking, false = feature not available (card hidden), true = shown
  const [enabled, setEnabled] = useState(null);

  const loadLinks = async ({ silent = false } = {}) => {
    try {
      silent ? setRefreshing(true) : setLoading(true);
      const response = await listWaAssistantLinks();
      setEnabled(response?.data?.enabled !== false);
      setLinks(response?.data?.links || []);
      setAssistantNumber(response?.data?.assistant_number || null);
    } catch (error) {
      // On the first load, an error (e.g. backend without this feature yet)
      // just hides the card — clients should never see an error for it.
      if (!silent) {
        setEnabled(false);
        return;
      }
      showError(
        error?.response?.data?.error || "Failed to load linked WhatsApp numbers",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleGenerateLink = async () => {
    try {
      setGenerating(true);
      const response = await startWaAssistantLink();
      setPendingLink(response?.data || null);
    } catch (error) {
      showError(
        error?.response?.data?.error ||
          "Failed to start linking a WhatsApp number",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleUnlink = async (linkId) => {
    if (
      !window.confirm(
        "Unlink this WhatsApp number? It will no longer be able to use the Samvaadik AI Assistant.",
      )
    )
      return;

    try {
      setUnlinkingId(linkId);
      await unlinkWaAssistantLink(linkId);
      showSuccess("Number unlinked.");
      setLinks((prev) => prev.filter((l) => l.link_id !== linkId));
    } catch (error) {
      showError(error?.response?.data?.error || "Failed to unlink this number");
    } finally {
      setUnlinkingId(null);
    }
  };

  const activeLinks = links.filter((l) => l.status === "active");

  // Hidden until the backend confirms the feature is configured
  if (!enabled) return null;

  return (
    <article className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <MessageCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              WhatsApp Assistant
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Use the Samvaadik AI Assistant by texting it from your own
              WhatsApp number — no need to open the dashboard.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadLinks({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading linked numbers...
          </div>
        ) : activeLinks.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            No WhatsApp numbers linked yet.
          </div>
        ) : (
          activeLinks.map((link) => (
            <div
              key={link.link_id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {maskWaId(link.wa_id)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Linked {formatDateTime(link.linked_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(link.link_id)}
                disabled={unlinkingId === link.link_id}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Unlink className="h-3.5 w-3.5" />
                {unlinkingId === link.link_id ? "Unlinking..." : "Unlink"}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-5">
        {pendingLink ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-900">
              Open WhatsApp on the phone you want to link, then send this
              message to Samvaadik's assistant number
              {assistantNumber ? (
                <span className="font-semibold"> +{assistantNumber}</span>
              ) : null}
              . The code expires in {pendingLink.expires_in_minutes} minutes.
            </p>
            <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-sm text-emerald-900">
              LINK {pendingLink.code}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {pendingLink.wa_me_link ? (
                <a
                  href={pendingLink.wa_me_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open WhatsApp
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setPendingLink(null);
                  loadLinks({ silent: true });
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                I've sent it — refresh list
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerateLink}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Smartphone className="h-4 w-4" />
            {generating ? "Generating..." : "Link a WhatsApp number"}
          </button>
        )}
      </div>
    </article>
  );
};

export default ConnectWhatsappAssistant;
