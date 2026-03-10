// Pages/CreateCampaign.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  XCircle,
  Loader,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  Info,
  AlertCircle,
  ImageIcon,
  Upload,
  FolderOpen
} from "lucide-react";
import { 
  getUserGroups, 
  getUserTemplates, 
  createCampaign,
} from "../api/campaigns";

import { fetchWhatsappAccount } from "../api/waccount";

import { convertISTtoUTC, isFutureDateTime } from "../utils/timezoneHelper";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user } = useKindeAuth();

  console.log('🌐 Backend URL:', import.meta.env.VITE_BACKEND_URL);

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploadedMediaId, setUploadedMediaId] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [mediaSelectionMode, setMediaSelectionMode] = useState('upload'); // 'upload' or 'existing'
  const [existingMediaList, setExistingMediaList] = useState([]);
  const [loadingExistingMedia, setLoadingExistingMedia] = useState(false);

  // WhatsApp account
  const [whatsappAccount, setWhatsappAccount] = useState(null);

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

  /* =====================================
     LOAD WHATSAPP ACCOUNT
  ====================================== */
  useEffect(() => {
    const loadAccount = async () => {
      try {
        const res = await fetchWhatsappAccount(user.id);
        if (res?.data?.data) {
          setWhatsappAccount(res.data.data);
          setFormData(prev => ({ ...prev, account_id: res.data.data.wa_id }));
        }
      } catch (err) {
        console.error('Error loading account:', err);
      }
    };

    if (user?.id) {
      loadAccount();
    }
  }, [user?.id]);

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

  // Function to get template preview
  const getTemplatePreview = () => {
    if (!formData.wt_id) return null;
    
    const template = templates.find(t => t.wt_id === formData.wt_id);
    if (!template) return null;

    // Parse components
    let components = template.components;
    if (typeof components === 'string') {
      try {
        components = JSON.parse(components);
      } catch (e) {
        return null;
      }
    }

    // Parse preview (for template preview image)
    let preview = template.preview;
    if (typeof preview === 'string') {
      try {
        preview = JSON.parse(preview);
      } catch (e) {
        preview = null;
      }
    }

    const headerComp = components.find(c => c.type === 'HEADER');
    const bodyComp = components.find(c => c.type === 'BODY');
    const buttonsComp = components.find(c => c.type === 'BUTTONS');

    // Get template preview URL (the image used when creating template)
    const templatePreviewUrl = preview?.components?.find(c => c.type === 'HEADER')
      ?.example?.header_handle?.[0];

    return {
      header: headerComp,
      body: bodyComp,
      buttons: buttonsComp,
      hasMedia: headerComp && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format),
      mediaType: headerComp?.format,
      templatePreviewUrl, // ← The image from template creation
      preview,
    };
  };

  // Function to handle media upload
  const handleMediaUpload = async (file) => {
    try {
      setUploadingMedia(true);
      
      console.log('🔍 Checking template...', { selectedTemplate, formData });
      
      // Check if template is selected
      if (!selectedTemplate || !selectedTemplate.account_id) {
        alert('❌ Please select a template first');
        setUploadingMedia(false);
        return;
      }
      
      console.log('✅ Template found:', selectedTemplate.name);
      
      // Get WhatsApp account
      const accountRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/waccount/get-waccount?user_id=${user.id}`
      );
      const accountData = await accountRes.json();
      
      if (!accountData.success || !accountData.data) {
        alert('❌ WhatsApp account not found');
        setUploadingMedia(false);
        return;
      }
      
      const account = accountData.data;
      console.log('✅ WhatsApp account loaded');

      // Create FormData
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', file.type);
      formDataUpload.append('messaging_product', 'whatsapp');

      console.log('📤 Uploading to WhatsApp...');

      // Upload to WhatsApp
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${account.phone_number_id}/media`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${account.system_user_access_token}`,
          },
          body: formDataUpload,
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      const mediaId = data.id;
      console.log('✅ Media uploaded to WhatsApp:', mediaId);
      
      // Save to database
      const saveResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/upload`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: account.wa_id,
            media_id: mediaId,
            file_name: file.name,
            type: file.type,
            mime_type: file.type,
            size_bytes: file.size,
          }),
        }
      );

      const saveData = await saveResponse.json();
      
      if (!saveData.success) {
        throw new Error('Failed to save media to database');
      }

      console.log('✅ Media saved to database');

      // Set media preview
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);
      setUploadedMediaId(mediaId);
      setSelectedMedia({ id: mediaId, type: file.type, name: file.name });
      
      // Reload existing media list
      loadExistingMedia(account.wa_id);
      
      alert('✅ Media uploaded successfully!');
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('Failed to upload media: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Handle selecting existing media from dropdown
  const handleSelectExistingMediaItem = (media) => {
    setSelectedMedia({ 
      id: media.media_id, 
      type: media.type, 
      name: media.file_name 
    });
    setUploadedMediaId(media.media_id);
    
    // Try to show preview (you won't be able to show WhatsApp media directly)
    setMediaPreview(null); // Can't preview WhatsApp media IDs directly
    
    console.log('✅ Selected existing media:', media.file_name);
  };

  // Function to select existing media
  const handleSelectExistingMedia = async () => {
    try {
      if (!formData.account_id) {
        alert('Please select a template first');
        return;
      }

      // Fetch existing media
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/list?account_id=${formData.account_id}`
      );
      const data = await res.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        alert('No media found. Please upload media first.');
        return;
      }

      // For now, use the latest media (you can create a modal later)
      const media = data.data[0];
      setSelectedMedia({ 
        id: media.media_id, 
        type: media.type, 
        name: media.file_name 
      });
      setUploadedMediaId(media.media_id);
      
      // Try to create a preview if it's an image
      if (media.type && media.type.startsWith('image/')) {
        // Note: You can't directly preview WhatsApp media IDs
        // This is just a placeholder
        setMediaPreview(null); // Or show a placeholder image
      }
      
      alert(`✅ Selected media: ${media.file_name}`);
    } catch (err) {
      console.error('❌ Fetch media error:', err);
      alert('Failed to fetch media list');
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
    console.log('🎯 handleTemplateSelect called with wtId:', wtId);
    
    const template = templates.find(t => t.wt_id === wtId);
    
    console.log('📋 Found template:', template);
    console.log('📋 Template account_id:', template?.account_id);
    
    if (!template) {
      console.error('❌ Template not found for wtId:', wtId);
      return;
    }
    
    // Update formData
    setFormData(prev => ({ 
      ...prev, 
      wt_id: wtId,
      account_id: template.account_id
    }));
    
    // Update selectedTemplate - THIS IS CRUCIAL
    setSelectedTemplate(template);
    
    // Reset media
    setSelectedMedia(null);
    setUploadedMediaId(null);
    setMediaPreview(null);
    setMediaSelectionMode('upload');
    setError("");
    
    console.log('✅ Template selected, account_id:', template.account_id);
    
    // Load existing media IMMEDIATELY
    if (template.account_id) {
      console.log('📡 Loading media for account:', template.account_id);
      loadExistingMedia(template.account_id);
    } else {
      console.warn('⚠️ No account_id found in template');
    }
  };

  // Load existing media from database
  const loadExistingMedia = async (accountId) => {
    try {
      console.log('🔍 Loading existing media for account:', accountId);
      setLoadingExistingMedia(true);
      
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/media/list?account_id=${accountId}`;
      console.log('📡 Fetching from:', url);
      
      const res = await fetch(url);
      const data = await res.json();
      
      console.log('📦 Media API Response:', data);
      
      if (data.success && data.data) {
        setExistingMediaList(data.data);
        console.log('✅ Loaded existing media count:', data.data.length);
        console.log('📋 Media list:', data.data);
      } else {
        console.log('⚠️ No media data in response');
        setExistingMediaList([]);
      }
    } catch (err) {
      console.error('❌ Failed to load existing media:', err);
      setExistingMediaList([]);
    } finally {
      setLoadingExistingMedia(false);
    }
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
        
        // Check if template requires media
        const templatePreview = getTemplatePreview();
        if (templatePreview?.hasMedia && !uploadedMediaId) {
          setError(`Please upload or select ${templatePreview.mediaType} for this template`);
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

      default:
        return true;
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
        media_id: uploadedMediaId, // ← Include selected media ID
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

  /* =====================================
     TEMPLATE PREVIEW COMPONENT
  ====================================== */
  const TemplatePreviewComponent = () => {
    const preview = getTemplatePreview();
    if (!preview) return null;

    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const [mediaError, setMediaError] = useState(false);

    // Get template preview URL (from template creation)
    const templateMediaUrl = preview.templatePreviewUrl
      ? `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy-url?url=${encodeURIComponent(
          preview.templatePreviewUrl
        )}&user_id=${user.id}`
      : null;

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Template Preview
        </h3>

        <div className="bg-white rounded-lg p-4 border border-gray-300 max-w-md mx-auto">
          {/* Header - Template Preview Image */}
          {templateMediaUrl && (
            <div className="relative bg-gray-100 flex justify-center items-center mb-3">
              {isMediaLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center text-sm text-gray-500">
                  Loading preview...
                </div>
              )}

              {mediaError ? (
                <div className="p-6 text-gray-400 text-sm">
                  Failed to load template preview
                </div>
              ) : preview.mediaType === 'IMAGE' ? (
                <img
                  src={templateMediaUrl}
                  alt="Template header"
                  className="max-h-64 w-full object-contain rounded"
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => {
                    setMediaError(true);
                    setIsMediaLoading(false);
                  }}
                />
              ) : preview.mediaType === 'VIDEO' ? (
                <video
                  src={templateMediaUrl}
                  controls
                  className="w-full max-h-64 rounded"
                  onLoadedData={() => setIsMediaLoading(false)}
                  onError={() => {
                    setMediaError(true);
                    setIsMediaLoading(false);
                  }}
                />
              ) : null}
            </div>
          )}

          {/* Body Text */}
          {preview.body && (
            <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {preview.body.text}
            </div>
          )}

          {/* Buttons */}
          {preview.buttons?.buttons && (
            <div className="border-t mt-3">
              {preview.buttons.buttons.map((btn, i) => (
                <button
                  key={i}
                  className="w-full py-3 text-blue-600 font-medium hover:bg-blue-50 transition text-center"
                >
                  ➜ {btn.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            This is how the template was created. Below, you can select which media to actually send in this campaign.
          </p>
        </div>
      </div>
    );
  };

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Template <span className="text-red-500">*</span>
                  </label>
                  
                  {loadingTemplates ? (
                    <div className="text-gray-500">Loading templates...</div>
                  ) : templates.length === 0 ? (
                    <div className="text-gray-500">No approved templates found</div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {templates.map((template) => (
                        <label
                          key={template.wt_id}
                          className={`relative flex items-start p-4 border rounded-xl cursor-pointer transition-all ${
                            formData.wt_id === template.wt_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name="template"
                            value={template.wt_id}
                            checked={formData.wt_id === template.wt_id}
                            onChange={(e) => {
                              handleTemplateSelect(e.target.value);
                            }}
                            className="mt-1"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{template.name}</span>
                              <span className="text-xs text-gray-500">{template.language}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Template Preview */}
                {formData.wt_id && <TemplatePreviewComponent />}

                {/* Media Selection - Only show if template has media header */}
                {formData.wt_id && getTemplatePreview()?.hasMedia && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-yellow-600" />
                      Select Media to Send in Campaign
                    </h3>
                    
                    {/* Selected Media Display */}
                    {selectedMedia && (
                      <div className="mb-4 p-4 bg-white rounded-lg border border-gray-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">{selectedMedia.name}</p>
                              <p className="text-sm text-gray-600">Media ID: {selectedMedia.id}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMedia(null);
                              setUploadedMediaId(null);
                              setMediaPreview(null);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Show preview if available */}
                        {mediaPreview && (
                          <div className="mt-3">
                            <img 
                              src={mediaPreview} 
                              alt="Preview" 
                              className="max-w-full h-32 object-contain rounded border border-gray-200" 
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Media Selection Options */}
                    {!selectedMedia && (
                      <div className="space-y-4">
                        {/* Radio buttons for selection mode */}
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mediaMode"
                              value="upload"
                              checked={mediaSelectionMode === 'upload'}
                              onChange={(e) => setMediaSelectionMode(e.target.value)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Upload New Media</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="mediaMode"
                              value="existing"
                              checked={mediaSelectionMode === 'existing'}
                              onChange={(e) => setMediaSelectionMode(e.target.value)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm font-medium text-gray-700">Choose Existing Media</span>
                          </label>
                        </div>

                        {/* Upload New Media */}
                        {mediaSelectionMode === 'upload' && (
                          <div>
                            <label className="block w-full">
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-yellow-500 transition-all cursor-pointer">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-700 font-medium">Click to Upload</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {getTemplatePreview().mediaType === 'IMAGE' && 'PNG, JPG (Max 5MB)'}
                                  {getTemplatePreview().mediaType === 'VIDEO' && 'MP4 (Max 16MB)'}
                                  {getTemplatePreview().mediaType === 'DOCUMENT' && 'PDF (Max 100MB)'}
                                </p>
                                <input
                                  type="file"
                                  accept={
                                    getTemplatePreview().mediaType === 'IMAGE' ? 'image/*' :
                                    getTemplatePreview().mediaType === 'VIDEO' ? 'video/*' :
                                    'application/pdf'
                                  }
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleMediaUpload(e.target.files[0]);
                                    }
                                  }}
                                  className="hidden"
                                  disabled={uploadingMedia}
                                />
                              </div>
                            </label>
                          </div>
                        )}

                        {/* Choose Existing Media */}
                        {mediaSelectionMode === 'existing' && (
                          <div>
                            {loadingExistingMedia ? (
                              <div className="text-center py-4">
                                <Loader className="w-6 h-6 animate-spin mx-auto text-yellow-600" />
                                <p className="text-sm text-gray-600 mt-2">Loading media...</p>
                              </div>
                            ) : existingMediaList.length === 0 ? (
                              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl">
                                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-600 font-medium">No media found</p>
                                <p className="text-sm text-gray-500 mt-1">Upload media first to see them here</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {existingMediaList.map((media) => (
                                  <button
                                    key={media.wmu_id}
                                    type="button"
                                    onClick={() => handleSelectExistingMediaItem(media)}
                                    className="w-full p-4 bg-white border border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all text-left"
                                  >
                                    <div className="flex items-center gap-3">
                                      <ImageIcon className="w-5 h-5 text-gray-600" />
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{media.file_name}</p>
                                        <p className="text-xs text-gray-500">
                                          {media.type} • {new Date(media.uploaded_at).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {uploadingMedia && (
                          <div className="mt-4 text-center">
                            <Loader className="w-6 h-6 text-yellow-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-600 mt-2">Uploading media...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Time zone: Asia/Kolkata (IST, UTC+5:30)
                  </p>
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

                    {/* Media (if selected) */}
                    {uploadedMediaId && (
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Selected Media</p>
                          <p className="font-medium text-gray-900">{selectedMedia?.name}</p>
                          <p className="text-sm text-gray-500">Media ID: {selectedMedia?.id}</p>
                        </div>
                      </div>
                    )}

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