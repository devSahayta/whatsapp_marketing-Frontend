// Pages/CreateCampaign.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Users, 
  MessageSquare, 
  Calendar,
  FileText,
  Info,
  AlertCircle
} from "lucide-react";
import { 
  getUserGroups, 
  getUserTemplates, 
  createCampaign 
} from "../api/campaigns";

import { convertISTtoUTC, isFutureDateTime } from "../utils/timezoneHelper";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user } = useKindeAuth();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    campaign_name: "",
    description: "",
    group_id: "",
    wt_id: "",
    scheduled_at: "",
    timezone: "Asia/Kolkata",
    template_variables: {},
  });

  // Dropdown data
  const [groups, setGroups] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Selected items (for display)
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Load groups and templates
  useEffect(() => {
    if (user) {
      loadGroups();
      loadTemplates();
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await getUserGroups(user.id);
      setGroups(res.data.data || []);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await getUserTemplates(user.id);
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  // Handle group selection
  const handleGroupSelect = (groupId) => {
    setFormData(prev => ({ ...prev, group_id: groupId }));
    const group = groups.find(g => g.group_id === groupId);
    setSelectedGroup(group);
    setError("");
  };

  // Handle template selection
  const handleTemplateSelect = (wtId) => {
    setFormData(prev => ({ ...prev, wt_id: wtId }));
    const template = templates.find(t => t.wt_id === wtId);
    setSelectedTemplate(template);
    setError("");
  };

  // Validation for each step
  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.campaign_name.trim()) {
          setError("Campaign name is required");
          return false;
        }
        return true;

      case 2:
        if (!formData.group_id) {
          setError("Please select a contact group");
          return false;
        }
        return true;

      case 3:
        if (!formData.wt_id) {
          setError("Please select a template");
          return false;
        }
        if (!formData.scheduled_at) {
          setError("Please select date and time");
          return false;
        }

        if (!isFutureDateTime(formData.scheduled_at)) {
    setError("Scheduled time must be in the future");
    return false;
  }
  return true;
        // Check if scheduled time is in future
      //   const scheduledDate = new Date(formData.scheduled_at);
      //   const now = new Date();
      //   if (scheduledDate <= now) {
      //     setError("Scheduled time must be in the future");
      //     return false;
      //   }
      //   return true;

      // default:
      //   return true;
    }
  };

  // Next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
      setError("");
    }
  };

  // Previous step
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };

  // Submit campaign
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError("");

    // Convert IST to UTC before sending to backend
    const utcScheduledAt = convertISTtoUTC(formData.scheduled_at);

    const payload = {
      user_id: user.id,
      campaign_name: formData.campaign_name,
      description: formData.description,
      group_id: formData.group_id,
      wt_id: formData.wt_id,
      account_id: selectedTemplate?.account_id,
      scheduled_at: utcScheduledAt,  // ← UTC time
      timezone: "Asia/Kolkata",       // ← Still send timezone for reference
      template_variables: formData.template_variables,
    };

    console.log("Local time (IST):", formData.scheduled_at);
    console.log("Converted to UTC:", utcScheduledAt);

    const res = await createCampaign(payload);

    if (res.data.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/campaigns");
      }, 2000);
    }
  } catch (err) {
    setError(err.response?.data?.error || "Failed to create campaign");
    console.error("Create campaign error:", err);
  } finally {
    setLoading(false);
  }
};

  // Progress indicator
  const steps = [
    { number: 1, title: "Basic Details", icon: FileText },
    { number: 2, title: "Select Group", icon: Users },
    { number: 3, title: "Template & Schedule", icon: Calendar },
    { number: 4, title: "Review", icon: Check },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-600 mt-2">Schedule WhatsApp messages to your contacts</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                        ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                        ${isActive ? 'bg-blue-500 border-blue-500' : ''}
                        ${!isActive && !isCompleted ? 'bg-white border-gray-300' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon
                          className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-400'}`}
                        />
                      )}
                    </div>
                    <span
                      className={`
                        text-xs mt-2 font-medium text-center hidden sm:block
                        ${isActive ? 'text-blue-600' : ''}
                        ${isCompleted ? 'text-green-600' : ''}
                        ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                      `}
                    >
                      {step.title}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        h-0.5 flex-1 mx-2 transition-colors
                        ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'}
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
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
                <p className="text-green-600 text-sm">Campaign created successfully. Redirecting...</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
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
                  />
                </div>

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
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 text-sm font-medium">Quick Tip</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Choose a descriptive name to easily identify this campaign later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Group */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Contact Group <span className="text-red-500">*</span>
                  </label>

                  {loadingGroups ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-gray-600 mt-2">Loading groups...</p>
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No groups found</p>
                      <p className="text-gray-500 text-sm mt-1">Create a group first to continue</p>
                      <button
                        onClick={() => navigate("/groups")}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Group
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {groups.map((group) => (
                        <label
                          key={group.group_id}
                          className={`
                            block p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.group_id === group.group_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="group"
                              value={group.group_id}
                              checked={formData.group_id === group.group_id}
                              onChange={() => handleGroupSelect(group.group_id)}
                              className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{group.group_name}</p>
                              <p className="text-sm text-gray-500">
                                {group.contact_count} contact{group.contact_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Template & Schedule */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    WhatsApp Template <span className="text-red-500">*</span>
                  </label>

                  {loadingTemplates ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-gray-600 mt-2">Loading templates...</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">No templates found</p>
                      <p className="text-gray-500 text-sm mt-1">Create a template first to continue</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {templates.map((template) => (
                        <label
                          key={template.wt_id}
                          className={`
                            block p-4 border-2 rounded-xl cursor-pointer transition-all
                            ${formData.wt_id === template.wt_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="template"
                              value={template.wt_id}
                              checked={formData.wt_id === template.wt_id}
                              onChange={() => handleTemplateSelect(template.wt_id)}
                              className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{template.name}</p>
                              <p className="text-sm text-gray-500">
                                {template.category} • {template.language}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {template.status}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule Date & Time */}
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Schedule Date & Time <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Date & Time</label>
                      <input
                        type="datetime-local"
                        name="scheduled_at"
                        value={formData.scheduled_at}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Timezone</label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-900 text-sm font-medium">Important</p>
                      <p className="text-yellow-700 text-sm mt-1">
                        Messages will be sent automatically at the scheduled time. Make sure the date and time are correct.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Campaign</h3>

                  <div className="space-y-4">
                    {/* Campaign Name */}
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Campaign Name</p>
                        <p className="font-medium text-gray-900">{formData.campaign_name}</p>
                      </div>
                    </div>

                    {/* Description */}
                    {formData.description && (
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Description</p>
                          <p className="font-medium text-gray-900">{formData.description}</p>
                        </div>
                      </div>
                    )}

                    {/* Group */}
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Contact Group</p>
                        <p className="font-medium text-gray-900">{selectedGroup?.group_name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedGroup?.contact_count} recipient{selectedGroup?.contact_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Template */}
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Template</p>
                        <p className="font-medium text-gray-900">{selectedTemplate?.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedTemplate?.category} • {selectedTemplate?.language}
                        </p>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-start gap-3">
  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
  <div>
    <p className="text-sm text-gray-600">Scheduled For</p>
    <p className="font-medium text-gray-900">
      {new Date(formData.scheduled_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })} IST
    </p>
    <p className="text-sm text-gray-500">
      (Will be sent in India Standard Time)
    </p>
  </div>
</div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-900 text-sm font-medium">Ready to Schedule</p>
                    <p className="text-green-700 text-sm mt-1">
                      Your campaign will be sent automatically at the scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Campaign
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;