import React from "react";
import { AlertTriangle, X, Zap, Bot } from "lucide-react";

export default function KeywordConflictModal({
  conflicts,
  flowName,
  onCancel,
  onConfirm,
  confirming = false,
}) {
  if (!conflicts?.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        backdropFilter: "blur(2px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "90%",
          maxWidth: 480,
          boxShadow: "0 24px 70px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "22px 24px 18px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div
            style={{
              background: "#fef3c7",
              borderRadius: 10,
              padding: 9,
              display: "flex",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={19} color="#d97706" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Keyword conflict detected
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12.5,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Activating <strong>{flowName || "this flow"}</strong> may cause
              unpredictable or broken replies.
            </p>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Conflict list */}
        <div
          style={{ padding: "16px 24px", maxHeight: 280, overflowY: "auto" }}
        >
          {conflicts.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 12px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 9,
                marginBottom: i < conflicts.length - 1 ? 8 : 0,
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {c.type === "flow_keyword_overlap" ? (
                  <Zap size={13} color="#d97706" />
                ) : (
                  <Bot size={13} color="#d97706" />
                )}
              </div>
              <div
                style={{ fontSize: 12.5, color: "#78350f", lineHeight: 1.6 }}
              >
                {c.type === "flow_keyword_overlap" ? (
                  <>
                    Shares keyword
                    {c.shared_keywords.length > 1 ? "s" : ""}{" "}
                    <strong>
                      {c.shared_keywords.map((k) => `"${k}"`).join(", ")}
                    </strong>{" "}
                    with active flow <strong>"{c.flow_name}"</strong>. Whichever
                    trigger matches first will fire — this is not guaranteed.
                  </>
                ) : (
                  <>
                    Keyword
                    {c.shared_keywords.length > 1 ? "s" : ""}{" "}
                    <strong>
                      {c.shared_keywords.map((k) => `"${k}"`).join(", ")}
                    </strong>{" "}
                    also appear in exit keywords for agent{" "}
                    <strong>"{c.agent_name}"</strong> — the agent will end the
                    conversation immediately instead of replying.
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            padding: "16px 24px 22px",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              background: "#fff",
              color: "#475569",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            style={{
              padding: "9px 18px",
              border: "none",
              borderRadius: 8,
              background: "#d97706",
              color: "#fff",
              cursor: confirming ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: confirming ? 0.7 : 1,
            }}
          >
            {confirming ? "Activating…" : "Activate Anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
