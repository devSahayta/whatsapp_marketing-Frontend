import React, { useState, useEffect } from 'react';
import { User, Users, Plane, Shield, Copy, Share, Plus, Trash2, Check, AlertCircle, X } from 'lucide-react';
import '../styles/document-form.css';
import { useParams } from 'react-router-dom';


const DocumentUploadForm = () => {

  const { participantId } = useParams();
  
  const [participants, setParticipants] = useState([]);
  const [existingUploads, setExistingUploads] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
   const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    primaryContact: {
      fullName: '',
      phone: '',
      email: '',
      role: 'Self'
    },
    travel: {
      groupTravelDoc: null,
      airportPickup: 'No'
    },
    primaryId: null,
    primaryIdType: 'ID Proof',
    consent: false
  });
  const [errors, setErrors] = useState({});
  const [participantErrors, setParticipantErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popup, setPopup] = useState({ show: false, type: 'info', title: '', message: '' });
  const [editMode, setEditMode] = useState({});
const [editingData, setEditingData] = useState({});

const [conversationData, setConversationData] = useState(null);
const [isEditingConversation, setIsEditingConversation] = useState(false);
const [conversationForm, setConversationForm] = useState({
  RSVP_table: '',
  number_of_guests: '',
  notes: ''
});


  // const participantId = "dc3eb413-e70d-4e0c-8174-52f506830b5d"; // Get this from URL params in real app
  const shareLink = `${import.meta.env.VITE_BACKEND_URL}/document-upload/${participantId}`;

  // Validation patterns
  const validationPatterns = {
    phone: /^(\+91|91)?[6789]\d{9}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    name: /^[a-zA-Z\s]{2,50}$/
  };

  // Document type options
  const documentTypes = [
    'ID Proof',
    'Travel Document',
    'Passport',
    'Driving License',
    'Voter ID',
    'Aadhaar Card',
    'Other'
  ];

  // Fetch existing uploads on component mount
  useEffect(() => {
    fetchExistingData();
      fetchConversationData();
  }, []);

  const fetchExistingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads/${participantId}`);
      
      if (response.ok) {
        const result = await response.json();
        const uploads = result.uploads || [];
        setExistingUploads(uploads);
        
        // Pre-populate form with existing data
        populateFormWithExistingData(uploads);
      } else if (response.status === 404) {
        // No existing data, which is fine for new forms
        console.log("No existing uploads found");
      } else {
        console.error("Error fetching data:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching existing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

 const fetchConversationData = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads/conversation/${participantId}`);
    if (response.ok) {
      const data = await response.json();
      setConversationData(data);
      setConversationForm({
        rsvp_status: data.rsvp_status || '',
        number_of_guests: data.number_of_guests || '',
        notes: data.notes || ''
      });
    } else {
      console.warn('No conversation data found for this participant');
    }
  } catch (error) {
    console.error('Error fetching conversation data:', error);
  }
};

// ✅ Handle form input changes
const handleConversationChange = (field, value) => {
  setConversationForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};

// ✅ Save conversation edit (no popup)
const saveConversationEdit = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads/conversation/${participantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversationForm),
    });

    if (response.ok) {
      // Just refresh and close edit mode (no popup)
      setIsEditingConversation(false);
      fetchConversationData();
    } else {
      console.error('Update failed: Unable to update conversation details.');
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
  }
};


  const populateFormWithExistingData = (uploads) => {
    if (!uploads || uploads.length === 0) {
      // Add one empty participant if no data exists
      addParticipant();
      return;
    }

    // Find primary contact (role = 'Self' or 'Family head' etc.)
    const primaryContact = uploads.find(upload => 
      ['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
    );

    // If primary contact exists, populate the form
    if (primaryContact) {
      setFormData(prev => ({
        ...prev,
        primaryContact: {
          ...prev.primaryContact,
          fullName: primaryContact.participant_relatives_name,
          role: primaryContact.role
        },
        primaryIdType: primaryContact.document_type,
        // Note: We can't populate the file itself, just show that it exists
      }));
    }

    // Get participants (exclude primary contact)
    const participantUploads = uploads.filter(upload => 
      !['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
    );

    // Convert uploads to participant format
    const existingParticipants = participantUploads.map((upload, index) => ({
      id: `existing-${upload.upload_id}`,
      fullName: upload.participant_relatives_name,
      relationship: getRoleToRelationship(upload.role),
      travelDoc: null, // Can't reconstruct file objects
      travelDocType: upload.document_type,
      idProof: null, // Can't reconstruct file objects  
      idProofType: upload.document_type,
      isExisting: true,
      uploadId: upload.upload_id,
      documentUrl: upload.document_url
    }));

    setParticipants(existingParticipants);

    // Always add one empty participant for new entries
    if (existingParticipants.length > 0) {
      addParticipant();
    }
  };

  // Helper function to convert role back to relationship
  const getRoleToRelationship = (role) => {
    const roleMapping = {
      'Guest': 'Spouse',
      'Employee': 'Employee', 
      'Colleague': 'Colleague'
    };
    return roleMapping[role] || 'Other';
  };

  // Popup functions
  const showPopup = (type, title, message) => {
    setPopup({ show: true, type, title, message });
  };

  const closePopup = () => {
    setPopup({ show: false, type: 'info', title: '', message: '' });
  };

  // Custom Popup Component
  const CustomPopup = ({ show, type, title, message, onClose }) => {
    if (!show) return null;

    const getPopupIcon = () => {
      switch (type) {
        case 'success': return <Check size={24} className="text-green-500" />;
        case 'error': return <AlertCircle size={24} className="text-red-500" />;
        case 'warning': return <AlertCircle size={24} className="text-yellow-500" />;
        default: return <AlertCircle size={24} className="text-blue-500" />;
      }
    };

    const getPopupClass = () => {
      switch (type) {
        case 'success': return 'popup-success';
        case 'error': return 'popup-error';
        case 'warning': return 'popup-warning';
        default: return 'popup-info';
      }
    };

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className={`popup-content ${getPopupClass()}`} onClick={(e) => e.stopPropagation()}>
          <div className="popup-header">
            {getPopupIcon()}
            <h3 className="popup-title">{title}</h3>
            <button className="popup-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="popup-body">
            <p className="popup-message">{message}</p>
          </div>
          <div className="popup-footer">
            <button className="popup-btn popup-btn-primary" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const addParticipant = () => {
    const newParticipant = {
      id: Date.now(),
      fullName: '',
      relationship: 'Spouse',
      travelDoc: null,
      travelDocType: 'Travel Document',
      idProof: null,
      idProofType: 'ID Proof',
      isExisting: false
    };
    setParticipants([...participants, newParticipant]);
  };

  const removeParticipant = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
    // Remove participant errors
    const newParticipantErrors = { ...participantErrors };
    delete newParticipantErrors[id];
    setParticipantErrors(newParticipantErrors);
  };

  const updateParticipant = (id, field, value) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
    
    // Clear participant errors when user updates
    if (participantErrors[id] && participantErrors[id][field]) {
      setParticipantErrors({
        ...participantErrors,
        [id]: {
          ...participantErrors[id],
          [field]: ''
        }
      });
    }
  };

  const handlePrimaryContactChange = (field, value) => {
    setFormData({
      ...formData,
      primaryContact: {
        ...formData.primaryContact,
        [field]: value
      }
    });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleTravelChange = (field, value) => {
    setFormData({
      ...formData,
      travel: {
        ...formData.travel,
        [field]: value
      }
    });
  };

  const handleFileChange = (file, maxSize = 5) => {
    if (!file) return null;
    
    // File size validation
    if (file.size > maxSize * 1024 * 1024) {
      showPopup('error', 'File Too Large', `File size must be less than ${maxSize}MB`);
      return null;
    }
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showPopup('error', 'Invalid File Type', 'Only JPG, PNG, and PDF files are allowed');
      return null;
    }
    
    return file;
  };

  // File removal functions
  const removePrimaryId = () => {
    setFormData({ ...formData, primaryId: null });
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"][data-field="primaryId"]');
    if (fileInput) fileInput.value = '';
  };

  const removeGroupTravelDoc = () => {
    setFormData({
      ...formData,
      travel: { ...formData.travel, groupTravelDoc: null }
    });
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"][data-field="groupTravelDoc"]');
    if (fileInput) fileInput.value = '';
  };

  const removeParticipantFile = (participantId, fileType) => {
    setParticipants(participants.map(p => 
      p.id === participantId 
        ? { ...p, [fileType]: null } 
        : p
    ));
    // Clear the file input
    const fileInput = document.querySelector(`input[type="file"][data-participant="${participantId}"][data-field="${fileType}"]`);
    if (fileInput) fileInput.value = '';
  };


  const enableEdit = (uploadId, currentData) => {
  setEditMode({ ...editMode, [uploadId]: true });
  setEditingData({
    ...editingData,
    [uploadId]: {
      fullName: currentData.participant_relatives_name,
      documentType: currentData.document_type,
      file: null,
      originalUrl: currentData.document_url
    }
  });
};

const cancelEdit = (uploadId) => {
  const newEditMode = { ...editMode };
  delete newEditMode[uploadId];
  setEditMode(newEditMode);
  
  const newEditingData = { ...editingData };
  delete newEditingData[uploadId];
  setEditingData(newEditingData);
};

const handleEditChange = (uploadId, field, value) => {
  setEditingData({
    ...editingData,
    [uploadId]: {
      ...editingData[uploadId],
      [field]: value
    }
  });
};

const saveEdit = async (uploadId) => {
  try {
    const payload = new FormData();
    payload.append('upload_id', uploadId);
    payload.append('full_name', editingData[uploadId].fullName);
    payload.append('document_type', editingData[uploadId].documentType);
    
    if (editingData[uploadId].file) {
      payload.append('file', editingData[uploadId].file);
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads/${uploadId}`, {
      method: 'PUT',
      body: payload,
    });

    if (response.ok) {
      showPopup('success', 'Update Successful', 'Document updated successfully!');
      cancelEdit(uploadId);
      fetchExistingData(); // Refresh data
    } else {
      const result = await response.json();
      showPopup('error', 'Update Failed', result.error || 'Failed to update document');
    }
  } catch (error) {
    console.error('Error updating document:', error);
    showPopup('error', 'Update Error', 'Something went wrong. Please try again.');
  }
};

  // Existing Document Display Component
  const ExistingDocumentDisplay = ({ documentUrl, participantName, documentType, uploadId, onEdit }) => {
  const isEditing = editMode[uploadId];
  
  if (isEditing) {
    return (
      <div className="existing-document editing">
        <div className="edit-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={editingData[uploadId]?.fullName || ''}
              onChange={(e) => handleEditChange(uploadId, 'fullName', e.target.value)}
              className="edit-input"
            />
          </div>
          
          <div className="form-group">
            <label>Document Type</label>
            <select
              value={editingData[uploadId]?.documentType || ''}
              onChange={(e) => handleEditChange(uploadId, 'documentType', e.target.value)}
              className="edit-input"
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Replace Document (Optional)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = handleFileChange(e.target.files[0]);
                if (file) {
                  handleEditChange(uploadId, 'file', file);
                }
              }}
              className="file-input"
            />
            {editingData[uploadId]?.file && (
              <span className="file-selected">✓ New file selected</span>
            )}
          </div>
          
          <div className="edit-actions">
            <button
              type="button"
              onClick={() => saveEdit(uploadId)}
              className="save-edit-btn"
            >
              <Check size={16} />
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => cancelEdit(uploadId)}
              className="cancel-edit-btn"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="existing-document">
      <div className="file-preview existing">
        <div className="file-info">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <span className="file-name">
              {participantName} - {documentType}
            </span>
            <span className="file-status">✓ Already uploaded</span>
          </div>
        </div>
        <div className="document-actions">
          <button 
            type="button" 
            onClick={() => window.open(documentUrl, '_blank')}
            className="view-btn"
            title="View document"
          >
            View
          </button>
          <button 
            type="button" 
            onClick={() => enableEdit(uploadId, { 
              participant_relatives_name: participantName, 
              document_type: documentType,
              document_url: documentUrl 
            })}
            className="edit-btn"
            title="Edit document"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

  // File display component
  const FileDisplay = ({ file, onRemove, fieldName }) => {
    if (!file) return null;

    const getFileIcon = (file) => {
      if (file.type === 'application/pdf') return '📄';
      if (file.type.startsWith('image/')) return '🖼️';
      return '📎';
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
      <div className="file-preview">
        <div className="file-info">
          <span className="file-icon">{getFileIcon(file)}</span>
          <div className="file-details">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{formatFileSize(file.size)}</span>
          </div>
        </div>
        <button 
          type="button" 
          onClick={onRemove}
          className="file-remove-btn"
          title="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const validatePrimaryContact = () => {
    const newErrors = {};
    const { fullName, phone, email } = formData.primaryContact;
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!validationPatterns.name.test(fullName.trim())) {
      newErrors.fullName = 'Name should only contain letters and be 2-50 characters long';
    }
    
    // Primary ID validation - only check if no existing primary contact
    const hasPrimaryContact = existingUploads.some(upload => 
      ['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
    );
    
    if (!formData.primaryId && !hasPrimaryContact) {
      newErrors.primaryId = 'Primary contact ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateParticipants = () => {
    const newParticipantErrors = {};
    let hasErrors = false;
    
    participants.forEach(participant => {
      const participantError = {};
      
      // Skip validation for existing participants unless they're being modified
      if (participant.isExisting) return;
      
      // Only validate if participant has any data filled
      const hasAnyData = participant.fullName || participant.travelDoc || participant.idProof;
      
      if (hasAnyData) {
        // Name validation for participants with data
        if (!participant.fullName.trim()) {
          participantError.fullName = 'Full name is required';
          hasErrors = true;
        } else if (!validationPatterns.name.test(participant.fullName.trim())) {
          participantError.fullName = 'Name should only contain letters and be 2-50 characters long';
          hasErrors = true;
        }
        
        // At least one document required if name is provided
        if (participant.fullName && !participant.travelDoc && !participant.idProof) {
          participantError.documents = 'At least one document (Travel Doc or ID Proof) is required';
          hasErrors = true;
        }
      }
      
      // If participant has documents but no name
      if ((participant.travelDoc || participant.idProof) && !participant.fullName.trim()) {
        participantError.fullName = 'Full name is required when uploading documents';
        hasErrors = true;
      }
      
      if (Object.keys(participantError).length > 0) {
        newParticipantErrors[participant.id] = participantError;
      }
    });
    
    setParticipantErrors(newParticipantErrors);
    return !hasErrors;
  };

  const validateForm = () => {
    const isPrimaryValid = validatePrimaryContact();
    const areParticipantsValid = validateParticipants();
    
    return isPrimaryValid && areParticipantsValid;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(`Hi! Please add your details for the event here: ${shareLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  // Helper function to determine participant role based on relationship
  const getParticipantRole = (relationship) => {
    const roleMapping = {
      'Spouse': 'Guest',
      'Child (Minor)': 'Guest',
      'Employee': 'Employee',
      'Colleague': 'Colleague',
      'Other': 'Guest'
    };
    return roleMapping[relationship] || 'Guest';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Validate form
    if (!validateForm()) {
      showPopup('warning', 'Validation Error', 'Please fix the validation errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if there are NEW participants to upload
      const newParticipants = participants.filter(p => 
        !p.isExisting && p.fullName && (p.travelDoc || p.idProof)
      );
      
      // Check if primary contact needs to be uploaded
      const needsPrimaryUpload = formData.primaryId && formData.primaryContact.fullName;
      const hasPrimaryContact = existingUploads.some(upload => 
        ['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
      );
      
      let payload = new FormData();
      
      if (newParticipants.length > 0 || (needsPrimaryUpload && !hasPrimaryContact)) {
        // BULK UPLOAD: Multiple members with files
        
        payload.append("participant_id", participantId);
        
        const allMembers = [];
        const filesToUpload = [];
        
        // Add primary contact if needed
        if (needsPrimaryUpload && !hasPrimaryContact) {
          allMembers.push({
            full_name: formData.primaryContact.fullName,
            role: formData.primaryContact.role,
            document_type: formData.primaryIdType
          });
          filesToUpload.push(formData.primaryId);
        }
        
        // Add new participants
        newParticipants.forEach(participant => {
          let documentType;
          let fileToUpload;
          
          if (participant.idProof) {
            documentType = participant.idProofType;
            fileToUpload = participant.idProof;
          } else if (participant.travelDoc) {
            documentType = participant.travelDocType;
            fileToUpload = participant.travelDoc;
          }

          if (fileToUpload) {
            allMembers.push({
              full_name: participant.fullName,
              role: getParticipantRole(participant.relationship),
              document_type: documentType
            });
            filesToUpload.push(fileToUpload);
          }
        });
        
        payload.append("members", JSON.stringify(allMembers));
        filesToUpload.forEach(file => {
          payload.append("files", file);
        });

        console.log("Bulk upload payload:");
        console.log("Members:", JSON.stringify(allMembers, null, 2));
        console.log("Files count:", filesToUpload.length);
        
      } else if (needsPrimaryUpload) {
        // SINGLE UPLOAD: Just primary contact
        payload.append("participant_id", participantId);
        payload.append("file", formData.primaryId);
        payload.append("full_name", formData.primaryContact.fullName);
        payload.append("role", formData.primaryContact.role);
        payload.append("document_type", formData.primaryIdType);

        console.log("Single upload payload:");
        console.log("participant_id:", participantId);
        console.log("full_name:", formData.primaryContact.fullName);
        console.log("role:", formData.primaryContact.role);
        console.log("document_type:", formData.primaryIdType);
      } else {
        showPopup('warning', 'No New Data', 'No new documents to upload. All data is already submitted.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads`, {
        method: "POST",
        body: payload,
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (response.ok) {
        showPopup('success', 'Upload Successful', `Document${newParticipants.length > 0 ? 's' : ''} uploaded successfully! We'll review your submission and get back to you soon.`);
        setTimeout(() => {
          setShowSuccess(true);
        }, 2000);
      } else {
        showPopup('error', 'Upload Failed', `Failed to save upload: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Submission error:", err);
      showPopup('error', 'Upload Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

    if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading RSVP data...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="success-icon">
            <Check size={48} />
          </div>
          <h2>Success!</h2>
          <p>Your documents have been uploaded successfully</p>
          <p className="success-subtitle">We'll review your submission and get back to you soon.</p>
        </div>
      </div>
    );
  }

  // Check if primary contact already exists
  const hasPrimaryContact = existingUploads.some(upload => 
    ['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
  );

  return (
    <div className="document-form-container">
      {/* Custom Popup */}
      <CustomPopup 
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />

      {/* Header */}
      <header className="form-header">
        <div className="header-content">
          <div className="brand-section">
            <Shield className="brand-icon" />
            <div>
              <h1>RSVP Document Upload</h1>
              <p>Secure document submission portal</p>
              {existingUploads.length > 0 && (
                <div className="existing-data-indicator">
                  <Check size={16} />
                  <span>{existingUploads.length} document{existingUploads.length > 1 ? 's' : ''} already uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="form-main">
        <form onSubmit={handleSubmit} className="upload-form">
          
          {/* Primary Contact Section */}
          <section className="form-section">
            <div className="section-header">
              <User className="section-icon" />
              <div>
                <h2>Primary Contact</h2>
                <p>
                  {hasPrimaryContact 
                    ? "Primary contact information already submitted" 
                    : "Please confirm your basic details for verification"
                  }
                </p>
              </div>
            </div>
            
           {hasPrimaryContact ? (
  <div className="existing-contact-info">
    {existingUploads
      .filter(upload => ['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role))
      .map(upload => (
        <ExistingDocumentDisplay
          key={upload.upload_id}
          uploadId={upload.upload_id}
          documentUrl={upload.document_url}
          participantName={upload.participant_relatives_name}
          documentType={upload.document_type}
          onEdit={enableEdit}
        />
      ))
    }
  </div>
) : (
              <>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      placeholder="e.g., Rohan Sharma"
                      value={formData.primaryContact.fullName}
                      onChange={(e) => handlePrimaryContactChange('fullName', e.target.value)}
                      className={errors.fullName ? 'error' : ''}
                    />
                    {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      value={formData.primaryContact.role}
                      onChange={(e) => handlePrimaryContactChange('role', e.target.value)}
                    >
                      <option value="Self">Self</option>
                      <option value="Family head">Family head</option>
                      <option value="Manager / Team lead">Manager / Team lead</option>
                      <option value="Assistant / Coordinator">Assistant / Coordinator</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-hint">
                  <AlertCircle size={16} />
                  Only used for check-in & hotel verification
                </div>

                {/* ID for Primary Contact */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Document Type *</label>
                    <select
                      value={formData.primaryIdType}
                      onChange={(e) => setFormData({ ...formData, primaryIdType: e.target.value })}
                    >
                      {documentTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Upload ID (PDF/JPG/PNG) *</label>
                  {formData.primaryId ? (
                    <FileDisplay 
                      file={formData.primaryId}
                      onRemove={removePrimaryId}
                      fieldName="primaryId"
                    />
                  ) : (
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      data-field="primaryId"
                      onChange={(e) => {
                        const file = handleFileChange(e.target.files[0]);
                        setFormData({ ...formData, primaryId: file });
                        if (errors.primaryId) {
                          setErrors({ ...errors, primaryId: '' });
                        }
                      }}
                      className={`file-input ${errors.primaryId ? 'error' : ''}`}
                    />
                  )}
                  {errors.primaryId && <span className="error-text">{errors.primaryId}</span>}
                </div>
              </>
            )}
          </section>

          {/* Conversation Details Section */}
<section className="form-section">
  <div className="section-header">
    <Users className="section-icon" />
    <div>
      <h2>Conversation Details</h2>
      <p>View or update RSVP and guest details</p>
    </div>
  </div>

  {conversationData ? (
    <div className="conversation-details">
      {isEditingConversation ? (
        <div className="edit-conversation-form">
          <div className="form-grid">
            <div className="form-group">
  <label>RSVP Status</label>
  <select
    value={conversationForm.rsvp_status || ""}
    onChange={(e) => handleConversationChange("rsvp_status", e.target.value)}
  >
    <option value="" disabled>Select RSVP status</option>
    <option value="Yes">Yes</option>
    <option value="No">No</option>
    <option value="Maybe">Maybe</option>
  </select>
</div>

            <div className="form-group">
              <label>Number of Guests</label>
              <input
                type="number"
                value={conversationForm.number_of_guests}
                onChange={(e) => handleConversationChange('number_of_guests', e.target.value)}
                placeholder="e.g., 2"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={conversationForm.notes}
              onChange={(e) => handleConversationChange('notes', e.target.value)}
              placeholder="Additional notes or preferences"
            />
          </div>
          <div className="edit-actions">
            <button type="button" className="save-edit-btn" onClick={saveConversationEdit}>
              <Check size={16} /> Save
            </button>
            <button type="button" className="cancel-edit-btn" onClick={() => setIsEditingConversation(false)}>
              <X size={16} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="conversation-view">
          <p><strong>RSVP Status:</strong> {conversationData.rsvp_status || 'Not provided'}</p>
          <p><strong>Number of Guests:</strong> {conversationData.number_of_guests || 'Not provided'}</p>
          <p><strong>Notes:</strong> {conversationData.notes || 'No notes added'}</p>
          <button
            type="button"
            className="edit-btn"
            onClick={() => setIsEditingConversation(true)}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  ) : (
    <p className="no-data">No conversation details found for this participant.</p>
  )}
</section>


          {/* Travel Section */}
          <section className="form-section">
            <div className="section-header">
              <Plane className="section-icon" />
              <div>
                <h2>Travel (Optional)</h2>
                <p>Upload group travel documents or specify pickup requirements</p>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Group Travel Document</label>
                {formData.travel.groupTravelDoc ? (
                  <FileDisplay 
                    file={formData.travel.groupTravelDoc}
                    onRemove={removeGroupTravelDoc}
                    fieldName="groupTravelDoc"
                  />
                ) : (
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    data-field="groupTravelDoc"
                    onChange={(e) => {
                      const file = handleFileChange(e.target.files[0]);
                      handleTravelChange('groupTravelDoc', file);
                    }}
                    className="file-input"
                  />
                )}
              </div>
              
              <div className="form-group">
                <label>Airport Pickup Needed?</label>
                <select
                  value={formData.travel.airportPickup}
                  onChange={(e) => handleTravelChange('airportPickup', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          </section>

          {/* Participants Section */}
          <section className="form-section">
            <div className="section-header">
              <Users className="section-icon" />
              <div>
                <h2>Participants</h2>
                <p>Family members or team members</p>
                {existingUploads.filter(upload => 
                  !['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
                ).length > 0 && (
                  <span className="existing-count">
                    {existingUploads.filter(upload => 
                      !['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
                    ).length} existing participant{existingUploads.filter(upload => 
                      !['Self', 'Family head', 'Manager / Team lead', 'Assistant / Coordinator'].includes(upload.role)
                    ).length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={addParticipant}
                className="add-participant-btn"
              >
                <Plus size={16} />
                Add Participant
              </button>
            </div>

            {/* Share Link */}
            <div className="share-section">
              <p className="share-label">Or share a self-fill link:</p>
              <div className="share-controls">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="share-input"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="copy-btn"
                >
                  <Copy size={16} />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="whatsapp-btn"
                >
                  <Share size={16} />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Participants List */}
            <div className="participants-list">
              {participants.map((participant, index) => (
                <div key={participant.id} className="participant-card">
                  <div className="participant-header">
                    <span className="participant-label">
                      {participant.isExisting ? (
                        <>
                          <Check size={16} className="existing-icon" />
                          Participant {index + 1} (Already uploaded)
                        </>
                      ) : (
                        `Participant ${index + 1}`
                      )}
                    </span>
                    {!participant.isExisting && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(participant.id)}
                        className="remove-btn"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {participant.isExisting ? (
                    // Display existing participant data
                    <div className="existing-participant">
                      <div className="participant-info">
                        <h4>{participant.fullName}</h4>
                        <p>Role: {participant.relationship}</p>
                      </div>
                      <ExistingDocumentDisplay
                        documentUrl={participant.documentUrl}
                        participantName={participant.fullName}
                        documentType={participant.travelDocType || participant.idProofType}
                      />
                    </div>
                  ) : (
                    // New participant form
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Priya Sharma"
                          value={participant.fullName}
                          onChange={(e) => updateParticipant(participant.id, 'fullName', e.target.value)}
                          className={participantErrors[participant.id]?.fullName ? 'error' : ''}
                        />
                        {participantErrors[participant.id]?.fullName && 
                          <span className="error-text">{participantErrors[participant.id].fullName}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label>Relationship / Role</label>
                        <select
                          value={participant.relationship}
                          onChange={(e) => updateParticipant(participant.id, 'relationship', e.target.value)}
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Child (Minor)">Child (Minor)</option>
                          <option value="Employee">Employee</option>
                          <option value="Colleague">Colleague</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Travel Document Type</label>
                        <select
                          value={participant.travelDocType}
                          onChange={(e) => updateParticipant(participant.id, 'travelDocType', e.target.value)}
                        >
                          {documentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Travel Document (PDF/JPG/PNG)</label>
                        {participant.travelDoc ? (
                          <FileDisplay 
                            file={participant.travelDoc}
                            onRemove={() => removeParticipantFile(participant.id, 'travelDoc')}
                            fieldName="travelDoc"
                          />
                        ) : (
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            data-participant={participant.id}
                            data-field="travelDoc"
                            onChange={(e) => {
                              const file = handleFileChange(e.target.files[0]);
                              updateParticipant(participant.id, 'travelDoc', file);
                            }}
                            className="file-input"
                          />
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>ID Proof Type</label>
                        <select
                          value={participant.idProofType}
                          onChange={(e) => updateParticipant(participant.id, 'idProofType', e.target.value)}
                        >
                          {documentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>ID Proof (PDF/JPG/PNG)</label>
                        {participant.idProof ? (
                          <FileDisplay 
                            file={participant.idProof}
                            onRemove={() => removeParticipantFile(participant.id, 'idProof')}
                            fieldName="idProof"
                          />
                        ) : (
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            data-participant={participant.id}
                            data-field="idProof"
                            onChange={(e) => {
                              const file = handleFileChange(e.target.files[0]);
                              updateParticipant(participant.id, 'idProof', file);
                            }}
                            className="file-input"
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {!participant.isExisting && participantErrors[participant.id]?.documents && 
                    <div className="error-text" style={{marginTop: '10px'}}>
                      {participantErrors[participant.id].documents}
                    </div>}
                </div>
              ))}
            </div>
          </section>

        </form>
      </main>

      {/* Sticky Footer */}
      <footer className="sticky-footer">
        <div className="footer-content">
          <div className="footer-info">
            {existingUploads.length > 0 && (
              <span className="upload-status">
                ✓ {existingUploads.length} document{existingUploads.length > 1 ? 's' : ''} already uploaded
              </span>
            )}
          </div>
          
          <div className="footer-actions">
            <button 
              type="submit" 
              onClick={handleSubmit} 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Documents'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DocumentUploadForm;