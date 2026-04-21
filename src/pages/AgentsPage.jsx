// src/pages/AgentsPage.jsx
// Lists all AI agents for the account

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Bot,
  Trash2,
  Pencil,
  Loader2,
  Search,
  Zap,
  FlaskConical,
  CheckCircle,
  Clock,
  Cpu,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { showSuccess, showError } from "../utils/toast";
import { getAgents, deleteAgent } from "../api/agents";
import { fetchWhatsappAccount } from "../api/waccount";

// ── Model label map ────────────────────────────────────────────────────────────
const MODEL_META = {
  "claude-haiku-4-5-20251001": {
    label: "Haiku",
    color: "#0ea5e9",
    bg: "#e0f2fe",
  },
  "claude-sonnet-4-6": {
    label: "Sonnet",
    color: "#8b5cf6",
    bg: "#ede9fe",
  },
  "claude-opus-4-6": {
    label: "Opus",
    color: "#f59e0b",
    bg: "#fef3c7",
  },
};

function ModelBadge({ model }) {
  const meta = MODEL_META[model] || {
    label: model,
    color: "#64748b",
    bg: "#f1f5f9",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: meta.bg,
        color: meta.color,
        borderRadius: 20,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    >
      <Cpu size={9} />
      {meta.label}
    </span>
  );
}

function StatusDot({ status }) {
  const active = status === "active";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: active ? "#dcfce7" : "#f1f5f9",
        color: active ? "#16a34a" : "#64748b",
        borderRadius: 20,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#22c55e" : "#94a3b8",
          display: "inline-block",
        }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        padding: "20px 22px",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#f1f5f9",
          }}
        />
        <div
          style={{
            width: 60,
            height: 22,
            borderRadius: 20,
            background: "#f1f5f9",
          }}
        />
      </div>
      <div
        style={{
          width: "70%",
          height: 16,
          borderRadius: 6,
          background: "#f1f5f9",
          marginBottom: 8,
        }}
      />
      <div
        style={{
          width: "90%",
          height: 12,
          borderRadius: 6,
          background: "#f1f5f9",
          marginBottom: 4,
        }}
      />
      <div
        style={{
          width: "60%",
          height: 12,
          borderRadius: 6,
          background: "#f1f5f9",
        }}
      />
    </div>
  );
}

export default function AgentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
      try {
        const accRes = await fetchWhatsappAccount(user.id);
        const accId = accRes?.data?.data?.wa_id;
        setAccountId(accId);
        const res = await getAgents(user.id, accId);
        setAgents(res.data?.agents || []);
      } catch {
        showError("Failed to load agents");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.id]);

  const handleDelete = async (agentId, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Delete this agent? If it's used in any flows, deletion will be blocked.",
      )
    )
      return;
    setDeletingId(agentId);
    try {
      await deleteAgent(agentId);
      setAgents((prev) => prev.filter((a) => a.agent_id !== agentId));
      showSuccess("Agent deleted");
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to delete agent";
      showError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px 24px",
        margin: "0 auto",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .agent-card {
          transition: box-shadow 0.18s, transform 0.18s;
        }
        .agent-card:hover {
          box-shadow: 0 6px 28px rgba(0,0,0,0.10) !important;
          transform: translateY(-2px) !important;
        }
        .action-btn {
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .action-btn:hover {
          background: #f1f5f9 !important;
        }
        .primary-btn {
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .primary-btn:hover {
          background: #0284c7 !important;
          box-shadow: 0 4px 16px #0ea5e960 !important;
          transform: translateY(-1px);
        }
        .primary-btn:active { transform: translateY(0); }

        @media (max-width: 640px) {
          .agents-header { flex-direction: column !important; align-items: flex-start !important; }
          .agents-grid { grid-template-columns: 1fr !important; }
          .search-bar { max-width: 100% !important; }
          .hero-section { padding: 18px !important; }
        }
      `}</style>

      {/* ── Hero / Header ────────────────────────────────────────────────────── */}
      <div
        className="hero-section"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
          borderRadius: 20,
          padding: "28px 32px",
          marginBottom: 28,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #0ea5e930 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: "40%",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #8b5cf620 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="agents-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)",
                  borderRadius: 12,
                  padding: 10,
                  display: "flex",
                  boxShadow: "0 4px 14px #0ea5e940",
                }}
              >
                <Sparkles size={22} color="#fff" />
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#f1f5f9",
                  letterSpacing: -0.5,
                }}
              >
                AI Agents
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
              Build conversational AI agents and plug them into your chatbot
              flows
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => navigate("/agents/create")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "11px 20px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 2px 10px #0ea5e940",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={16} />
            New Agent
          </button>
        </div>

        {/* Stats row */}
        {!loading && agents.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 22,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "Total Agents",
                value: agents.length,
                icon: Bot,
                color: "#0ea5e9",
              },
              {
                label: "Active",
                value: agents.filter((a) => a.status === "active").length,
                icon: CheckCircle,
                color: "#22c55e",
              },
              {
                label: "Using Haiku",
                value: agents.filter(
                  (a) => a.model === "claude-haiku-4-5-20251001",
                ).length,
                icon: Zap,
                color: "#f59e0b",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "8px 14px",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <stat.icon size={14} color={stat.color} />
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}
                >
                  {stat.value}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div
        className="search-bar"
        style={{ position: "relative", marginBottom: 24, maxWidth: 420 }}
      >
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
          }}
        />
        <input
          type="text"
          placeholder="Search agents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            border: "1.5px solid #e2e8f0",
            borderRadius: 10,
            fontSize: 13,
            color: "#1e293b",
            background: "#fff",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#0ea5e9")}
          onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
        />
      </div>

      {/* ── Loading skeletons ─────────────────────────────────────────────────── */}
      {loading ? (
        <div
          className="agents-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────────────── */
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#94a3b8",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: "#f1f5f9",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
            }}
          >
            <Bot size={32} color="#cbd5e1" />
          </div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 17,
              fontWeight: 700,
              color: "#475569",
            }}
          >
            {search ? "No agents match your search" : "No agents yet"}
          </p>
          <p style={{ margin: "0 0 22px", fontSize: 13 }}>
            {search
              ? "Try a different keyword"
              : "Create your first AI agent and plug it into a chatbot flow"}
          </p>
          {!search && (
            <button
              className="primary-btn"
              onClick={() => navigate("/agents/create")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#0ea5e9",
                color: "#fff",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <Plus size={15} />
              Create First Agent
            </button>
          )}
        </div>
      ) : (
        /* ── Agent cards grid ──────────────────────────────────────────────── */
        <div
          className="agents-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((agent, i) => (
            <div
              key={agent.agent_id}
              className="agent-card"
              onClick={() => navigate(`/agents/${agent.agent_id}/edit`)}
              style={{
                background: "#fff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px 22px",
                cursor: "pointer",
                position: "relative",
                animation: `fadeInUp 0.3s ease both`,
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Top row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  gap: 10,
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #0ea5e915, #8b5cf615)",
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Bot size={18} color="#0ea5e9" />
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <ModelBadge model={agent.model} />
                  <StatusDot status={agent.status} />
                </div>
              </div>

              {/* Name */}
              <h3
                style={{
                  margin: "0 0 5px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.3,
                }}
              >
                {agent.name}
              </h3>

              {/* Description */}
              {agent.description ? (
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 12,
                    color: "#64748b",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {agent.description}
                </p>
              ) : (
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 12,
                    color: "#cbd5e1",
                    fontStyle: "italic",
                  }}
                >
                  No description
                </p>
              )}

              {/* Meta chips */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    color: "#64748b",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  <MessageSquare size={9} />
                  {agent.max_turns} max turns
                </span>
                {agent.exit_keywords?.length > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      color: "#64748b",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      padding: "3px 8px",
                    }}
                  >
                    <Zap size={9} />
                    {agent.exit_keywords.length} exit keyword
                    {agent.exit_keywords.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Bottom row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 12,
                }}
              >
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {new Date(
                    agent.updated_at || agent.created_at,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <div
                  style={{ display: "flex", gap: 6 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Test */}
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/agents/${agent.agent_id}/test`);
                    }}
                    title="Test Agent"
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <FlaskConical size={11} />
                    Test
                  </button>

                  {/* Edit */}
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/agents/${agent.agent_id}/edit`);
                    }}
                    title="Edit Agent"
                    style={{
                      padding: "5px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 7,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      color: "#0ea5e9",
                    }}
                  >
                    <Pencil size={12} />
                  </button>

                  {/* Delete */}
                  <button
                    className="action-btn"
                    onClick={(e) => handleDelete(agent.agent_id, e)}
                    title="Delete Agent"
                    disabled={deletingId === agent.agent_id}
                    style={{
                      padding: "5px 8px",
                      border: "1px solid #fee2e2",
                      borderRadius: 7,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      color: "#ef4444",
                    }}
                  >
                    {deletingId === agent.agent_id ? (
                      <Loader2
                        size={12}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
