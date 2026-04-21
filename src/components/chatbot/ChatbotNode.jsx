// src/components/chatbot/ChatbotNode.jsx
// Universal custom node rendered on the ReactFlow canvas

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Hash,
  Webhook,
  MessageSquare,
  FileText,
  Clock,
  GitBranch,
  Globe,
  Timer,
  Bot,
  UserCheck,
  XCircle,
  Megaphone,
  Sparkles,
} from "lucide-react";

export const NODE_META = {
  keyword_trigger: {
    label: "Keyword Trigger",
    icon: Hash,
    color: "#0ea5e9",
    bg: "#e0f2fe",
    category: "trigger",
  },
  api_trigger: {
    label: "API Trigger",
    icon: Webhook,
    color: "#6366f1",
    bg: "#eef2ff",
    category: "trigger",
  },
  send_message: {
    label: "Send Message",
    icon: MessageSquare,
    color: "#22c55e",
    bg: "#dcfce7",
    category: "message",
  },
  send_template: {
    label: "Send Template",
    icon: FileText,
    color: "#16a34a",
    bg: "#dcfce7",
    category: "message",
  },
  wait_for_input: {
    label: "Wait for Input",
    icon: Clock,
    color: "#f59e0b",
    bg: "#fef3c7",
    category: "logic",
  },
  condition: {
    label: "Condition",
    icon: GitBranch,
    color: "#f97316",
    bg: "#ffedd5",
    category: "logic",
  },
  http_request: {
    label: "HTTP Request",
    icon: Globe,
    color: "#8b5cf6",
    bg: "#ede9fe",
    category: "logic",
  },
  delay: {
    label: "Delay",
    icon: Timer,
    color: "#64748b",
    bg: "#f1f5f9",
    category: "logic",
  },
  ai_agent: {
    label: "AI Agent",
    icon: Sparkles,
    color: "#7c3aed",
    bg: "#ede9fe",
    category: "action",
  },
  ai_fallback: {
    label: "AI Fallback",
    icon: Bot,
    color: "#ec4899",
    bg: "#fce7f3",
    category: "action",
  },
  handoff_to_agent: {
    label: "Handoff to Agent",
    icon: UserCheck,
    color: "#f97316",
    bg: "#fff7ed",
    category: "action",
  },
  end_flow: {
    label: "End Flow",
    icon: XCircle,
    color: "#ef4444",
    bg: "#fee2e2",
    category: "action",
  },
  trigger_campaign: {
    label: "Trigger Campaign",
    icon: Megaphone,
    color: "#0ea5e9",
    bg: "#e0f2fe",
    category: "action",
  },
};

function getSummary(type, config) {
  if (!config) return null;
  switch (type) {
    case "keyword_trigger":
      return config.keywords?.length
        ? `Matches: ${config.keywords
            .slice(0, 3)
            .map((k) => `"${k}"`)
            .join(", ")}`
        : null;
    case "send_message":
      return config.text
        ? config.text.length > 50
          ? config.text.slice(0, 50) + "…"
          : config.text
        : null;
    case "wait_for_input":
      return config.save_as ? `Saves to: {{${config.save_as}}}` : null;
    case "condition":
      return config.variable
        ? `{{${config.variable}}} ${config.operator || "=="} "${config.value || ""}"`
        : null;
    case "http_request":
      return config.url
        ? `${config.method || "GET"} ${
            config.url.length > 30 ? "..." + config.url.slice(-25) : config.url
          }`
        : null;
    case "delay":
      return config.seconds ? `Wait ${config.seconds}s` : null;
    case "send_template": {
      if (!config.template_name) return null;
      const varCount = Object.keys(config.template_variable_map || {}).length;
      return varCount > 0
        ? `${config.template_name} · ${varCount} var${varCount > 1 ? "s" : ""}`
        : config.template_name;
    }
    case "ai_agent":
      return config.agent_name
        ? `Agent: ${config.agent_name}`
        : "No agent selected";
    case "ai_fallback":
      return config.fallback_message
        ? config.fallback_message.length > 50
          ? config.fallback_message.slice(0, 50) + "…"
          : config.fallback_message
        : null;
    default:
      return null;
  }
}

const ChatbotNode = memo(({ data, selected, type }) => {
  const meta = NODE_META[type] || {
    label: type,
    icon: MessageSquare,
    color: "#6b7280",
    bg: "#f3f4f6",
    category: "message",
  };

  const Icon = meta.icon;
  const isTrigger = meta.category === "trigger";
  const isEnd = type === "end_flow";
  const isCondition = type === "condition";
  const isAiAgent = type === "ai_agent";
  const summary = getSummary(type, data);

  return (
    <div
      style={{
        border: selected ? `2px solid ${meta.color}` : "1.5px solid #e2e8f0",
        borderRadius: 10,
        background: "#ffffff",
        minWidth: 200,
        maxWidth: 240,
        boxShadow: selected
          ? `0 0 0 3px ${meta.color}22`
          : "0 1px 4px rgba(0,0,0,0.08)",
        fontFamily: "inherit",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: meta.bg,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            background: meta.color,
            borderRadius: 6,
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={13} color="#fff" />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1e293b",
            flex: 1,
          }}
        >
          {data.label || meta.label}
        </span>
        {isTrigger && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              background: meta.color,
              color: "#fff",
              borderRadius: 3,
              padding: "2px 5px",
            }}
          >
            START
          </span>
        )}
        {isAiAgent && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              background: meta.color,
              color: "#fff",
              borderRadius: 3,
              padding: "2px 5px",
            }}
          >
            AI
          </span>
        )}
      </div>

      {/* Body */}
      {summary && (
        <div style={{ padding: "8px 12px" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: isAiAgent && !data.agent_name ? "#f97316" : "#64748b",
              lineHeight: 1.5,
              wordBreak: "break-word",
              fontStyle: isAiAgent && !data.agent_name ? "italic" : "normal",
            }}
          >
            {summary}
          </p>
        </div>
      )}

      {/* Condition YES/NO labels */}
      {isCondition && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 12px 8px",
          }}
        >
          <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>
            ✓ Yes
          </span>
          <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
            ✗ No
          </span>
        </div>
      )}

      {/* Handles */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: meta.color,
            width: 10,
            height: 10,
            border: "2px solid #fff",
          }}
        />
      )}

      {!isEnd && !isCondition && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: meta.color,
            width: 10,
            height: 10,
            border: "2px solid #fff",
          }}
        />
      )}

      {/* Condition — two named output handles */}
      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{
              background: "#22c55e",
              width: 10,
              height: 10,
              border: "2px solid #fff",
              left: "30%",
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{
              background: "#ef4444",
              width: 10,
              height: 10,
              border: "2px solid #fff",
              left: "70%",
            }}
          />
        </>
      )}
    </div>
  );
});

export default ChatbotNode;
