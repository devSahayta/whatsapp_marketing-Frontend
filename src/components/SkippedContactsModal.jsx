// components/SkippedContactsModal.jsx
//
// Shows exactly which rows were skipped during a group import, and why.
// Drop this in wherever you currently show the success toast in EventForm.jsx.

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {number} importedCount
 * @param {Array<{ row: number, name: string, phone: string, reason: string }>} skippedRows
 */
const SkippedContactsModal = ({
  open,
  onClose,
  importedCount,
  skippedRows = [],
}) => {
  if (!open || skippedRows.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: "white",
            borderRadius: "1rem",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            padding: "1.75rem",
            maxWidth: "520px",
            width: "90%",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <AlertTriangle
              size={26}
              color="#d97706"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Group created — {skippedRows.length} contact
                {skippedRows.length > 1 ? "s" : ""} skipped
              </h2>
              <p
                style={{
                  color: "#6b7280",
                  marginTop: "0.35rem",
                  marginBottom: 0,
                }}
              >
                {importedCount} contact{importedCount === 1 ? "" : "s"} imported
                successfully. The rows below had issues and were not added.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
              }}
              aria-label="Close"
            >
              <X size={20} color="#9ca3af" />
            </button>
          </div>

          <div
            style={{
              marginTop: "1rem",
              overflowY: "auto",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.875rem",
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: "0.5rem 0.25rem" }}>Row</th>
                  <th style={{ padding: "0.5rem 0.25rem" }}>Name</th>
                  <th style={{ padding: "0.5rem 0.25rem" }}>Phone</th>
                  <th style={{ padding: "0.5rem 0.25rem" }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {skippedRows.map((r) => (
                  <tr key={r.row} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.5rem 0.25rem", color: "#111827" }}>
                      {r.row}
                    </td>
                    <td style={{ padding: "0.5rem 0.25rem", color: "#111827" }}>
                      {r.name || "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.25rem", color: "#111827" }}>
                      {r.phone ?? "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.25rem", color: "#dc2626" }}>
                      {r.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="submit-button"
            style={{ marginTop: "1.25rem" }}
          >
            Got it
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SkippedContactsModal;
