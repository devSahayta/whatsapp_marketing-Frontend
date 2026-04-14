// src/pages/ApiKeysPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Webhook,
  X,
  Activity,
  Clock,
  Zap,
} from "lucide-react";
import {
  createApiKey,
  deleteApiKey,
  getUsageLogs,
  listApiKeys,
  revokeApiKey,
  updateApiKey,
} from "../api/apiKeys";
import { fetchWhatsappAccount } from "../api/waccount";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const ALL_SCOPES = [
  {
    id: "send_template",
    label: "Send Template",
    desc: "Send WhatsApp templates",
  },
  {
    id: "send_message",
    label: "Send Message",
    desc: "Send free-form messages",
  },
  { id: "get_templates", label: "Get Templates", desc: "Fetch template list" },
  // { id: "upload_media", label: "Upload Media", desc: "Upload media files" },
  { id: "get_account", label: "Get Account", desc: "Read account info" },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const relativeTime = (iso) => {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ─── Copy Button ────────────────────────────────────────────────────────── */

function CopyButton({ text, className = "" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
        copied
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      } ${className}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <ClipboardCopy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ─── Scope Badge ────────────────────────────────────────────────────────── */

function ScopeBadge({ scope }) {
  const colors = {
    send_template: "bg-blue-50 text-blue-700 border-blue-100",
    send_message: "bg-violet-50 text-violet-700 border-violet-100",
    get_templates: "bg-amber-50 text-amber-700 border-amber-100",
    upload_media: "bg-pink-50 text-pink-700 border-pink-100",
    get_account: "bg-teal-50 text-teal-700 border-teal-100",
  };
  const label = ALL_SCOPES.find((s) => s.id === scope)?.label || scope;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        colors[scope] || "bg-slate-50 text-slate-700 border-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

/* ─── Key Revealed Banner ────────────────────────────────────────────────── */

function NewKeyBanner({ apiKey, onDismiss }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Copy your API key now — it will not be shown again
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            Store it somewhere safe. Once you close this notice, the full key is
            gone.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 break-all rounded-xl bg-white px-3 py-2 text-xs font-mono text-amber-900 border border-amber-200 shadow-sm">
              {visible ? apiKey : `${apiKey.slice(0, 24)}${"•".repeat(20)}`}
            </code>
            <div className="flex gap-2">
              <button
                onClick={() => setVisible((v) => !v)}
                className="rounded-lg bg-white border border-amber-200 px-2.5 py-2 text-amber-700 transition hover:bg-amber-100"
                title={visible ? "Hide" : "Reveal"}
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <CopyButton text={apiKey} />
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="rounded-lg p-1 text-amber-700 hover:bg-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── API Key Card ───────────────────────────────────────────────────────── */

function ApiKeyCard({ keyData, onRevoke, onDelete, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [webhookVal, setWebhookVal] = useState(keyData.webhook_url || "");
  const [nameVal, setNameVal] = useState(keyData.key_name || "");
  const [saving, setSaving] = useState(false);

  const isActive = keyData.is_active;

  const saveWebhook = async () => {
    setSaving(true);
    const tid = showLoading("Updating webhook…");
    try {
      const res = await updateApiKey(keyData.key_id, {
        webhook_url: webhookVal,
      });
      onUpdate(res.data.data);
      setEditingWebhook(false);
      dismissToast(tid);
      showSuccess("Webhook URL updated.");
    } catch (e) {
      dismissToast(tid);
      showError(e?.response?.data?.error || "Failed to update webhook.");
    } finally {
      setSaving(false);
    }
  };

  const saveName = async () => {
    setSaving(true);
    const tid = showLoading("Renaming key…");
    try {
      const res = await updateApiKey(keyData.key_id, { key_name: nameVal });
      onUpdate(res.data.data);
      setEditingName(false);
      dismissToast(tid);
      showSuccess("Key name updated.");
    } catch (e) {
      dismissToast(tid);
      showError(e?.response?.data?.error || "Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      className={`rounded-2xl border bg-white shadow-sm transition-all ${
        isActive ? "border-slate-200" : "border-red-200 opacity-75"
      }`}
    >
      {/* Card header */}
      <div className="flex items-start gap-4 p-5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isActive ? "bg-indigo-100" : "bg-red-100"
          }`}
        >
          <Key
            className={`h-5 w-5 ${isActive ? "text-indigo-600" : "text-red-500"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                autoFocus
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNameVal(keyData.key_name);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3
                className="truncate text-base font-semibold text-slate-900 cursor-pointer hover:text-indigo-600"
                onClick={() => setEditingName(true)}
                title="Click to rename"
              >
                {keyData.key_name}
              </h3>
              <span
                className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isActive ? "Active" : "Revoked"}
              </span>
            </div>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="font-mono">{keyData.key_prefix}…</span>
            <CopyButton text={keyData.key_prefix + "…"} className="py-0.5" />
            {keyData.last_used_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Used {relativeTime(keyData.last_used_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">Created</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {formatDate(keyData.created_at)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">Last used</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {formatDate(keyData.last_used_at)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs text-slate-500">Expires</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {keyData.expires_at ? formatDate(keyData.expires_at) : "Never"}
              </p>
            </div>
          </div>

          {/* Scopes */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
              Scopes
            </p>
            <div className="flex flex-wrap gap-2">
              {(keyData.scopes || []).map((s) => (
                <ScopeBadge key={s} scope={s} />
              ))}
            </div>
          </div>

          {/* Webhook URL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Webhook className="h-3.5 w-3.5" /> Webhook URL
              </p>
              {!editingWebhook && (
                <button
                  onClick={() => setEditingWebhook(true)}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {editingWebhook ? (
              <div className="flex gap-2">
                <input
                  value={webhookVal}
                  onChange={(e) => setWebhookVal(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={saveWebhook}
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingWebhook(false);
                    setWebhookVal(keyData.webhook_url || "");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 gap-2">
                <span className="text-sm text-slate-700 truncate font-mono">
                  {keyData.webhook_url || (
                    <span className="italic text-slate-400">
                      No webhook set
                    </span>
                  )}
                </span>
                {keyData.webhook_url && (
                  <CopyButton text={keyData.webhook_url} />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {isActive && (
              <button
                onClick={() => onRevoke(keyData.key_id)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
              >
                <ToggleLeft className="h-4 w-4" />
                Revoke
              </button>
            )}
            <button
              onClick={() => onDelete(keyData.key_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete permanently
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ─── Create Key Modal ───────────────────────────────────────────────────── */

function CreateKeyModal({ accountId, onClose, onCreated }) {
  const [keyName, setKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedScopes, setSelectedScopes] = useState(
    ALL_SCOPES.map((s) => s.id),
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleScope = (id) => {
    setSelectedScopes((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return showError("Key name is required.");
    if (selectedScopes.length === 0)
      return showError("Select at least one scope.");

    setSubmitting(true);
    const tid = showLoading("Creating API key…");
    try {
      const res = await createApiKey({
        key_name: keyName.trim(),
        account_id: accountId,
        scopes: selectedScopes,
        webhook_url: webhookUrl.trim() || null,
      });
      dismissToast(tid);
      showSuccess("API key created successfully!");
      onCreated(res.data.data);
    } catch (e) {
      dismissToast(tid);
      showError(e?.response?.data?.error || "Failed to create API key.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Scroll container — centres dialog and lets it grow past viewport */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Dialog */}
        <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-100 bg-white px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Key className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Create API Key
                </h2>
                <p className="text-xs text-slate-500">
                  Configure access and permissions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Key name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Key Name <span className="text-red-500">*</span>
              </label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production Server, Make.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Webhook URL{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  type="url"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Incoming WhatsApp messages will be forwarded to this URL.
              </p>
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Permissions <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {ALL_SCOPES.map((scope) => {
                  const checked = selectedScopes.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                        checked
                          ? "border-indigo-200 bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleScope(scope.id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                          {scope.label}
                        </p>
                        <p className="text-xs text-slate-500">{scope.desc}</p>
                      </div>
                      {checked && (
                        <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {submitting ? "Creating…" : "Create Key"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* end scroll container */}
    </div>
  );
}

/* ─── Usage Logs Panel ───────────────────────────────────────────────────── */

function UsageLogsPanel({ keyId, keyName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const load = useCallback(
    async (off = 0) => {
      setLoading(true);
      try {
        const res = await getUsageLogs({
          key_id: keyId,
          limit: LIMIT,
          offset: off,
        });
        setLogs(res.data.data || []);
        setOffset(off);
      } catch {
        showError("Failed to load usage logs.");
      } finally {
        setLoading(false);
      }
    },
    [keyId],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  const statusColor = (code) => {
    if (!code) return "text-slate-500";
    if (code < 300) return "text-emerald-600";
    if (code < 500) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            {keyName ? `Logs — ${keyName}` : "All Usage Logs"}
          </h3>
        </div>
        <button
          onClick={() => load(0)}
          disabled={loading}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Zap className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            No usage logs yet
          </p>
          <p className="text-xs text-slate-400">
            API calls will appear here once the key is used.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Endpoint</th>
                  <th className="px-5 py-3 text-left">Method</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-700 max-w-xs truncate">
                      {log.endpoint || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {log.method || "—"}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 font-semibold ${statusColor(log.status_code)}`}
                    >
                      {log.status_code || "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <button
              onClick={() => load(Math.max(0, offset - LIMIT))}
              disabled={offset === 0 || loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Showing {offset + 1}–{offset + logs.length}
            </span>
            <button
              onClick={() => load(offset + LIMIT)}
              disabled={logs.length < LIMIT || loading}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Delete Confirm Dialog ──────────────────────────────────────────────── */

function DeleteConfirmDialog({ keyName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="mt-4 text-center text-lg font-semibold text-slate-900">
          Delete API Key
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold text-slate-900">"{keyName}"</span>?
          This action cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function ApiKeysPage() {
  const { user } = useKindeAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [accountPhone, setAccountPhone] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null); // banner after creation
  const [deleteTarget, setDeleteTarget] = useState(null); // { key_id, key_name }
  const [activeLogsKeyId, setActiveLogsKeyId] = useState(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  /* Load account first */
  useEffect(() => {
    if (!user?.id) return;
    fetchWhatsappAccount(user.id)
      .then((res) => {
        const acc = res?.data?.data;
        if (acc?.wa_id) {
          setAccountId(acc.wa_id);
          setAccountPhone(acc.business_phone_number);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  /* Load keys once we have accountId */
  const loadKeys = useCallback(
    async ({ silent = false } = {}) => {
      if (!accountId) return;
      silent ? setRefreshing(true) : setLoading(true);
      try {
        const res = await listApiKeys(accountId);
        setKeys(res.data.data || []);
      } catch (e) {
        showError(e?.response?.data?.error || "Failed to load API keys.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreated = (newKey) => {
    setNewKeyData(newKey);
    setShowCreateModal(false);
    setKeys((prev) => [newKey, ...prev]);
  };

  const handleRevoke = async (keyId) => {
    const tid = showLoading("Revoking key…");
    try {
      await revokeApiKey(keyId);
      dismissToast(tid);
      showSuccess("API key revoked.");
      setKeys((prev) =>
        prev.map((k) => (k.key_id === keyId ? { ...k, is_active: false } : k)),
      );
    } catch (e) {
      dismissToast(tid);
      showError(e?.response?.data?.error || "Failed to revoke key.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const tid = showLoading("Deleting key…");
    try {
      await deleteApiKey(deleteTarget.key_id);
      dismissToast(tid);
      showSuccess("API key deleted.");
      setKeys((prev) => prev.filter((k) => k.key_id !== deleteTarget.key_id));
      if (activeLogsKeyId === deleteTarget.key_id) setActiveLogsKeyId(null);
    } catch (e) {
      dismissToast(tid);
      showError(e?.response?.data?.error || "Failed to delete key.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleUpdate = (updatedKey) => {
    setKeys((prev) =>
      prev.map((k) =>
        k.key_id === updatedKey.key_id ? { ...k, ...updatedKey } : k,
      ),
    );
  };

  const activeKeys = keys.filter((k) => k.is_active);
  const revokedKeys = keys.filter((k) => !k.is_active);

  /* ─── Loading Screen ───────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-3xl border border-gray-200 bg-white p-12 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="ml-3 text-sm font-medium text-slate-600">
            Loading API keys…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ── Page Header ── */}
        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
                Developer
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                API Keys
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Manage API keys that allow external apps to interact with your
                WhatsApp account.
                {accountPhone && (
                  <span className="ml-1 font-medium text-slate-800">
                    Account: {accountPhone}
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadKeys({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
              {accountId && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  New API Key
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">Total Keys</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">
                {keys.length}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-600">Active</p>
              <p className="mt-0.5 text-2xl font-bold text-emerald-700">
                {activeKeys.length}
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-3">
              <p className="text-xs text-red-500">Revoked</p>
              <p className="mt-0.5 text-2xl font-bold text-red-600">
                {revokedKeys.length}
              </p>
            </div>
          </div>
        </section>

        {/* No account warning */}
        {!accountId && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              No WhatsApp account found. Please connect your WhatsApp account
              first before creating API keys.
            </p>
          </div>
        )}

        {/* New key banner */}
        {newKeyData && (
          <NewKeyBanner
            apiKey={newKeyData.api_key}
            onDismiss={() => setNewKeyData(null)}
          />
        )}

        {/* ── API Key Info Card ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              <Shield className="h-4.5 w-4.5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                How API Keys work
              </h3>
              <ul className="mt-1.5 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>
                  Pass the key in the{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">
                    X-API-Key
                  </code>{" "}
                  header of every request.
                </li>
                <li>
                  Each key is scoped — only the permissions you select are
                  allowed.
                </li>
                <li>
                  Webhook URL receives incoming WhatsApp messages in real time.
                </li>
                <li>
                  The full key is shown only once on creation — copy it
                  immediately.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Active Keys ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Active Keys ({activeKeys.length})
            </h2>
          </div>

          {activeKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                <Key className="h-7 w-7 text-indigo-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">
                  No active API keys
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first key to start using the WhatsApp API.
                </p>
              </div>
              {accountId && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Create API Key
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map((k) => (
                <div key={k.key_id}>
                  <ApiKeyCard
                    keyData={k}
                    onRevoke={handleRevoke}
                    onDelete={(id) =>
                      setDeleteTarget({ key_id: id, key_name: k.key_name })
                    }
                    onUpdate={handleUpdate}
                  />
                  {/* Per-key logs toggle */}
                  <button
                    onClick={() =>
                      setActiveLogsKeyId((prev) =>
                        prev === k.key_id ? null : k.key_id,
                      )
                    }
                    className="mt-1 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    {activeLogsKeyId === k.key_id ? "Hide logs" : "View logs"}
                  </button>
                  {activeLogsKeyId === k.key_id && (
                    <div className="mt-2">
                      <UsageLogsPanel keyId={k.key_id} keyName={k.key_name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Revoked Keys ── */}
        {revokedKeys.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Revoked Keys ({revokedKeys.length})
            </h2>
            <div className="space-y-3">
              {revokedKeys.map((k) => (
                <ApiKeyCard
                  key={k.key_id}
                  keyData={k}
                  onRevoke={handleRevoke}
                  onDelete={(id) =>
                    setDeleteTarget({ key_id: id, key_name: k.key_name })
                  }
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── All Usage Logs ── */}
        {keys.length > 0 && (
          <section>
            <button
              onClick={() => setShowAllLogs((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 shadow-sm"
            >
              <Activity className="h-4 w-4" />
              {showAllLogs ? "Hide all usage logs" : "View all usage logs"}
              {showAllLogs ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showAllLogs && (
              <div className="mt-4">
                <UsageLogsPanel keyId={null} keyName={null} />
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateModal && accountId && (
        <CreateKeyModal
          accountId={accountId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          keyName={deleteTarget.key_name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
