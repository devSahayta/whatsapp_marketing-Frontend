// src/components/chatbot/NodePalette.jsx
// Left sidebar panel – drag items onto the canvas to create nodes

import React from "react";
import { NODE_META } from "./ChatbotNode";

const PALETTE_GROUPS = [
  {
    label: "TRIGGERS",
    // types: ["keyword_trigger", "api_trigger"],
    types: ["keyword_trigger"],
  },
  {
    label: "MESSAGES",
    types: ["send_message", "send_template"],
  },
  {
    label: "LOGIC",
    // types: ["wait_for_input", "condition", "http_request", "delay"],
    types: ["wait_for_input", "condition", "delay"],
  },
  {
    label: "ACTIONS",
    // types: ["ai_fallback", "handoff_to_agent", "end_flow", "trigger_campaign"],
    types: ["ai_fallback", "handoff_to_agent", "end_flow"],
  },
];

export default function NodePalette() {
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData("application/chatbot-node-type", nodeType);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      style={{
        width: 200,
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 0.8,
          }}
        >
          DRAG TO ADD
        </p>
      </div>

      <div style={{ padding: "10px 10px", flex: 1 }}>
        {PALETTE_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 18 }}>
            <p
              style={{
                margin: "0 0 6px 4px",
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: 1,
              }}
            >
              {group.label}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {group.types.map((type) => {
                const meta = NODE_META[type];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div
                    key={type}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      background: meta.bg,
                      borderRadius: 7,
                      cursor: "grab",
                      userSelect: "none",
                      border: `1px solid ${meta.color}33`,
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = `0 3px 8px ${meta.color}33`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    title={`Drag to add ${meta.label}`}
                  >
                    <div
                      style={{
                        background: meta.color,
                        borderRadius: 5,
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={11} color="#fff" />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#334155",
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
