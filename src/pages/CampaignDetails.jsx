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
} from "lucide-react";
import { getCampaignById, retryCampaign } from "../api/campaigns";
import useAuthUser from "../hooks/useAuthUser";
import { exportCampaignPdf } from "../utils/exportCampaignPdf";
import { showError, showSuccess } from "../utils/toast";

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
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    loadCampaign();
  }, [id, userId]);

  const loadCampaign = async () => {
    try {
      const res = await getCampaignById(id, userId);
      const data = res.data.data;

      setCampaign(data.campaign);
      setMessages(data.messages || []);
      setStats(data.stats || {});
    } catch (err) {
      showError("Failed to load campaign details");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (messagesRef.current) {
  //     messagesRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages]);

  const filteredMessages = messages.filter((msg) => {
    const q = search.toLowerCase();
    return (
      msg.contact_name?.toLowerCase().includes(q) ||
      msg.phone_number?.includes(q) ||
      msg.status?.toLowerCase().includes(q)
    );
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Total" value={stats.total} icon={Users} />
          <StatCard title="Sent" value={stats.sent} icon={Send} />
          <StatCard
            title="Delivered"
            value={stats.delivered}
            icon={CheckCircle}
          />
          <StatCard title="Read" value={stats.read} icon={MessageSquare} />
          <StatCard title="Pending" value={stats.pending} icon={Clock} />
          <StatCard title="Failed" value={stats.failed} icon={XCircle} />
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
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, number or status"
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
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

                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      msg.status === "sent"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {msg.status}
                  </span>
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

export default CampaignDetails;
