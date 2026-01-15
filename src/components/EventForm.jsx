// components/EventForm.jsx
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
  // const [formData, setFormData] = useState({
  //   eventName: "",
  //   eventDate: "",
  //   dataset: null,
  // });

  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    eventType: "wedding",
    knowledgeBaseId: "",
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

  console.log({ formData });

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
        setMessage("User not authenticated. Cannot create event.");
        setIsSubmitting(false);
        return;
      }

      const payload = new FormData();
      payload.append("user_id", user.id);
      payload.append("event_name", formData.eventName);
      payload.append("event_date", formData.eventDate);
      payload.append("event_type", formData.eventType);
      payload.append("knowledge_base_id", formData.knowledgeBaseId);

      if (formData.dataset) {
        payload.append("dataset", formData.dataset);
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events`,
        {
          method: "POST",
          body: payload,
        }
      );

      if (!response.ok) throw new Error("Failed to create event");
      const data = await response.json();
      console.log("✅ Event created:", data);

      setSubmitStatus("success");
      setMessage("Event created successfully!");

      // Reset form
      setFormData({
        eventName: "",
        eventDate: "",
        dataset: null,
      });
      const fileInput = document.getElementById("dataset");
      if (fileInput) fileInput.value = "";

      // 🌈 Smooth delay before redirect
      setTimeout(() => {
        navigate("/events");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setMessage("Failed to create event. Please try again.");
      console.error("Error creating event:", error);
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
          <label htmlFor="eventName" className="form-label">
            <Type size={20} />
            Event Name
          </label>
          <input
            type="text"
            id="eventName"
            name="eventName"
            value={formData.eventName}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="Enter event name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="eventDate" className="form-label">
            <Calendar size={20} />
            Event Date
          </label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleInputChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Event Type</label>
          <select
            name="eventType"
            value={formData.eventType}
            onChange={handleInputChange}
            className="form-input"
          >
            <option value="wedding">Wedding</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Knowledge Base</label>
          <select
            name="knowledgeBaseId"
            value={formData.knowledgeBaseId}
            onChange={handleInputChange}
            required
            className="form-input"
          >
            <option value="">Select Knowledge Base</option>

            {knowledgeBases.map((kb) => (
              <option key={kb.id} value={kb.id}>
                {kb.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dataset" className="form-label">
            <Upload size={20} />
            Upload Dataset (CSV)
          </label>
          <div className="upload-instructions">
            <p className="upload-note">
              Please upload your RSVP list in the given format. You can download
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
          {isSubmitting ? "Creating Event..." : "Create Event"}
        </button>
      </form>

      {/* ✅ Smooth success popup */}
      <AnimatePresence>
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-10 text-center"
              style={{ maxWidth: 420 }}
            >
              <Check size={48} color="#16a34a" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Event Created </h2>
              <p className="text-gray-600">
                Redirecting to your event list in a few seconds...
              </p>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
                className="h-1 bg-gradient-to-r from-black to-gray-600 rounded-full mt-5"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventForm;
