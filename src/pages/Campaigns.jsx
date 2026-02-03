// Pages/Campaigns.jsx - IMPROVED VERSION

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  Plus,
  Search,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Edit,
  Trash2,
  Ban,
  Eye,
  RefreshCw,
  Send,
  TrendingUp,
} from "lucide-react";
import { getCampaigns, deleteCampaign, cancelCampaign } from "../api/campaigns";

const Campaigns = () => {
  const navigate = useNavigate();
  const { user } = useKindeAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  // Load campaigns
  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  // Filter campaigns
  useEffect(() => {
    filterCampaigns();
  }, [searchTerm, statusFilter, campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCampaigns(user.id);
      setCampaigns(res.data.data || []);
    } catch (err) {
      setError("Failed to load campaigns");
      console.error("Load campaigns error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      filtered = filtered.filter((campaign) =>
        campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((campaign) => campaign.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await deleteCampaign(campaignId, user.id);
      loadCampaigns();
    } catch (err) {
      alert("Failed to delete campaign");
      console.error("Delete error:", err);
    }
  };

  const handleCancel = async (campaignId) => {
    if (!window.confirm("Are you sure you want to cancel this campaign?")) return;

    try {
      await cancelCampaign(campaignId, user.id);
      loadCampaigns();
    } catch (err) {
      alert("Failed to cancel campaign");
      console.error("Cancel error:", err);
    }
  };

  // Stats
  const stats = {
    total: campaigns.length,
    scheduled: campaigns.filter((c) => c.status === "scheduled").length,
    processing: campaigns.filter((c) => c.status === "processing").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    failed: campaigns.filter((c) => c.status === "failed").length,
  };

  // Calculate total recipients from all campaigns
  const totalRecipients = campaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0);
  const totalSent = campaigns.reduce((sum, c) => sum + (c.messages_sent || 0), 0);

  // Status Badge
  const StatusBadge = ({ status }) => {
    const config = {
      scheduled: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock, label: "Scheduled" },
      processing: { bg: "bg-orange-100", text: "text-orange-700", icon: Loader, label: "Processing" },
      completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle, label: "Completed" },
      failed: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Failed" },
      cancelled: { bg: "bg-gray-100", text: "text-gray-700", icon: Ban, label: "Cancelled" },
    };

    const { bg, text, icon: Icon, label } = config[status] || config.scheduled;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  // Campaign Card
  const CampaignCard = ({ campaign }) => {
    const scheduledDate = new Date(campaign.scheduled_at);

    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
        {/* Header - Fixed Height */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-4">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {campaign.campaign_name}
              </h3>
            </div>
            <StatusBadge status={campaign.status} />
          </div>
          {campaign.description && (
            <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
              {campaign.description}
            </p>
          )}
          {!campaign.description && <div className="min-h-[40px]"></div>}
        </div>

        {/* Body - Fixed Height */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Info Grid */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Group</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {campaign.groups?.group_name || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Template</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {campaign.whatsapp_templates?.name || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="text-sm font-medium text-gray-900">
                  {scheduledDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  {" at "}
                  {scheduledDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Section - Fixed Height */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            {campaign.status === "completed" ? (
              // Completed Campaign Stats
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sent</p>
                  <p className="text-lg font-bold text-green-600">{campaign.messages_sent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Failed</p>
                  <p className="text-lg font-bold text-red-600">{campaign.messages_failed}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Success</p>
                  <p className="text-lg font-bold text-blue-600">
                    {campaign.total_recipients > 0
                      ? Math.round((campaign.messages_sent / campaign.total_recipients) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            ) : campaign.status === "processing" ? (
              // Processing Campaign
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader className="w-5 h-5 text-orange-600 animate-spin" />
                <p className="text-sm font-medium text-orange-600">Sending messages...</p>
              </div>
            ) : (
              // Scheduled/Cancelled/Failed
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Recipients</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {campaign.total_recipients}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions - Fixed Height */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
          <button
            onClick={() => navigate(`/campaigns/${campaign.campaign_id}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            View
          </button>

          {campaign.status === "scheduled" && (
            <>
              <button
                onClick={() => navigate(`/campaigns/edit/${campaign.campaign_id}`)}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancel(campaign.campaign_id)}
                className="px-4 py-2.5 bg-white border border-gray-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
                title="Cancel"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}

          {["completed", "failed", "cancelled"].includes(campaign.status) && (
            <button
              onClick={() => handleDelete(campaign.campaign_id)}
              className="px-4 py-2.5 bg-white border border-gray-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-600 mt-1">Manage your WhatsApp marketing campaigns</p>
            </div>
            <button
              onClick={() => navigate("/campaigns/create")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Improved Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Campaigns */}
        <div className="bg-white rounded-xl p-6 border-2 border-amber-200 hover:border-amber-400 transition-all">
  <div className="flex items-center justify-between mb-2">
    <div>
      <p className="text-gray-600 text-sm font-medium">Total Campaigns</p>
      <p className="text-3xl font-bold text-amber-600 mt-1">{stats.total}</p>
    </div>
    <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center">
      <TrendingUp className="w-7 h-7 text-amber-600" />
    </div>
  </div>

  <div className="flex items-center gap-1 text-gray-500 text-xs mt-3">
    <Send className="w-3 h-3" />
    <span>{totalSent.toLocaleString()} messages sent</span>
  </div>
</div>
    

          {/* Scheduled */}
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-sm font-medium">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Pending execution</p>
          </div>

          {/* Active (Processing + Completed) */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {stats.processing > 0 ? `${stats.processing} processing now` : "All finished"}
            </p>
          </div>

          {/* Failed */}
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 hover:border-red-400 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-gray-600 text-sm font-medium">Failed</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.failed}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Needs attention</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={loadCampaigns}
              disabled={loading}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all" ? "No campaigns found" : "No campaigns yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first campaign to get started"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <button
                onClick={() => navigate("/campaigns/create")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Campaign
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.campaign_id} campaign={campaign} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;