// components/GroupForm.jsx
import React, { useEffect, useState } from "react";
import {
  Upload,
  Calendar,
  Type,
  Check,
  AlertCircle,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchKnowledgeBases } from "../api/knowledgeBases";
import "../styles/form.css";

const EventForm = ({ user }) => {
  const [formData, setFormData] = useState({
    groupName: "",
    description: "",
    dataset: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    fetchKnowledgeBases(user.id)
      .then((res) => setKnowledgeBases(res.data))
      .catch((err) => console.error("Failed to load KBs", err));
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      dataset: file,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      if (!user?.id) {
        setSubmitStatus("error");
        setMessage("User not authenticated. Cannot create group.");
        setIsSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append("user_id", user.id);
      payload.append("group_name", formData.groupName);
      payload.append("description", formData.description || "");

      if (formData.dataset) {
        payload.append("dataset", formData.dataset);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups`,
        {
          method: "POST",
          body: payload,
        }
      );

      if (!response.ok) throw new Error("Failed to create group");
      const data = await response.json();
      console.log("✅ Group created:", data);

      setSubmitStatus("success");
      setMessage("Group created successfully!");

      // Reset form
      setFormData({
        groupName: "",
        description: "",
        dataset: null,
      });

      const fileInput = document.getElementById("dataset");
      if (fileInput) fileInput.value = "";

      // Smooth delay before redirect
      setTimeout(() => {
        navigate("/groups");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setMessage("Failed to create group. Please try again.");
      console.error("Error creating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href =
      "https://docs.google.com/spreadsheets/d/1FGZaAMEMNjG_8iwyUnlLdC5-BiDQrcosprs6awrADQo/export?format=csv";
    link.download = "RSVP_Mockup_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="event-form">
        <div className="form-group">
          <label htmlFor="groupName" className="form-label">
            <Type size={20} />
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            name="groupName"
            value={formData.groupName}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="Enter campaign group name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            <Type size={20} />
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="Enter group description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataset" className="form-label">
            <Upload size={20} />
            Upload Dataset (CSV)
          </label>
          <div className="upload-instructions">
            <p className="upload-note">
              Please upload your group list in the given format. You can download
              the sample template here.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="template-download-btn"
            >
              <Download size={16} />
              Download Sample Template
            </button>
          </div>
          <input
            type="file"
            id="dataset"
            accept=".csv"
            onChange={handleFileChange}
            required
            className="form-input file-input"
          />
          {formData.dataset && (
            <p className="file-info">Selected: {formData.dataset.name}</p>
          )}
        </div>

        <AnimatePresence>
          {submitStatus && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className={`status-message ${submitStatus}`}
            >
              {submitStatus === "success" ? (
                <Check size={22} color="#16a34a" />
              ) : (
                <AlertCircle size={22} color="#dc2626" />
              )}
              <span>{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? "Creating Group..." : "Create Group"}
        </button>
      </form>

      {/* Success popup - with proper z-index */}
      <AnimatePresence>
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999, // Very high z-index to be above everything
            }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '2.5rem',
                textAlign: 'center',
                maxWidth: '420px',
                width: '90%',
              }}
            >
              <Check size={48} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem', color: '#111827' }}>
                Group Created!
              </h2>
              <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
                Redirecting to your group list in a few seconds...
              </p>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
                style={{
                  height: '0.25rem',
                  background: 'linear-gradient(to right, #000000, #4b5563)',
                  borderRadius: '9999px',
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventForm;