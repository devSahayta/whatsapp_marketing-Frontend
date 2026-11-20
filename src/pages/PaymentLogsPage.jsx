// src/pages/PaymentLogsPage.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Receipt,
  CreditCard,
  Gift,
  Coins,
  MinusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Copy,
  Check,
  Wallet,
  ListChecks,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { getPaymentLogs } from "../api/payment";

const PAGE_SIZE = 10;
const SUMMARY_PAGE_SIZE = 100;
const SUMMARY_MAX_PAGES = 5; // hard cap so this never turns into an unbounded fetch loop

// Supports either paise (140000) or rupees (1400) from backend records,
// same heuristic already used on the pricing page.
const formatRupees = (amount) => {
  if (amount == null) return "—";
  const value = Number(amount);
  if (Number.isNaN(value)) return "—";
  const rupees = value >= 100000 ? value / 100 : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
};

const formatDate = (value) => {
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

const CATEGORY_META = {
  subscription: {
    label: "Subscription",
    icon: CreditCard,
    iconBg: "bg-emerald-100 text-emerald-600",
    filterGroup: "subscription",
  },
  purchase: {
    label: "Credit top-up",
    icon: Coins,
    iconBg: "bg-teal-100 text-teal-600",
    filterGroup: "credits",
  },
  subscription_bonus: {
    label: "Free credits",
    icon: Gift,
    iconBg: "bg-amber-100 text-amber-600",
    filterGroup: "credits",
  },
  deduction: {
    label: "Credits used",
    icon: MinusCircle,
    iconBg: "bg-gray-100 text-gray-500",
    filterGroup: "credits",
  },
  adjustment: {
    label: "Adjustment",
    icon: Receipt,
    iconBg: "bg-gray-100 text-gray-500",
    filterGroup: "credits",
  },
};

const STATUS_META = {
  paid: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  completed: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  created: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  pending: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  failed: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "subscription", label: "Subscriptions" },
  { key: "credits", label: "Credits" },
];

const StatusPill = ({ status }) => {
  const key = (status || "").toLowerCase();
  const meta = STATUS_META[key] || {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {status || "unknown"}
    </span>
  );
};

const CategoryIcon = ({ category }) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.adjustment;
  const Icon = meta.icon;
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
    >
      <Icon size={18} />
    </div>
  );
};

const CopyField = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(value).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <code className="truncate rounded-md bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy"
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-white hover:text-emerald-600"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, tone, label, value }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    teal: "bg-teal-50 text-teal-600",
    amber: "bg-amber-50 text-amber-600",
    gray: "bg-gray-100 text-gray-500",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500">{label}</p>
        <p className="truncate text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

export default function PaymentLogsPage() {
  const { userId } = useAuthUser();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");

  const [summaryLogs, setSummaryLogs] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleExpanded = (id) =>
    setExpandedId((current) => (current === id ? null : id));

  const loadLogs = useCallback(
    async (targetPage) => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getPaymentLogs(userId, {
          page: targetPage,
          pageSize: PAGE_SIZE,
        });
        setLogs(res.data?.logs || []);
        setTotal(res.data?.total || 0);
      } catch (err) {
        console.error("Failed to load payment logs:", err);
        setError("Couldn't load your payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // A separate, larger fetch purely to power the summary cards, so the
  // totals reflect the account's whole history rather than just one page.
  const loadSummary = useCallback(async () => {
    if (!userId) return;
    setSummaryLoading(true);
    try {
      let all = [];
      let currentPage = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await getPaymentLogs(userId, {
          page: currentPage,
          pageSize: SUMMARY_PAGE_SIZE,
        });
        const batch = res.data?.logs || [];
        all = all.concat(batch);
        const grandTotal = res.data?.total || all.length;
        if (
          all.length >= grandTotal ||
          batch.length === 0 ||
          currentPage >= SUMMARY_MAX_PAGES
        ) {
          break;
        }
        currentPage += 1;
      }
      setSummaryLogs(all);
    } catch (err) {
      console.error("Failed to load payment summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadLogs(page);
  }, [page, loadLogs]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const stats = useMemo(() => {
    const isSuccessful = (s) =>
      ["paid", "completed"].includes((s || "").toLowerCase());

    const totalPaid = summaryLogs
      .filter(
        (l) =>
          isSuccessful(l.status) &&
          (l.category === "subscription" || l.category === "purchase"),
      )
      .reduce((sum, l) => {
        const v = Number(l.amount) || 0;
        return sum + (v >= 100000 ? v / 100 : v);
      }, 0);

    const creditsPurchased = summaryLogs
      .filter((l) => l.category === "purchase" && isSuccessful(l.status))
      .reduce((sum, l) => sum + (Number(l.credits) || 0), 0);

    const freeCredits = summaryLogs
      .filter((l) => l.category === "subscription_bonus")
      .reduce((sum, l) => sum + (Number(l.credits) || 0), 0);

    return {
      totalPaid,
      creditsPurchased,
      freeCredits,
      count: summaryLogs.length,
    };
  }, [summaryLogs]);

  const visibleLogs = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter(
      (l) => (CATEGORY_META[l.category]?.filterGroup || "credits") === filter,
    );
  }, [logs, filter]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-200">
          <Receipt size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payment Logs</h1>
          <p className="text-sm text-gray-500">
            Subscription payments and AI credit transactions, newest first.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Wallet}
          tone="emerald"
          label="Total paid"
          value={summaryLoading ? "…" : formatRupees(stats.totalPaid)}
        />
        <StatCard
          icon={Coins}
          tone="teal"
          label="Credits purchased"
          value={summaryLoading ? "…" : `+${stats.creditsPurchased}`}
        />
        <StatCard
          icon={Gift}
          tone="amber"
          label="Free credits"
          value={summaryLoading ? "…" : `+${stats.freeCredits}`}
        />
        <StatCard
          icon={ListChecks}
          tone="gray"
          label="Transactions"
          value={summaryLoading ? "…" : stats.count}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500">
            <Loader2 size={28} className="animate-spin text-emerald-600" />
            <p className="text-sm">Loading your payment history…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <AlertCircle size={28} className="text-red-500" />
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={() => loadLogs(page)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        ) : visibleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Receipt size={28} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              {filter === "all" ? "No payments yet" : "Nothing here yet"}
            </p>
            <p className="text-xs text-gray-400">
              Your subscription payments and credit top-ups will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {visibleLogs.map((log) => {
                const isOpen = expandedId === log.id;
                const meta =
                  CATEGORY_META[log.category] || CATEGORY_META.adjustment;

                return (
                  <div key={log.id}>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(log.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/80"
                    >
                      <CategoryIcon category={log.category} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {log.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {meta.label} · {formatDate(log.date)}
                          {log.credits != null && (
                            <>
                              {" "}
                              ·{" "}
                              <span
                                className={
                                  log.credits > 0
                                    ? "font-medium text-emerald-600"
                                    : "font-medium text-red-500"
                                }
                              >
                                {log.credits > 0 ? "+" : ""}
                                {log.credits} credits
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatRupees(log.amount)}
                        </p>
                        <div className="mt-1">
                          <StatusPill status={log.status} />
                        </div>
                      </div>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-300 transition-transform ${
                          isOpen ? "rotate-180 text-gray-500" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                          <CopyField
                            label="Razorpay Order ID"
                            value={log.razorpayOrderId}
                          />
                          <CopyField
                            label="Razorpay Payment ID"
                            value={log.razorpayPaymentId}
                          />
                          {log.planId && (
                            <CopyField label="Plan ID" value={log.planId} />
                          )}
                          {log.balanceAfter != null && (
                            <CopyField
                              label="Balance After"
                              value={`${log.balanceAfter} credits`}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3">
              <p className="text-xs text-gray-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-50"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
