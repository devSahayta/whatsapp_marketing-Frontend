// src/pages/ChatbotFlows.jsx
// List of chatbot flows – create, open builder, delete

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Bot,
  Trash2,
  Settings,
  Loader2,
  Search,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { showSuccess, showError } from "../utils/toast";
import { getFlows, createFlow, deleteFlow, updateFlow } from "../api/chatbot";
import { fetchWhatsappAccount } from "../api/waccount";

const STATUS_META = {
  active: {
    label: "Active",
    color: "#22c55e",
    bg: "#dcfce7",
    icon: CheckCircle,
  },
  inactive: { label: "Inactive", color: "#64748b", bg: "#f1f5f9", icon: Clock },
  draft: { label: "Draft", color: "#f59e0b", bg: "#fef3c7", icon: Clock },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon = meta.icon;
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
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: meta.color,
          display: "inline-block",
        }}
      />
      {meta.label}
    </span>
  );
}

export default function ChatbotFlows() {
  const navigate = useNavigate();
  const { user } = useAuthUser();

  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [newFlow, setNewFlow] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
      try {
        const accRes = await fetchWhatsappAccount(user.id);
        const acc = accRes?.data?.data;
        const accId = acc?.wa_id;
        setAccountId(accId);

        const res = await getFlows(user.id, accId);
        setFlows(res.data?.flows || []);
      } catch (err) {
        showError("Failed to load flows");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!newFlow.name.trim()) return;
    setCreating(true);
    try {
      const res = await createFlow({
        user_id: user.id,
        account_id: accountId,
        name: newFlow.name.trim(),
        description: newFlow.description.trim(),
      });
      const created = res.data.flow;
      setFlows((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewFlow({ name: "", description: "" });
      showSuccess("Flow created!");
      navigate(`/chatbot/builder/${created.flow_id}`);
    } catch (err) {
      showError("Failed to create flow");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (flowId, e) => {
    e.stopPropagation();
    if (!confirm("Delete this flow? This cannot be undone.")) return;
    setDeletingId(flowId);
    try {
      await deleteFlow(flowId);
      setFlows((prev) => prev.filter((f) => f.flow_id !== flowId));
      showSuccess("Flow deleted");
    } catch {
      showError("Failed to delete flow");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (flow, e) => {
    e.stopPropagation();
    const newStatus = flow.status === "active" ? "inactive" : "active";
    try {
      const res = await updateFlow(flow.flow_id, { status: newStatus });
      setFlows((prev) =>
        prev.map((f) => (f.flow_id === flow.flow_id ? res.data.flow : f)),
      );
      showSuccess(
        newStatus === "active" ? "Flow activated!" : "Flow deactivated.",
      );
    } catch {
      showError("Failed to update status");
    }
  };

  const filtered = flows.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "32px 24px",
        // maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                background: "#0ea5e9",
                borderRadius: 10,
                padding: 8,
                display: "flex",
              }}
            >
              <Bot size={20} color="#fff" />
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Chatbot Flows
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
            Build automated conversation flows for your WhatsApp bot
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 2px 8px #0ea5e940",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#0284c7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#0ea5e9")}
        >
          <Plus size={16} />
          New Flow
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24, maxWidth: 400 }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 11,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
          }}
        />
        <input
          type="text"
          placeholder="Search flows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px 9px 34px",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontSize: 13,
            color: "#1e293b",
            background: "#fff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowCreate(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 28,
              width: "90%",
              maxWidth: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 18px",
                fontSize: 18,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Create New Flow
            </h2>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 5,
                }}
              >
                FLOW NAME *
              </label>
              <input
                type="text"
                value={newFlow.name}
                onChange={(e) =>
                  setNewFlow((p) => ({ ...p, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Order Tracking Bot"
                autoFocus
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  fontSize: 13,
                  color: "#1e293b",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 5,
                }}
              >
                DESCRIPTION (optional)
              </label>
              <textarea
                value={newFlow.description}
                onChange={(e) =>
                  setNewFlow((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Tracks orders when user sends TRACK…"
                rows={2}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  fontSize: 13,
                  color: "#1e293b",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  background: "#fff",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newFlow.name.trim()}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 7,
                  background: newFlow.name.trim() ? "#0ea5e9" : "#e2e8f0",
                  color: newFlow.name.trim() ? "#fff" : "#94a3b8",
                  cursor:
                    creating || !newFlow.name.trim()
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {creating && (
                  <Loader2
                    size={13}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                )}
                Create & Open Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: 10,
            color: "#94a3b8",
          }}
        >
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Loading flows…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 0",
            color: "#94a3b8",
          }}
        >
          <Bot size={48} style={{ marginBottom: 14, opacity: 0.3 }} />
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 16,
              fontWeight: 600,
              color: "#64748b",
            }}
          >
            {search ? "No flows match your search" : "No chatbot flows yet"}
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {search
              ? "Try a different keyword"
              : 'Click "New Flow" to create your first automated chatbot'}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((flow) => (
            <div
              key={flow.flow_id}
              onClick={() => navigate(`/chatbot/builder/${flow.flow_id}`)}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "18px 20px",
                cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.09)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Icon + Status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    background: "#e0f2fe",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                  }}
                >
                  <Zap size={16} color="#0ea5e9" />
                </div>
                <StatusBadge status={flow.status} />
              </div>

              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {flow.name}
              </h3>
              {flow.description && (
                <p
                  style={{
                    margin: "0 0 14px",
                    fontSize: 12,
                    color: "#64748b",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {flow.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: flow.description ? 0 : 14,
                }}
              >
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  {new Date(
                    flow.updated_at || flow.created_at,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <div style={{ display: "flex", gap: 6 }}>
                  {/* Toggle active */}
                  <button
                    onClick={(e) => handleToggleStatus(flow, e)}
                    title={flow.status === "active" ? "Deactivate" : "Activate"}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      color: flow.status === "active" ? "#dc2626" : "#22c55e",
                    }}
                  >
                    {flow.status === "active" ? "Deactivate" : "Activate"}
                  </button>

                  {/* Open builder */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chatbot/builder/${flow.flow_id}`);
                    }}
                    title="Open Builder"
                    style={{
                      padding: "5px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      color: "#0ea5e9",
                    }}
                  >
                    <Settings size={13} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(flow.flow_id, e)}
                    title="Delete"
                    disabled={deletingId === flow.flow_id}
                    style={{
                      padding: "5px 8px",
                      border: "1px solid #fee2e2",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      color: "#ef4444",
                    }}
                  >
                    {deletingId === flow.flow_id ? (
                      <Loader2
                        size={13}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
