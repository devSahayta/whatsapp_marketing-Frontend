import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Type,
  Check,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Link2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/apiClient";
import { fetchIntegrationStatus } from "../api/integrations";
import {
  connectGoogle,
  fetchGoogleSheets,
  importFromGoogleSheet,
} from "../api/googleSheets";
import "../styles/form.css";

const INITIAL_FORM_DATA = {
  groupName: "",
  description: "",
  dataset: null,
  importSource: "csv",
  spreadsheetId: "",
};

const EventForm = ({ user }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [googleSheets, setGoogleSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [googleSheetsError, setGoogleSheetsError] = useState("");
  const [googleConnectLoading, setGoogleConnectLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [loadingIntegrationStatus, setLoadingIntegrationStatus] = useState(false);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (formData.importSource !== "google" || !user?.id) return;
    loadIntegrationStatus();
  }, [formData.importSource, user?.id]);

  useEffect(() => {
    if (formData.importSource !== "google" || !googleStatus?.connected) return;
    loadGoogleSheets();
  }, [formData.importSource, googleStatus?.connected]);

  const loadIntegrationStatus = async () => {
    setLoadingIntegrationStatus(true);
    setGoogleSheetsError("");

    try {
      const response = await fetchIntegrationStatus();
      const nextGoogleStatus = response?.data?.google || { connected: false };
      setGoogleStatus(nextGoogleStatus);

      if (!nextGoogleStatus.connected) {
        setGoogleSheets([]);
      }
    } catch (error) {
      setGoogleStatus({ connected: false });
      setGoogleSheets([]);
      setGoogleSheetsError(
        error?.response?.data?.error ||
          "Unable to check Google connection status right now.",
      );
    } finally {
      setLoadingIntegrationStatus(false);
    }
  };

  const loadGoogleSheets = async () => {
    if (!googleStatus?.connected) return;

    setLoadingSheets(true);
    setGoogleSheetsError("");

    try {
      const response = await fetchGoogleSheets();
      setGoogleSheets(response?.data?.sheets || []);
    } catch (error) {
      setGoogleSheets([]);
      setGoogleSheetsError(
        error?.response?.data?.error ||
          "Unable to load Google Sheets. Please connect Google and try again.",
      );
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImportSourceChange = (source) => {
    setSubmitStatus(null);
    setMessage("");
    setGoogleSheetsError("");
    setFormData((prev) => ({
      ...prev,
      importSource: source,
      dataset: source === "csv" ? prev.dataset : null,
      spreadsheetId:
        source === "google" && googleStatus?.connected ? prev.spreadsheetId : "",
    }));

    if (source !== "csv" && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      dataset: file,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setGoogleSheetsError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setGoogleConnectLoading(true);
      const response = await connectGoogle();
      const url = response?.data?.url;

      if (!url) {
        throw new Error("Google connect URL not found");
      }

      window.location.href = url;
    } catch (error) {
      setGoogleSheetsError(
        error?.response?.data?.error || "Failed to start Google connection.",
      );
    } finally {
      setGoogleConnectLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      if (!user?.id) {
        throw new Error("User not authenticated. Cannot create group.");
      }

      if (formData.importSource === "csv" && !formData.dataset) {
        throw new Error("Please upload a CSV file.");
      }

      if (formData.importSource === "google" && !formData.spreadsheetId) {
        throw new Error("Please select a Google Spreadsheet.");
      }

      if (formData.importSource === "google") {
        const importResponse = await importFromGoogleSheet({
          spreadsheetId: formData.spreadsheetId,
          group_name: formData.groupName,
          description: formData.description || "",
        });

        const importedCount = importResponse?.data?.count;
        const skippedRows = importResponse?.data?.skippedRows?.length || 0;

        setMessage(
          importedCount
            ? `Group created successfully! Imported ${importedCount} contacts${skippedRows ? ` and skipped ${skippedRows} invalid row${skippedRows > 1 ? "s" : ""}` : ""}.`
            : "Group created successfully and contacts were imported from Google Sheets.",
        );
      } else {
        const payload = new FormData();
        payload.append("user_id", user.id);
        payload.append("group_name", formData.groupName);
        payload.append("description", formData.description || "");
        payload.append("dataset", formData.dataset);

        await api.post("/api/groups", payload);
        setMessage("Group created successfully!");
      }

      setSubmitStatus("success");
      resetForm();

      setTimeout(() => {
        navigate("/groups");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error.message ||
          "Failed to create group. Please try again.",
      );
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
          <label className="form-label">
            <Upload size={20} />
            Import Contacts
          </label>

          <div className="import-source-grid">
            <button
              type="button"
              onClick={() => handleImportSourceChange("csv")}
              className={`import-source-card ${
                formData.importSource === "csv" ? "active" : ""
              }`}
            >
              <Upload size={18} />
              <div>
                <p>CSV Upload</p>
                <span>Upload a local CSV file</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleImportSourceChange("google")}
              className={`import-source-card ${
                formData.importSource === "google" ? "active" : ""
              }`}
            >
              <FileSpreadsheet size={18} />
              <div>
                <p>Google Spreadsheet</p>
                <span>Import directly from Google Sheets</span>
              </div>
            </button>
          </div>
        </div>

        <div className="form-group">
          <div className="upload-instructions">
            <p className="upload-note">
              Use these column headers in your file or sheet before import.
            </p>
            <div className="column-guide">
              <div className="column-guide-item">
                <span className="column-guide-label">Column 1</span>
                <strong>`name`</strong>
              </div>
              <div className="column-guide-item">
                <span className="column-guide-label">Column 2</span>
                <strong>`phoneno`</strong>
              </div>
              <div className="column-guide-item">
                <span className="column-guide-label">Column 3</span>
                <strong>`email`</strong>
                <span className="column-guide-optional">Optional</span>
              </div>
            </div>
          </div>
        </div>

        {formData.importSource === "csv" ? (
          <div className="form-group">
            <label htmlFor="dataset" className="form-label">
              <Upload size={20} />
              Upload Dataset (CSV)
            </label>
            <div className="upload-instructions">
              <p className="upload-note">
                Please upload your group list in the given format. You can
                download the sample template here.
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
              ref={fileInputRef}
              type="file"
              id="dataset"
              accept=".csv"
              onChange={handleFileChange}
              required={formData.importSource === "csv"}
              className="form-input file-input"
            />
            {formData.dataset && (
              <p className="file-info">Selected: {formData.dataset.name}</p>
            )}
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="spreadsheetId" className="form-label">
              <Link2 size={20} />
              Select Google Spreadsheet
            </label>

            <div className="upload-instructions">
              <p className="upload-note">
                Choose a connected Google Sheet that contains `name`,
                `phoneno`, and optional `email` columns in `Sheet1`.
              </p>
              <div className="integration-actions">
                {loadingIntegrationStatus ? (
                  <div className="field-note">Checking Google connection...</div>
                ) : googleStatus?.connected ? (
                  <>
                    <div className="connection-status-pill connected">
                      Connected
                      {googleStatus.email ? ` as ${googleStatus.email}` : ""}
                    </div>
                    <button
                      type="button"
                      onClick={loadGoogleSheets}
                      disabled={loadingSheets}
                      className="template-download-btn"
                    >
                      <RefreshCw
                        size={16}
                        className={loadingSheets ? "spin-icon" : ""}
                      />
                      {loadingSheets ? "Loading..." : "Refresh Sheets"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="connection-status-pill disconnected">
                      Google not connected
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={googleConnectLoading}
                      className="template-download-btn"
                    >
                      <Link2 size={16} />
                      {googleConnectLoading ? "Connecting..." : "Connect Google"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <select
              id="spreadsheetId"
              name="spreadsheetId"
              value={formData.spreadsheetId}
              onChange={handleInputChange}
              required={formData.importSource === "google"}
              className="form-input"
              disabled={
                loadingSheets ||
                loadingIntegrationStatus ||
                !googleStatus?.connected
              }
            >
              <option value="">
                {loadingIntegrationStatus
                  ? "Checking Google connection..."
                  : !googleStatus?.connected
                    ? "Connect Google to load spreadsheets"
                    : loadingSheets
                      ? "Loading spreadsheets..."
                      : "Select a spreadsheet"}
              </option>
              {googleSheets.map((sheet) => (
                <option key={sheet.id} value={sheet.id}>
                  {sheet.name}
                </option>
              ))}
            </select>

            {googleSheetsError && (
              <p className="field-note field-note-error">{googleSheetsError}</p>
            )}
            {!googleSheetsError &&
              googleStatus?.connected &&
              !loadingSheets &&
              googleSheets.length === 0 && (
              <p className="field-note">
                No Google spreadsheets found for this account yet.
              </p>
              )}
          </div>
        )}

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

      <AnimatePresence>
        {submitStatus === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 99999,
            }}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                padding: "2.5rem",
                textAlign: "center",
                maxWidth: "420px",
                width: "90%",
              }}
            >
              <Check
                size={48}
                color="#16a34a"
                style={{ margin: "0 auto 1rem" }}
              />
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  marginBottom: "0.5rem",
                  color: "#111827",
                }}
              >
                Group Created!
              </h2>
              <p style={{ color: "#6b7280", marginBottom: "1.25rem" }}>
                Redirecting to your group list in a few seconds...
              </p>
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
                style={{
                  height: "0.25rem",
                  background: "linear-gradient(to right, #000000, #4b5563)",
                  borderRadius: "9999px",
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
