// src/pages/TestAgent.jsx
// Test an agent in isolation — chat window with usage stats

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
  Pencil,
  Sparkles,
  Cpu,
  MessageSquare,
  Zap,
  AlertTriangle,
  Info,
} from "lucide-react";

import { showError } from "../utils/toast";
import { getAgentById, testAgent } from "../api/agents";

const MODEL_LABEL = {
  "claude-haiku-4-5-20251001": "Haiku",
  "claude-sonnet-4-6": "Sonnet",
  "claude-opus-4-6": "Opus",
};

const MODEL_COLOR = {
  "claude-haiku-4-5-20251001": "#0ea5e9",
  "claude-sonnet-4-6": "#8b5cf6",
  "claude-opus-4-6": "#f59e0b",
};

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        alignItems: "center",
        padding: "4px 2px",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#94a3b8",
            display: "inline-block",
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        gap: 8,
        marginBottom: 14,
        animation: "slideIn 0.2s ease",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          <Bot size={14} color="#fff" />
        </div>
      )}

      <div
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser
            ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
            : "#fff",
          color: isUser ? "#fff" : "#1e293b",
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: isUser
            ? "0 2px 8px #0ea5e930"
            : "0 1px 4px rgba(0,0,0,0.08)",
          border: isUser ? "none" : "1px solid #f1f5f9",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
        {msg.tokens && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: "1px solid rgba(255,255,255,0.2)",
              fontSize: 10,
              opacity: 0.7,
              display: "flex",
              gap: 8,
            }}
          >
            <span>↑ {msg.tokens.input_tokens}</span>
            <span>↓ {msg.tokens.output_tokens}</span>
          </div>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            border: "1.5px solid #e2e8f0",
          }}
        >
          <User size={14} color="#64748b" />
        </div>
      )}
    </div>
  );
}

export default function TestAgent() {
  const navigate = useNavigate();
  const { agent_id } = useParams();

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [totalTokens, setTotalTokens] = useState({ input: 0, output: 0 });
  const [turnCount, setTurnCount] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!agent_id) return;
    getAgentById(agent_id)
      .then((res) => setAgent(res.data.agent))
      .catch(() => showError("Failed to load agent"))
      .finally(() => setLoading(false));
  }, [agent_id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setHistory((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    // Add typing indicator
    setMessages((prev) => [...prev, { role: "typing" }]);

    try {
      const res = await testAgent(agent_id, text, history);
      const { reply, updated_history, usage } = res.data;

      setMessages((prev) => {
        // Remove typing indicator
        const withoutTyping = prev.filter((m) => m.role !== "typing");
        return [
          ...withoutTyping,
          {
            role: "assistant",
            content: reply,
            tokens: usage,
          },
        ];
      });

      setHistory(updated_history);
      setTurnCount((c) => c + 1);
      if (usage) {
        setTotalTokens((t) => ({
          input: t.input + (usage.input_tokens || 0),
          output: t.output + (usage.output_tokens || 0),
        }));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.role !== "typing"));
      const errMsg = err?.response?.data?.error || "Failed to get response";
      setMessages((prev) => [...prev, { role: "error", content: errMsg }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setHistory([]);
    setTurnCount(0);
    setTotalTokens({ input: 0, output: 0 });
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div
        style={{
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#94a3b8",
        }}
      >
        <Loader2
          size={24}
          color="#0ea5e9"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <span>Loading agent…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const turnLimitWarning =
    agent && turnCount >= agent.max_turns * 0.8 && turnCount < agent.max_turns;
  const turnLimitReached = agent && turnCount >= agent.max_turns;
  const modelColor = MODEL_COLOR[agent?.model] || "#0ea5e9";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .send-btn:hover:not(:disabled) { background: #0284c7 !important; transform: scale(1.05); }
        .send-btn:active:not(:disabled) { transform: scale(0.97); }
        .reset-btn:hover { background: #f1f5f9 !important; }

        @media (max-width: 768px) {
          .test-layout { flex-direction: column !important; }
          .test-sidebar { width: 100% !important; max-height: 200px !important; overflow-y: auto; border-right: none !important; border-bottom: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1e293b",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid #334155",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/agents")}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={14} /> Agents
        </button>

        <div style={{ width: 1, height: 18, background: "#334155" }} />

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${modelColor}30, ${modelColor}10)`,
              borderRadius: 7,
              padding: 5,
              display: "flex",
              border: `1px solid ${modelColor}30`,
            }}
          >
            <Sparkles size={13} color={modelColor} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#f1f5f9",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {agent?.name}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>
              Test Mode
            </p>
          </div>
        </div>

        {/* Model badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: `${modelColor}20`,
            color: modelColor,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <Cpu size={9} />
          {MODEL_LABEL[agent?.model] || agent?.model}
        </span>

        {/* Reset */}
        <button
          className="reset-btn"
          onClick={handleReset}
          title="Reset conversation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            background: "rgba(255,255,255,0.07)",
            color: "#94a3b8",
            border: "1px solid #334155",
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.15s",
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>

        {/* Edit */}
        <button
          onClick={() => navigate(`/agents/${agent_id}/edit`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 10px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Pencil size={11} /> Edit
        </button>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div
        className="test-layout"
        style={{ display: "flex", flex: 1, overflow: "hidden" }}
      >
        {/* ── Sidebar — agent info ─────────────────────────────────────────── */}
        <div
          className="test-sidebar"
          style={{
            width: 260,
            flexShrink: 0,
            borderRight: "1px solid #e2e8f0",
            background: "#fff",
            overflowY: "auto",
            padding: "18px 16px",
          }}
        >
          {/* Stats */}
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 10,
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: 0.8,
            }}
          >
            SESSION STATS
          </p>

          {[
            {
              label: "Turns",
              value: `${turnCount} / ${agent?.max_turns}`,
              icon: MessageSquare,
              color:
                turnCount >= agent?.max_turns
                  ? "#ef4444"
                  : turnCount >= agent?.max_turns * 0.8
                    ? "#f59e0b"
                    : "#22c55e",
            },
            {
              label: "Tokens In",
              value: totalTokens.input.toLocaleString(),
              icon: Zap,
              color: "#0ea5e9",
            },
            {
              label: "Tokens Out",
              value: totalTokens.output.toLocaleString(),
              icon: Zap,
              color: "#8b5cf6",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 11px",
                background: `${stat.color}10`,
                borderRadius: 9,
                marginBottom: 8,
                border: `1px solid ${stat.color}20`,
              }}
            >
              <stat.icon size={13} color={stat.color} />
              <div>
                <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                  {stat.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 800,
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          ))}

          {/* Turn progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                height: 5,
                background: "#f1f5f9",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(
                    (turnCount / (agent?.max_turns || 10)) * 100,
                    100,
                  )}%`,
                  background:
                    turnCount >= agent?.max_turns
                      ? "#ef4444"
                      : turnCount >= (agent?.max_turns || 10) * 0.8
                        ? "#f59e0b"
                        : "#22c55e",
                  borderRadius: 4,
                  transition: "width 0.4s, background 0.4s",
                }}
              />
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: "#f1f5f9",
              margin: "4px 0 16px",
            }}
          />

          {/* Agent config */}
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 10,
              fontWeight: 800,
              color: "#94a3b8",
              letterSpacing: 0.8,
            }}
          >
            AGENT CONFIG
          </p>

          {[
            {
              label: "Model",
              value: MODEL_LABEL[agent?.model] || agent?.model,
            },
            {
              label: "Temperature",
              value: parseFloat(agent?.temperature).toFixed(1),
            },
            { label: "Max Turns", value: agent?.max_turns },
            {
              label: "Fallback",
              value:
                agent?.fallback_action === "handoff_to_agent"
                  ? "Handoff"
                  : "End Flow",
            },
            {
              label: "Exit Keywords",
              value:
                agent?.exit_keywords?.length > 0
                  ? agent.exit_keywords.join(", ")
                  : "None",
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: "5px 0",
                borderBottom: "1px solid #f8fafc",
              }}
            >
              <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>
                {row.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontWeight: 600,
                  textAlign: "right",
                  wordBreak: "break-word",
                }}
              >
                {String(row.value)}
              </span>
            </div>
          ))}

          {/* System prompt preview */}
          {agent?.system_prompt && (
            <>
              <div
                style={{
                  height: 1,
                  background: "#f1f5f9",
                  margin: "14px 0 12px",
                }}
              />
              <p
                style={{
                  margin: "0 0 7px",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#94a3b8",
                  letterSpacing: 0.8,
                }}
              >
                SYSTEM PROMPT
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "#64748b",
                  lineHeight: 1.6,
                  background: "#f8fafc",
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "1px solid #f1f5f9",
                  maxHeight: 140,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {agent.system_prompt}
              </p>
            </>
          )}
        </div>

        {/* ── Chat area ────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#f8fafc",
          }}
        >
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 20px 8px",
            }}
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  animation: "fadeIn 0.4s ease",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    boxShadow: "0 6px 20px #0ea5e930",
                  }}
                >
                  <Bot size={28} color="#fff" />
                </div>
                <p
                  style={{
                    margin: "0 0 5px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {agent?.name}
                </p>
                <p
                  style={{
                    margin: "0 0 18px",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  {agent?.description ||
                    "Send a message to start testing this agent"}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    padding: "8px 14px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  <Info size={12} color="#94a3b8" />
                  Token usage shown on each AI reply
                </div>
              </div>
            )}

            {/* Turn limit warnings */}
            {turnLimitWarning && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "9px 13px",
                  background: "#fef9c3",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <AlertTriangle
                  size={13}
                  color="#d97706"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p style={{ margin: 0, fontSize: 11, color: "#92400e" }}>
                  Approaching turn limit ({turnCount}/{agent?.max_turns}). The
                  agent will{" "}
                  {agent?.fallback_action === "handoff_to_agent"
                    ? "handoff to a human agent"
                    : "end the flow"}{" "}
                  after {agent?.max_turns - turnCount} more turn
                  {agent?.max_turns - turnCount !== 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {turnLimitReached && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "9px 13px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <AlertTriangle
                  size={13}
                  color="#dc2626"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p style={{ margin: 0, fontSize: 11, color: "#991b1b" }}>
                  Turn limit reached. In a live flow, this would{" "}
                  {agent?.fallback_action === "handoff_to_agent"
                    ? "hand off to a human agent"
                    : "end the flow"}
                  . Reset to continue testing.
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => {
              if (msg.role === "typing") {
                return (
                  <div
                    key="typing"
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={14} color="#fff" />
                    </div>
                    <div
                      style={{
                        padding: "10px 16px",
                        background: "#fff",
                        borderRadius: "16px 16px 16px 4px",
                        border: "1px solid #f1f5f9",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}
                    >
                      <TypingDots />
                    </div>
                  </div>
                );
              }

              if (msg.role === "error") {
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 14px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: 10,
                        fontSize: 12,
                        color: "#dc2626",
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <AlertTriangle size={12} />
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return <ChatBubble key={i} msg={msg} />;
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            style={{
              padding: "14px 16px",
              background: "#fff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                turnLimitReached
                  ? "Turn limit reached — reset to continue"
                  : "Type a message… (Enter to send, Shift+Enter for new line)"
              }
              disabled={turnLimitReached}
              rows={1}
              style={{
                flex: 1,
                padding: "10px 13px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 13,
                color: "#1e293b",
                background: turnLimitReached ? "#f8fafc" : "#fff",
                outline: "none",
                resize: "none",
                fontFamily: "inherit",
                lineHeight: 1.5,
                maxHeight: 100,
                overflowY: "auto",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0ea5e9")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={sending || !input.trim() || turnLimitReached}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background:
                  input.trim() && !turnLimitReached ? "#0ea5e9" : "#e2e8f0",
                border: "none",
                cursor:
                  sending || !input.trim() || turnLimitReached
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.18s",
              }}
            >
              {sending ? (
                <Loader2
                  size={15}
                  color={input.trim() ? "#fff" : "#94a3b8"}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send
                  size={15}
                  color={input.trim() && !turnLimitReached ? "#fff" : "#94a3b8"}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
