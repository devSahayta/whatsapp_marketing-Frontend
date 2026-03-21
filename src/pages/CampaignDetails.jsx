import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  MessageSquare,
  Users,
  Calendar,
  FileText,
  Phone,
  TimerReset,
  Gauge,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  getCampaignById,
  retryCampaign,
  syncCampaignStatus,
} from "../api/campaigns";
import useAuthUser from "../hooks/useAuthUser";
import { exportCampaignPdf } from "../utils/exportCampaignPdf";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const PIE_COLORS = {
  sent: "#3B82F6",
  delivered: "#10B981",
  // read: "#14B8A6",
  read: "#facc15",
  pending: "#F59E0B",
  failed: "#EF4444",
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 sec";
  if (seconds < 60) return `${Math.ceil(seconds)} sec`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min`;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getSentTimeline = (messages = []) =>
  messages
    .filter((message) => message.sent_at)
    .map((message) => new Date(message.sent_at).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

const getCampaignAnalytics = (stats = {}, messages = [], campaign = null) => {
  const total = Number(stats.total) || 0;
  const sent = Number(stats.sent) || 0;
  const failed = Number(stats.failed) || 0;
  const delivered = Number(stats.delivered) || 0;
  const read = Number(stats.read) || 0;
  const pending = Math.max(
    0,
    Number.isFinite(Number(stats.pending))
      ? Number(stats.pending)
      : total - (sent + failed),
  );
  const processed = Math.min(total, sent + failed);
  const completionPercent =
    total > 0 ? Math.min(100, (processed / total) * 100) : 0;

  const sentTimeline = getSentTimeline(messages);
  let sendingSpeed = null;

  if (sentTimeline.length >= 2) {
    const elapsedSeconds =
      (sentTimeline[sentTimeline.length - 1] - sentTimeline[0]) / 1000;

    if (elapsedSeconds > 0) {
      sendingSpeed = sentTimeline.length / elapsedSeconds;
    }
  } else if (processed > 0 && campaign?.started_at) {
    const startedAt = new Date(campaign.started_at).getTime();
    const nowOrCompletedAt = new Date(
      campaign.completed_at || campaign.updated_at || Date.now(),
    ).getTime();
    const elapsedSeconds = (nowOrCompletedAt - startedAt) / 1000;

    if (Number.isFinite(elapsedSeconds) && elapsedSeconds > 0) {
      sendingSpeed = processed / elapsedSeconds;
    }
  }

  const remaining = Math.max(0, total - processed);
  const etaSeconds =
    sendingSpeed && remaining > 0 ? remaining / sendingSpeed : null;
  const durationSeconds =
    campaign?.started_at && campaign?.completed_at
      ? (new Date(campaign.completed_at) - new Date(campaign.started_at)) / 1000
      : null;

  return {
    total,
    sent,
    delivered,
    read,
    failed,
    pending,
    processed,
    remaining,
    completionPercent,
    sendingSpeed,
    etaSeconds,
    durationSeconds,
    pieData: [
      { name: "Sent", value: sent, key: "sent" },
      { name: "Delivered", value: delivered, key: "delivered" },
      { name: "Read", value: read, key: "read" },
      { name: "Pending", value: pending, key: "pending" },
      { name: "Failed", value: failed, key: "failed" },
    ].filter((item) => item.value > 0),
  };
};

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuthUser();
  const messagesRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id, userId]);

  useEffect(() => {
    if (!campaign || ["completed", "failed"].includes(campaign.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadCampaign({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [campaign?.status, id, userId]);

  const loadCampaign = async ({ silent = false } = {}) => {
    let toastId;

    try {
      if (!silent) {
        toastId = showLoading("Loading campaign...");
      }
      const res = await getCampaignById(id, userId);
      const data = res.data.data;

      if (toastId) {
        dismissToast(toastId);
      }

      setCampaign(data.campaign);
      setMessages(data.messages || []);
      setStats(data.stats || {});

      // 🔄 background sync
      // await syncStatusIfNeeded(data.campaign);
    } catch (err) {
      if (toastId) {
        dismissToast(toastId);
        showError("Failed to load campaign details");
      }
    } finally {
      setLoading(false);
    }
  };

  const syncStatusIfNeeded = async (campaignData) => {
    if (!campaignData) return;

    // 🚫 Do not sync while scheduled
    if (campaignData.status === "scheduled") return;

    try {
      await syncCampaignStatus(id, userId);
    } catch (err) {
      // silent fail (this is a background sync)
      console.warn("Status sync skipped / failed");
    }
  };

  // useEffect(() => {
  //   if (messagesRef.current) {
  //     messagesRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages]);

  const filteredMessages = messages.filter((msg) => {
    const q = search.toLowerCase();
    const matchesSearch =
      msg.contact_name?.toLowerCase().includes(q) ||
      msg.phone_number?.includes(q) ||
      msg.status?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ? true : msg.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRetryCampaign = async () => {
    try {
      setRetryLoading(true);

      const res = await retryCampaign(id, userId);

      // ✅ success message from backend
      const message = res?.data?.message || "Retry scheduled successfully";

      const retryMinutes = res?.data?.retry_after_minutes;

      showSuccess(
        retryMinutes
          ? `${message}. Will retry in ${retryMinutes} minutes.`
          : message,
      );

      await loadCampaign(); // refresh UI
    } catch (err) {
      console.log({ err });

      // ✅ always trust backend error first
      showError(
        err?.response?.data?.error ||
          err?.response?.data?.details ||
          "Failed to retry campaign",
      );
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">
            Campaign not found
          </h2>
          <p className="text-gray-600 mt-2">
            This campaign may have been deleted or you don’t have access to it.
          </p>

          <button
            onClick={() => navigate("/campaigns")}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const statusBadge =
    {
      completed: "bg-green-100 text-green-700",
      running: "bg-blue-100 text-blue-700",
      scheduled: "bg-yellow-100 text-yellow-700",
      failed: "bg-red-100 text-red-700",
    }[campaign.status] || "bg-gray-100 text-gray-600";
  const analytics = getCampaignAnalytics(stats, messages, campaign);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate("/campaigns")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {campaign.campaign_name}
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge}`}
              >
                {campaign.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* <button
                onClick={async () => {
                  // await syncCampaignStatus(id, userId);
                  await loadCampaign();
                  showSuccess("Campaign status refreshed");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
    border border-gray-200 text-gray-700 font-medium
    hover:bg-gray-100 transition"
              >
                <Clock className="w-4 h-4" />
                Refresh Status
              </button> */}

              {/* Download PDF */}
              <button
                onClick={() =>
                  exportCampaignPdf({
                    campaign,
                    stats,
                    messages: filteredMessages,
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
        border border-blue-200 text-blue-600 font-medium
        hover:bg-blue-50 transition"
              >
                <FileText className="w-4 h-4" />
                Download Report
              </button>

              {/* Retry button */}
              {["completed", "failed"].includes(campaign.status) &&
                stats.failed > 0 && (
                  <button
                    onClick={handleRetryCampaign}
                    disabled={retryLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
            bg-gradient-to-r from-orange-500 to-red-500
            text-white font-medium shadow-sm
            hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {retryLoading ? "Retrying..." : "Retry Failed Messages"}
                  </button>
                )}
            </div>
          </div>

          {campaign.description && (
            <p className="text-gray-600 mt-2 max-w-3xl">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          <StatCard title="Total" value={stats.total} icon={Users} />
          <StatCard title="Processed" value={analytics.processed} icon={Send} />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
          />
          <StatCard title="Read" value={stats.read} icon={MessageSquare} />
          <StatCard title="Pending" value={stats.pending} icon={Clock} />
          <StatCard title="Failed" value={stats.failed} icon={XCircle} />
        </div> */}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <CampaignOverviewChart analytics={analytics} />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <CampaignProgressCard analytics={analytics} />
            <CampaignEtaCard analytics={analytics} status={campaign.status} />
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 grid md:grid-cols-2 gap-6">
          <DetailItem
            icon={Users}
            label="Contact Group"
            value={`${campaign.groups?.group_name} (${campaign.total_recipients} contacts)`}
          />
          <DetailItem
            icon={FileText}
            label="Template"
            value={campaign.whatsapp_templates?.name}
          />
          <DetailItem
            icon={Phone}
            label="Business Number"
            value={campaign.whatsapp_accounts?.business_phone_number}
          />
          <DetailItem
            icon={Calendar}
            label="Scheduled At"
            value={new Date(campaign.scheduled_at).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          />
        </div>

        {/* Messages */}
        <div
          ref={messagesRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Messages ({filteredMessages.length})
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All statuses</option>
                <option value="read">Read</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, number or status"
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto">
            {filteredMessages.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-8">
                No messages found
              </p>
            )}

            {filteredMessages.map((msg) => (
              <div
                key={msg.cm_id}
                className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {msg.contact_name}
                    </p>
                    <p className="text-sm text-gray-500">{msg.phone_number}</p>
                  </div>

                  <div className="relative group">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        msg.status === "sent"
                          ? "bg-blue-100 text-blue-700"
                          : msg.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : msg.status === "read"
                              ? "bg-emerald-100 text-emerald-700"
                              : msg.status === "failed"
                                ? "bg-red-100 text-red-700 cursor-pointer"
                                : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {msg.status}
                    </span>

                    {/* ❌ Error Tooltip (only for failed) */}
                    {msg.status === "failed" && msg.error_message && (
                      <div className="absolute right-0 mt-2 w-64 p-3 rounded-lg shadow-lg bg-red-50 border border-red-200 text-xs text-red-700 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                        {msg.error_message}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Sent at {new Date(msg.sent_at).toLocaleTimeString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------ Small Components ------------------ */

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-pink-100 flex items-center justify-center">
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
    </div>
  </div>
);

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

const CampaignOverviewChart = ({ analytics }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Campaign Overview
        </h2>
        <p className="text-sm text-gray-500">
          Message status distribution from campaign stats
        </p>
      </div>

      <div className="text-right">
        <p className="text-2xl font-semibold text-gray-900">
          {analytics.total}
        </p>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Total recipients
        </p>
      </div>
    </div>

    {analytics.pieData.length > 0 ? (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={analytics.pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={98}
              paddingAngle={3}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {analytics.pieData.map((entry) => (
                <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, "Count"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    ) : (
      <div className="h-72 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-sm text-gray-500">
        No analytics available yet
      </div>
    )}
  </div>
);

const CampaignProgressCard = ({ analytics }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
        <Gauge className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
        <p className="text-sm text-gray-500">
          Completed vs remaining recipients
        </p>
      </div>
    </div>

    <div className="mb-3 flex items-end justify-between gap-3">
      <p className="text-3xl font-semibold text-gray-900">
        {analytics.completionPercent.toFixed(1)}%
      </p>
      <p className="text-sm text-gray-500">
        {analytics.processed} of {analytics.total} done
      </p>
    </div>

    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-emerald-500 transition-all duration-500"
        style={{ width: `${analytics.completionPercent}%` }}
      />
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-xl bg-emerald-50 px-3 py-2">
        <p className="text-emerald-700 font-medium">Completed</p>
        <p className="text-gray-900">{analytics.processed}</p>
      </div>
      <div className="rounded-xl bg-amber-50 px-3 py-2">
        <p className="text-amber-700 font-medium">Remaining</p>
        <p className="text-gray-900">{analytics.remaining}</p>
      </div>
    </div>
  </div>
);

const CampaignEtaCard = ({ analytics, status }) => {
  const isTerminal = ["completed", "failed"].includes(status);
  const isFinished = analytics.remaining === 0 || status === "completed";
  const etaLabel = isFinished
    ? "Campaign complete"
    : analytics.etaSeconds
      ? formatDuration(analytics.etaSeconds)
      : analytics.sendingSpeed
        ? "Less than a minute"
        : "Waiting for enough data";
  const speedLabel = analytics.sendingSpeed
    ? `${analytics.sendingSpeed.toFixed(2)} msg/sec`
    : "Not enough data";
  const durationLabel = analytics.durationSeconds
    ? formatDuration(analytics.durationSeconds)
    : "In progress";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
          <TimerReset className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isTerminal ? "Campaign Timing" : "Expected Time Remaining"}
          </h2>
          <p className="text-sm text-gray-500">
            {isTerminal
              ? "Final timing summary"
              : "Based on current campaign throughput"}
          </p>
        </div>
      </div>

      <p className="text-3xl font-semibold text-gray-900">
        {/* {isTerminal ? durationLabel : etaLabel} */}
        {isTerminal ? "" : etaLabel}
      </p>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
          <span className="text-gray-500">Sending speed</span>
          <span className="font-medium text-gray-900">{speedLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
          <span className="text-gray-500">Campaign duration</span>
          <span className="font-medium text-gray-900">{durationLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
