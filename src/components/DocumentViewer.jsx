// src/components/DocumentViewer.jsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Eye, Loader2 } from "lucide-react";
import "../styles/DocumentViewer.css";
import { useParams } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const DocumentViewer = ({ onBack }) => {
  const { participantId } = useParams();
  const { getAccessToken, getToken, isAuthenticated } = useKindeAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("📄 Viewing documents for participant:", participantId);
  }, [participantId]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        // Get access token from Kinde SDK; try common function names
        let token = null;
        if (typeof getAccessToken === "function") {
          token = await getAccessToken();
        } else if (typeof getToken === "function") {
          token = await getToken();
        } else {
          token = localStorage.getItem("kindeAccessToken"); // fallback
        }

        if (!token) {
          throw new Error("No auth token found");
        }

        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/uploads/${participantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // show server error message if available
          const text = await response.text().catch(() => null);
          console.error("Fetch documents failed:", response.status, text);
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();
        setDocuments(data.uploads || []);
      } catch (err) {
        console.error(err);
        setError("Error fetching documents. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (participantId) fetchDocuments();
  }, [participantId, getAccessToken, getToken]);

 const handleViewDocument = async (filePath, upload_id) => {
  try {
    let token = null;
    if (typeof getAccessToken === "function") {
      token = await getAccessToken();
    } else if (typeof getToken === "function") {
      token = await getToken();
    }

    if (!token) {
      throw new Error("No auth token found");
    }

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/uploads/signed-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ upload_id, filePath }),
    });

    const data = await res.json();

    if (res.ok && data.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      console.error("Signed URL fetch failed:", data);
      alert(data.error || "Failed to fetch document URL");
    }
  } catch (err) {
    console.error("Signed URL fetch error:", err);
  }
};



  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  return (
    <div className="document-viewer">
      <div className="document-viewer-header">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="header-content">
          <h1>Document Viewer</h1>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <p>Loading documents...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <FileText size={48} />
          <h3>{error}</h3>
        </div>
      ) : (
        <div className="documents-container">
          {documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No documents uploaded yet</h3>
              <p>Documents will appear here once they are uploaded</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc.upload_id} className="document-card">
                  <div className="document-header">
                    <div className="document-icon">
                      <FileText size={24} />
                    </div>
                    <div className="document-info">
                      <h3 className="participant-name">
                        {doc.participant_relatives_name || "Self"}
                      </h3>
                      <p className="document-type">{doc.document_type}</p>
                    </div>
                  </div>

                  <div className="document-details">
                    <span className="role-badge">{doc.role}</span>
                  </div>

                  <div className="document-actions">
                    <button
                      className="view-document-btn"
                      onClick={() => handleViewDocument(doc.document_url, doc.upload_id)}


                    >
                      <Eye size={16} />
                      View Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
