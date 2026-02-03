// Pages/EditCampaign.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Check,
  Loader,
  Save,
  Info,
} from "lucide-react";
import {
  getCampaignById,
  updateCampaign,
} from "../api/campaigns";

const EditCampaign = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { user } = useKindeAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    campaign_name: "",
    description: "",
    scheduled_at: "",
    timezone: "Asia/Kolkata",
  });

  // Campaign details (read-only info)
  const [campaignInfo, setCampaignInfo] = useState(null);

  // Load campaign data on mount
  useEffect(() => {
    if (user && campaignId) {
      loadCampaign();
    }
  }, [user, campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getCampaignById(campaignId, user.id);
      const campaign = res.data.data.campaign;

      // Check if campaign can be edited
      if (campaign.status !== "scheduled") {
        setError(`Cannot edit campaign with status: ${campaign.status}`);
        return;
      }

      // Set read-only info
      setCampaignInfo({
        group_name: campaign.groups?.group_name,
        template_name: campaign.whatsapp_templates?.name,
        total_recipients: campaign.total_recipients,
        status: campaign.status,
      });

      // Convert UTC scheduled_at to local datetime for input
      const utcDate = new Date(campaign.scheduled_at);
      
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const year = utcDate.getFullYear();
      const month = String(utcDate.getMonth() + 1).padStart(2, '0');
      const day = String(utcDate.getDate()).padStart(2, '0');
      const hours = String(utcDate.getHours()).padStart(2, '0');
      const minutes = String(utcDate.getMinutes()).padStart(2, '0');
      
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Set editable form data
      setFormData({
        campaign_name: campaign.campaign_name || "",
        description: campaign.description || "",
        scheduled_at: localDateTime,
        timezone: campaign.timezone || "Asia/Kolkata",
      });
    } catch (err) {
      setError("Failed to load campaign");
      console.error("Load campaign error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.campaign_name.trim()) {
      setError("Campaign name is required");
      return;
    }

    if (!formData.scheduled_at) {
      setError("Scheduled time is required");
      return;
    }

    // Check if scheduled time is in future
    const scheduledDate = new Date(formData.scheduled_at);
    const now = new Date();

    if (scheduledDate <= now) {
      setError("Scheduled time must be in the future");
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Convert IST to UTC (same as CreateCampaign)
      const localDate = new Date(formData.scheduled_at);
      const ISTOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const browserOffset = localDate.getTimezoneOffset() * 60 * 1000;
      
      const utcTime = localDate.getTime() - browserOffset - ISTOffset;
      const utcISO = new Date(utcTime).toISOString();

      const payload = {
        user_id: user.id,
        campaign_name: formData.campaign_name,
        description: formData.description,
        scheduled_at: utcISO,
      };

      console.log("User input (IST):", formData.scheduled_at);
      console.log("Sending to backend (UTC):", utcISO);

      await updateCampaign(campaignId, payload);

      setSuccess(true);
      setTimeout(() => {
        navigate("/campaigns");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update campaign");
      console.error("Update campaign error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaignInfo) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/campaigns")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/campaigns")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
          <p className="text-gray-600 mt-2">
            Update campaign details and reschedule
          </p>
        </div>

        {/* Campaign Info (Read-only) */}
        {campaignInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-blue-900 font-medium mb-3">
                  Campaign Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Group</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {campaignInfo.group_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Template</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {campaignInfo.template_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Recipients</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {campaignInfo.total_recipients} contacts
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Status</p>
                    <p className="text-sm font-semibold text-blue-900 capitalize">
                      {campaignInfo.status}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  ℹ️ Group and template cannot be changed after campaign creation
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 font-medium">Success!</p>
                <p className="text-green-600 text-sm">
                  Campaign updated successfully. Redirecting...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="campaign_name"
                value={formData.campaign_name}
                onChange={handleInputChange}
                placeholder="e.g., Wedding Invitation 2026"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add campaign details or notes..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                disabled={saving}
              />
            </div>

            {/* Scheduled Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-2">
                Time zone: {formData.timezone} (IST, UTC+5:30)
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-900 text-sm font-medium">
                  Important
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  Messages will be sent automatically at the scheduled time.
                  Make sure the new date and time are correct.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate("/campaigns")}
                disabled={saving}
                className="px-6 py-3 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* What can be edited */}
        <div className="mt-6 bg-gray-100 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            What can be edited?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Campaign name and description</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Scheduled date and time (must be in the future)</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <span>
                Group, template, and recipients cannot be changed
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <span>
                Only scheduled campaigns can be edited
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;