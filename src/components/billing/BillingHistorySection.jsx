// src/components/billing/BillingHistorySection.jsx

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Receipt,
  Search,
  Download,
  Loader2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Crown,
  Zap,
  Wallet,
  CalendarClock,
  ListChecks,
  MoreVertical,
  Activity,
  Sparkles,
} from "lucide-react";
import { getPaymentLogs, downloadInvoice } from "../../api/payment";
import { showError } from "../../utils/toast";
import { CREDITS_CHANGED_EVENT } from "../../hooks/useUserCredits";

// One large fetch covers virtually every real user's history in one round
// trip; if someone genuinely has more than this, we say so rather than
// silently truncating.
const FETCH_SIZE = 200;
const PAGE_SIZE = 8;

const STATUS_META = {
  paid: {
    label: "Paid",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    pill: "bg-red-50 text-red-700 ring-red-100",
  },
  pending: {
    label: "Processing",
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-100",
  },
};

const normalizeStatus = (status) => {
  const s = String(status || "").toLowerCase();
  if (["paid", "completed", "success", "captured", "active"].includes(s))
    return "paid";
  if (["failed", "error", "cancelled"].includes(s)) return "failed";
  return "pending";
};

// Support either paise or rupees from backend records, same convention
// PricingPage already uses for plan prices.
const toRupees = (amount) => {
  const value = Number(amount);
  if (Number.isNaN(value)) return 0;
  return value >= 100000 ? value / 100 : value;
};

const formatAmount = (amount) => {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toRupees(amount));
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Only "subscription" and "purchase" rows are real money-in events — the
// free subscription-bonus grant and AI usage deductions aren't invoices.
const isInvoiceRow = (log) =>
  log.category === "subscription" || log.category === "purchase";

// Every time the Samvaadik AI Assistant does something, deductCredits()
// writes one of these ("type: deduction") to the ledger — this is the
// usage log, already flowing through the same getPaymentLogs response.
const isUsageRow = (log) => log.category === "deduction";

// The backend tags each assistant ledger row (one row per AI step) with
//   " [[t=<turnId>;s=<step>;tools=a,b]]"
// We hide the tag, merge every row of the same chat turn into ONE line, and
// describe what the assistant did in plain words. No token counts are ever
// shown to users.
const USAGE_TAG = /\s*\[\[([^\]]*)\]\]\s*$/;

const TOOL_LABELS = {
  list_groups: "Looked up contact groups",
  list_templates: "Listed your templates",
  create_template: "Created a template",
  list_flows: "Listed chatbot flows",
  create_flow: "Created a chatbot flow",
  update_flow_status: "Updated a chatbot flow",
  rename_flow: "Renamed a chatbot flow",
  delete_flow: "Deleted a chatbot flow",
  create_agent: "Created an AI agent",
  create_campaign: "Created a campaign",
  list_google_sheets: "Listed Google Sheets",
  create_group_from_sheet: "Created a group from Google Sheets",
  find_contact: "Found a contact",
  send_text_message: "Sent a message",
  open_template_picker: "Prepared a template send",
};

// Tools that change something win the headline over read-only look-ups.
const ACTION_TOOLS = new Set([
  "create_template",
  "create_flow",
  "update_flow_status",
  "rename_flow",
  "delete_flow",
  "create_agent",
  "create_campaign",
  "create_group_from_sheet",
  "send_text_message",
  "open_template_picker",
]);

const toolLabel = (t) => TOOL_LABELS[t] || "Assistant action";

const usageTitle = (tools) => {
  const uniq = [...new Set(tools)];
  if (uniq.length === 0) return "Chat with Samvaadik AI";
  const actions = uniq.filter((t) => ACTION_TOOLS.has(t));
  const pick = actions.length ? actions : uniq;
  const first = pick.slice(0, 2).map(toolLabel).join(" and ");
  return pick.length > 2 ? `${first} +${pick.length - 2} more` : first;
};

const stepLabel = (tools) =>
  tools.length ? tools.map(toolLabel).join(", ") : "Wrote the reply";

const parseUsageTag = (label) => {
  const match = String(label || "").match(USAGE_TAG);
  if (!match) return { cleanLabel: label, meta: null };
  const meta = {};
  match[1].split(";").forEach((pair) => {
    const i = pair.indexOf("=");
    if (i > 0) meta[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  });
  return { cleanLabel: String(label).replace(USAGE_TAG, ""), meta };
};

const groupUsageRows = (rows) => {
  const grouped = [];
  const byTurn = new Map();
  rows.forEach((log) => {
    const { cleanLabel, meta } = parseUsageTag(log.label);
    const credits = Math.abs(Number(log.credits) || 0);
    if (!meta || !meta.t) {
      // Older rows (no tag) stay as individual lines.
      grouped.push({ ...log, label: cleanLabel, credits, steps: null });
      return;
    }
    const tools = meta.tools ? meta.tools.split(",").filter(Boolean) : [];
    const step = {
      id: log.id,
      n: Number(meta.s) || 0,
      tools,
      credits,
      date: log.date,
      balanceAfter: log.balanceAfter,
    };
    const existing = byTurn.get(meta.t);
    if (existing) {
      existing.steps.push(step);
      return;
    }
    const row = { id: `turn_${meta.t}`, category: log.category, steps: [step] };
    byTurn.set(meta.t, row);
    grouped.push(row);
  });

  // Finish the merged rows: order steps, total the credits, take the latest
  // step's time and balance, and write the plain-language title.
  return grouped.map((row) => {
    if (!row.steps) return row;
    const steps = [...row.steps].sort((a, b) => a.n - b.n);
    const last = steps[steps.length - 1];
    return {
      ...row,
      steps,
      label: usageTitle(steps.flatMap((st) => st.tools)),
      credits: steps.reduce((sum, st) => sum + st.credits, 0),
      date: last.date,
      balanceAfter: last.balanceAfter,
    };
  });
};

const USAGE_RANGES = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const rangeStart = (id) => {
  const now = new Date();
  if (id === "today")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (id === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (id === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
};

const formatTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const downloadUsageCsv = (rows) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    ["Date", "Action", "AI steps", "Credits used", "Balance after"]
      .map(esc)
      .join(","),
    ...rows.map((r) =>
      [
        r.date ? new Date(r.date).toLocaleString("en-IN") : "",
        r.label,
        r.steps ? r.steps.length : 1,
        r.credits,
        r.balanceAfter ?? "",
      ]
        .map(esc)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "samvaadik-ai-usage.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "failed", label: "Failed" },
];

const TABS = [
  { id: "billing", label: "Billing History", icon: Receipt },
  { id: "usage", label: "AI Usage", icon: Sparkles },
];

function TypeBadge({ category }) {
  const isSubscription = category === "subscription";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        isSubscription
          ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
          : "bg-emerald-50 text-emerald-700 ring-emerald-100"
      }`}
    >
      {isSubscription ? (
        <Crown className="w-3 h-3" />
      ) : (
        <Zap className="w-3 h-3" />
      )}
      {isSubscription ? "Subscription" : "Credits"}
    </span>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function RowIcon({ category }) {
  const isSubscription = category === "subscription";
  return (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        isSubscription
          ? "bg-indigo-50 text-indigo-600"
          : "bg-emerald-50 text-emerald-600"
      }`}
    >
      {isSubscription ? (
        <Crown className="w-3.5 h-3.5" />
      ) : (
        <Zap className="w-3.5 h-3.5" />
      )}
    </div>
  );
}

function UsageRowIcon() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
      <Activity className="w-3.5 h-3.5" />
    </div>
  );
}

// A ⋮ trigger that opens a portal-positioned menu with a single "Download
// invoice" action — disabled with an explanatory line when the row isn't a
// paid invoice. Rendered via createPortal straight into document.body so it
// floats above the table instead of getting clipped by any scroll container.
function RowMenu({
  log,
  status,
  loading,
  isOpen,
  position,
  onToggle,
  onDownload,
}) {
  const menuRef = useRef(null);
  const canDownload = status === "paid";

  useEffect(() => {
    if (!isOpen) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onToggle(null);
      }
    };
    const onScroll = () => onToggle(null);
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, onToggle]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => onToggle(log.id, e)}
        disabled={loading}
        title="More options"
        className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MoreVertical className="w-3.5 h-3.5" />
        )}
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed z-50 w-52 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
          >
            {canDownload ? (
              <button
                type="button"
                onClick={() => onDownload(log)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Download className="w-3.5 h-3.5" />
                Download invoice
              </button>
            ) : (
              <div className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                <Download className="w-3.5 h-3.5" />
                {status === "failed"
                  ? "No invoice — payment failed"
                  : "Available once confirmed"}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function BillingHistorySection({ userId }) {
  const [rawLogs, setRawLogs] = useState([]);
  const [rawTotal, setRawTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("billing"); // "billing" | "usage"
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [usageRange, setUsageRange] = useState("all");
  const [tabTouched, setTabTouched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);

  const toggleMenu = (logId, e) => {
    if (!logId || menuOpenId === logId) {
      setMenuOpenId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.right - 208, // 208px = menu width (w-52), right-aligned to the button
    });
    setMenuOpenId(logId);
  };

  // log.id is "payment_<uuid>" or "credit_<uuid>" (see getPaymentLogs) —
  // split it back into the {type, rawId} pair the invoice route expects.
  const handleDownload = async (log) => {
    const isSubscription = log.category === "subscription";
    const type = isSubscription ? "subscription" : "credits";
    const rawId = log.id.replace(/^(payment_|credit_)/, "");

    setMenuOpenId(null);
    setDownloadingId(log.id);
    try {
      const response = await downloadInvoice(type, rawId, userId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${log.label.replace(/[^a-z0-9]+/gi, "_")}_invoice.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showError("Couldn't download the invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Billing and usage are fetched separately so a long AI-usage history can
  // never push payments and purchases out of the result.
  const loadLogs = useCallback(
    async ({ silent = false } = {}) => {
      if (!userId) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(false);

      const fetchAll = async (kind, maxPages) => {
        const rows = [];
        let total = 0;
        for (let p = 1; p <= maxPages; p++) {
          const { data } = await getPaymentLogs(userId, {
            page: p,
            pageSize: FETCH_SIZE,
            kind,
          });
          const batch = data?.logs || [];
          total = data?.total ?? rows.length + batch.length;
          rows.push(...batch);
          if (batch.length === 0 || rows.length >= total) break;
        }
        return { rows, total };
      };

      try {
        const [billing, usage] = await Promise.all([
          fetchAll("billing", 5),
          fetchAll("usage", 10),
        ]);
        setRawLogs([...billing.rows, ...usage.rows]);
        setRawTotal(billing.total + usage.total);
        // Keep the navbar / sidebar balance in step with what we just loaded.
        if (silent) window.dispatchEvent(new Event(CREDITS_CHANGED_EVENT));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const invoiceRows = useMemo(() => rawLogs.filter(isInvoiceRow), [rawLogs]);
  const usageRows = useMemo(
    () => groupUsageRows(rawLogs.filter(isUsageRow)),
    [rawLogs],
  );

  const summary = useMemo(() => {
    const paidRows = invoiceRows.filter(
      (log) => normalizeStatus(log.status) === "paid",
    );
    const totalPaid = paidRows.reduce(
      (sum, log) => sum + toRupees(log.amount || 0),
      0,
    );
    return {
      totalPaid,
      count: invoiceRows.length,
      lastDate: invoiceRows[0]?.date || null,
    };
  }, [invoiceRows]);

  // A new account usually has AI usage but no purchases yet. Open on the tab
  // that actually has something to show (until the user picks one).
  useEffect(() => {
    if (loading || tabTouched) return;
    if (invoiceRows.length === 0 && usageRows.length > 0) {
      setActiveTab("usage");
    }
  }, [loading, tabTouched, invoiceRows.length, usageRows.length]);

  const rangedUsageRows = useMemo(() => {
    const start = rangeStart(usageRange);
    if (!start) return usageRows;
    return usageRows.filter((log) => log.date && new Date(log.date) >= start);
  }, [usageRows, usageRange]);

  const usageSummary = useMemo(() => {
    const totalCreditsUsed = rangedUsageRows.reduce(
      (sum, log) => sum + log.credits,
      0,
    );
    const count = rangedUsageRows.length;
    return {
      totalCreditsUsed,
      count,
      average: count ? totalCreditsUsed / count : 0,
      // Always the newest balance, whatever range is selected.
      latestBalance: usageRows[0]?.balanceAfter ?? null,
    };
  }, [rangedUsageRows, usageRows]);

  const activeRows = activeTab === "usage" ? rangedUsageRows : invoiceRows;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeRows.filter((log) => {
      if (
        activeTab === "billing" &&
        activeFilter !== "all" &&
        normalizeStatus(log.status) !== activeFilter
      )
        return false;
      if (!q) return true;
      return (
        log.label?.toLowerCase().includes(q) ||
        log.razorpayPaymentId?.toLowerCase().includes(q) ||
        log.razorpayOrderId?.toLowerCase().includes(q)
      );
    });
  }, [activeRows, activeTab, activeFilter, search]);

  // Reset to page 1 whenever the visible set changes shape
  useEffect(() => {
    setPage(1);
  }, [activeTab, activeFilter, search, usageRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const showingFrom =
    filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const pageNumbers = useMemo(() => {
    const span = 5;
    let start = Math.max(1, safePage - Math.floor(span / 2));
    let end = Math.min(totalPages, start + span - 1);
    start = Math.max(1, end - span + 1);
    const nums = [];
    for (let p = start; p <= end; p++) nums.push(p);
    return nums;
  }, [safePage, totalPages]);

  if (!userId) return null;

  const isUsageTab = activeTab === "usage";

  return (
    <div className="mt-14 rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Billing &amp; Usage
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Every subscription payment, credit purchase, and AI Assistant
              action, in one place.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTabTouched(true);
                  setActiveTab(tab.id);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stat chips */}
        <div
          className={`mt-6 grid gap-3 ${
            isUsageTab
              ? "grid-cols-2 lg:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-3"
          }`}
        >
          {isUsageTab ? (
            <>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Activity className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Credits used
                    {usageRange !== "all"
                      ? ` · ${USAGE_RANGES.find((r) => r.id === usageRange)?.label.toLowerCase()}`
                      : ""}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {usageSummary.totalCreditsUsed.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">AI actions</p>
                  <p className="text-sm font-bold text-gray-900">
                    {usageSummary.count.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Average per action</p>
                  <p className="text-sm font-bold text-gray-900">
                    {usageSummary.count
                      ? usageSummary.average.toLocaleString("en-IN", {
                          maximumFractionDigits: 1,
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance now</p>
                  <p className="text-sm font-bold text-gray-900">
                    {usageSummary.latestBalance != null
                      ? Number(usageSummary.latestBalance).toLocaleString(
                          "en-IN",
                        )
                      : "—"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total paid</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatAmount(summary.totalPaid)}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total invoices</p>
                  <p className="text-sm font-bold text-gray-900">
                    {summary.count}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <CalendarClock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last payment</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatDate(summary.lastDate)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 sm:px-8 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {isUsageTab &&
            USAGE_RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setUsageRange(r.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  usageRange === r.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          {!isUsageTab &&
            FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === f.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => loadLogs({ silent: true })}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {isUsageTab && (
            <button
              type="button"
              onClick={() => downloadUsageCsv(filtered)}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
          <div className="relative w-full sm:w-64 order-last sm:order-none">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isUsageTab ? "Search usage..." : "Search invoices..."
              }
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 sm:p-8 pt-5">
        {loading ? (
          <div className="py-14 text-center">
            <div className="inline-block w-8 h-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">
              {isUsageTab ? "Loading usage..." : "Loading billing history..."}
            </p>
          </div>
        ) : error ? (
          <div className="py-14 text-center">
            <p className="text-gray-500 text-sm">
              Couldn't load this right now. Please refresh the page.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {isUsageTab
                ? activeRows.length === 0
                  ? "No AI Assistant usage yet — actions it takes for you will show up here."
                  : "No usage matches your search."
                : invoiceRows.length === 0
                  ? "No billing history yet — your purchases will show up here."
                  : "No invoices match your filters."}
            </p>
          </div>
        ) : isUsageTab ? (
          <>
            {/* Desktop table — Usage */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="pb-3 pl-1 font-semibold align-middle">
                      Action
                    </th>
                    <th className="pb-3 font-semibold align-middle">
                      Date &amp; time
                    </th>
                    <th className="pb-3 font-semibold text-right align-middle">
                      Credits used
                    </th>
                    <th className="pb-3 pr-1 font-semibold text-right align-middle">
                      Balance after
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.map((log) => {
                    const expandable = !!log.steps;
                    const open = expandedId === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr
                          className={`group transition-colors ${
                            expandable ? "cursor-pointer" : ""
                          } hover:bg-gray-50/80`}
                          onClick={() =>
                            expandable && setExpandedId(open ? null : log.id)
                          }
                        >
                          <td className="h-16 pl-1 align-middle">
                            <div className="flex items-center gap-3">
                              <UsageRowIcon />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                  {log.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Samvaadik AI Assistant
                                  {log.steps && log.steps.length > 1
                                    ? ` · ${log.steps.length} steps`
                                    : ""}
                                </p>
                              </div>
                              {expandable && (
                                <ChevronDown
                                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                                    open ? "rotate-180" : ""
                                  }`}
                                />
                              )}
                            </div>
                          </td>
                          <td className="h-16 align-middle text-sm text-gray-600">
                            {formatDateTime(log.date)}
                          </td>
                          <td className="h-16 align-middle text-sm font-semibold text-gray-900 text-right">
                            {log.credits.toLocaleString("en-IN")}
                          </td>
                          <td className="h-16 pr-1 align-middle text-sm text-gray-600 text-right">
                            {log.balanceAfter != null
                              ? Number(log.balanceAfter).toLocaleString("en-IN")
                              : "—"}
                          </td>
                        </tr>
                        {expandable && open && (
                          <tr className="bg-gray-50/60">
                            <td colSpan={4} className="px-4 py-3">
                              <ul className="space-y-2">
                                {log.steps.map((st, i) => (
                                  <li
                                    key={st.id || i}
                                    className="flex items-center justify-between text-sm"
                                  >
                                    <span className="flex items-center gap-2 text-gray-700">
                                      <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-500 flex items-center justify-center">
                                        {i + 1}
                                      </span>
                                      {stepLabel(st.tools)}
                                    </span>
                                    <span className="flex items-center gap-6 text-gray-500">
                                      <span>{formatTime(st.date)}</span>
                                      <span className="w-20 text-right font-medium text-gray-800">
                                        {st.credits.toLocaleString("en-IN")}{" "}
                                        {st.credits === 1
                                          ? "credit"
                                          : "credits"}
                                      </span>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — Usage */}
            <div className="md:hidden space-y-3">
              {pageRows.map((log) => {
                const expandable = !!log.steps;
                const open = expandedId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-gray-100 p-4"
                  >
                    <button
                      type="button"
                      disabled={!expandable}
                      onClick={() => setExpandedId(open ? null : log.id)}
                      className="w-full flex items-start gap-3 text-left"
                    >
                      <UsageRowIcon />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {log.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(log.date)}
                          {log.steps && log.steps.length > 1
                            ? ` · ${log.steps.length} steps`
                            : ""}
                        </p>
                      </div>
                      {expandable && (
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                    {expandable && open && (
                      <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                        {log.steps.map((st, i) => (
                          <li
                            key={st.id || i}
                            className="flex items-center justify-between text-xs text-gray-600"
                          >
                            <span>
                              {i + 1}. {stepLabel(st.tools)}
                            </span>
                            <span className="font-medium text-gray-800">
                              {st.credits.toLocaleString("en-IN")}{" "}
                              {st.credits === 1 ? "credit" : "credits"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-gray-500">
                        {log.credits.toLocaleString("en-IN")}{" "}
                        {log.credits === 1 ? "credit" : "credits"} used
                      </span>
                      <span className="font-bold text-gray-900">
                        Bal:{" "}
                        {log.balanceAfter != null
                          ? Number(log.balanceAfter).toLocaleString("en-IN")
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Desktop table — Billing */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    <th className="pb-3 pl-1 font-semibold align-middle">
                      Invoice
                    </th>
                    <th className="pb-3 font-semibold align-middle">Type</th>
                    <th className="pb-3 font-semibold align-middle">Date</th>
                    <th className="pb-3 font-semibold align-middle">Status</th>
                    <th className="pb-3 font-semibold text-right align-middle">
                      Amount
                    </th>
                    <th className="pb-3 pr-1 align-middle"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageRows.map((log) => {
                    const status = normalizeStatus(log.status);
                    return (
                      <tr
                        key={log.id}
                        className="group hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="h-14 pl-1 align-middle">
                          <div className="flex items-center gap-3">
                            <RowIcon category={log.category} />
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {log.label}
                            </p>
                          </div>
                        </td>
                        <td className="h-14 align-middle">
                          <TypeBadge category={log.category} />
                        </td>
                        <td className="h-14 align-middle text-sm text-gray-600">
                          {formatDate(log.date)}
                        </td>
                        <td className="h-14 align-middle">
                          <StatusPill status={status} />
                        </td>
                        <td className="h-14 align-middle text-sm font-semibold text-gray-900 text-right">
                          {formatAmount(log.amount)}
                        </td>
                        <td className="h-14 pr-1 align-middle text-right">
                          <RowMenu
                            log={log}
                            status={status}
                            loading={downloadingId === log.id}
                            isOpen={menuOpenId === log.id}
                            position={menuPosition}
                            onToggle={toggleMenu}
                            onDownload={handleDownload}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — Billing */}
            <div className="md:hidden space-y-3">
              {pageRows.map((log) => {
                const status = normalizeStatus(log.status);
                return (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-gray-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <RowIcon category={log.category} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(log.date)}
                        </p>
                      </div>
                      <RowMenu
                        log={log}
                        status={status}
                        loading={downloadingId === log.id}
                        isOpen={menuOpenId === log.id}
                        position={menuPosition}
                        onToggle={toggleMenu}
                        onDownload={handleDownload}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <TypeBadge category={log.category} />
                        <StatusPill status={status} />
                      </div>
                      <p className="text-sm font-bold text-gray-900">
                        {formatAmount(log.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {filtered.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">{showingFrom}</span>–
              <span className="font-medium text-gray-700">{showingTo}</span> of{" "}
              <span className="font-medium text-gray-700">
                {filtered.length}
              </span>
              {rawTotal > rawLogs.length ? " (most recent)" : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === safePage
                      ? "bg-emerald-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
