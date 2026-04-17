// src/pages/CreateAgent.jsx
// Create OR Edit an AI Agent (same component, driven by URL param)

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Save,
  Loader2,
  Plus,
  X,
  Zap,
  AlertTriangle,
  Cpu,
  MessageSquare,
  Sparkles,
  Info,
  Hash,
  GitBranch,
  ShieldAlert,
} from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { showSuccess, showError } from "../utils/toast";
import {
  createAgent,
  updateAgent,
  getAgentById,
  getModelInfo,
} from "../api/agents";
import { fetchWhatsappAccount } from "../api/waccount";

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputBase = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid #e2e8f0",
  borderRadius: 9,
  fontSize: 13,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  step,
  title,
  subtitle,
  icon: Icon,
  iconColor = "#0ea5e9",
  children,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1.5px solid #e2e8f0",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid #f1f5f9",
          background: "#fafbfc",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `${iconColor}15`,
            border: `2px solid ${iconColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: iconColor }}>
            {step}
          </span>
        </div>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            {title}
          </p>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#94a3b8",
                marginTop: 1,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ── Model card ─────────────────────────────────────────────────────────────────
function ModelCard({ model, selected, onSelect }) {
  const isSelected = selected === model.id;
  return (
    <div
      onClick={() => onSelect(model.id)}
      style={{
        border: isSelected ? "2px solid #0ea5e9" : "1.5px solid #e2e8f0",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
        background: isSelected ? "#f0f9ff" : "#fff",
        transition: "all 0.18s",
        position: "relative",
        flex: "1 1 180px",
      }}
    >
      {model.recommended && (
        <div
          style={{
            position: "absolute",
            top: -1,
            right: 12,
            background: "#22c55e",
            color: "#fff",
            fontSize: 9,
            fontWeight: 800,
            padding: "2px 7px",
            borderRadius: "0 0 6px 6px",
            letterSpacing: 0.5,
          }}
        >
          RECOMMENDED
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: isSelected ? "4px solid #0ea5e9" : "2px solid #cbd5e1",
            background: "#fff",
            flexShrink: 0,
            transition: "all 0.18s",
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: isSelected ? "#0284c7" : "#1e293b",
          }}
        >
          {model.label}
        </span>
      </div>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          color: "#64748b",
          lineHeight: 1.6,
          paddingLeft: 24,
        }}
      >
        {model.description}
      </p>
      {model.warning && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "6px 9px",
            background: "#fef9c3",
            borderRadius: 7,
            border: "1px solid #fde68a",
            marginLeft: 24,
          }}
        >
          <AlertTriangle
            size={11}
            color="#d97706"
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: "#92400e",
              lineHeight: 1.5,
            }}
          >
            {model.warning}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Exit keywords field ────────────────────────────────────────────────────────
function ExitKeywordsField({ keywords, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim().toUpperCase();
    if (trimmed && !keywords.includes(trimmed))
      onChange([...keywords, trimmed]);
    setInput("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder='Type a keyword and press Enter or "Add"'
          style={{ ...inputBase, flex: 1 }}
          onFocus={(e) => {
            e.target.style.borderColor = "#0ea5e9";
            e.target.style.boxShadow = "0 0 0 3px #0ea5e915";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "none";
          }}
        />
        <button
          type="button"
          onClick={add}
          style={{
            padding: "10px 14px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 9,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 600,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={13} /> Add
        </button>
      </div>
      {keywords.length > 0 ? (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
        >
          {keywords.map((kw) => (
            <span
              key={kw}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#f0f9ff",
                color: "#0369a1",
                border: "1px solid #bae6fd",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 7,
                padding: "4px 10px",
              }}
            >
              <Hash size={9} />
              {kw}
              <button
                onClick={() => onChange(keywords.filter((k) => k !== kw))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#0369a1",
                  display: "flex",
                  opacity: 0.6,
                }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#cbd5e1" }}>
          No exit keywords added yet
        </p>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CreateAgent() {
  const navigate = useNavigate();
  const { agent_id } = useParams();
  const isEditing = !!agent_id;
  const { user } = useAuthUser();

  const [accountId, setAccountId] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    model: "claude-haiku-4-5-20251001",
    temperature: 0.7, // hardcoded — not shown to user
    max_turns: 10,
    fallback_action: "handoff_to_agent",
    exit_keywords: [],
    status: "active",
  });

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  useEffect(() => {
    if (!user?.id) return;
    const init = async () => {
      try {
        const [accRes, modelRes] = await Promise.all([
          fetchWhatsappAccount(user.id),
          getModelInfo(),
        ]);
        setAccountId(accRes?.data?.data?.wa_id);
        setModels(modelRes.data?.models || []);
        if (isEditing) {
          const res = await getAgentById(agent_id);
          const a = res.data.agent;
          setForm({
            name: a.name || "",
            description: a.description || "",
            system_prompt: a.system_prompt || "",
            model: a.model || "claude-haiku-4-5-20251001",
            temperature: parseFloat(a.temperature) || 0.7,
            max_turns: a.max_turns || 10,
            fallback_action: a.fallback_action || "handoff_to_agent",
            exit_keywords: a.exit_keywords || [],
            status: a.status || "active",
          });
        }
      } catch {
        showError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user?.id, agent_id]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return showError("Agent name is required");
    if (!form.system_prompt.trim())
      return showError("System prompt is required");
    setSaving(true);
    try {
      if (isEditing) {
        await updateAgent(agent_id, form);
        showSuccess("Agent updated!");
        navigate("/agents");
      } else {
        await createAgent({ ...form, user_id: user.id, account_id: accountId });
        showSuccess("Agent created successfully!");
        navigate("/agents");
      }
    } catch (err) {
      showError(err?.response?.data?.error || "Failed to save agent");
    } finally {
      setSaving(false);
    }
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
        <span style={{ fontSize: 14 }}>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const checklistItems = [
    { label: "Agent name", done: !!form.name.trim() },
    { label: "System prompt", done: form.system_prompt.trim().length > 20 },
    { label: "Model selected", done: !!form.model },
    { label: "Conversation limit", done: form.max_turns > 0 },
    { label: "Fallback action", done: !!form.fallback_action },
  ];
  const allDone = checklistItems.every((i) => i.done);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .focus-input:focus { border-color:#0ea5e9 !important; box-shadow:0 0 0 3px #0ea5e915 !important; }
        .save-btn:hover:not(:disabled) { background:#0284c7 !important; box-shadow:0 4px 16px #0ea5e960 !important; transform:translateY(-1px); }
        .save-btn:active:not(:disabled) { transform:translateY(0); }
        @media(max-width:768px){
          .create-layout { flex-direction:column !important; }
          .create-sidebar { width:100% !important; position:static !important; margin-left:0 !important; }
          .model-cards { flex-direction:column !important; }
        }
      `}</style>

      {/* ── Sticky top bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#1e293b",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          borderBottom: "1px solid #334155",
          position: "sticky",
          top: 0,
          zIndex: 100,
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
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{ width: 1, height: 20, background: "#334155" }} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
              borderRadius: 7,
              padding: 5,
              display: "flex",
            }}
          >
            <Sparkles size={13} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
            {isEditing ? `Edit — ${form.name || "Agent"}` : "Create New Agent"}
          </span>
        </div>

        {isEditing && (
          <button
            onClick={() =>
              update("status", form.status === "active" ? "inactive" : "active")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              background: form.status === "active" ? "#fee2e2" : "#dcfce7",
              color: form.status === "active" ? "#dc2626" : "#16a34a",
              border: "none",
              borderRadius: 7,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: form.status === "active" ? "#dc2626" : "#22c55e",
              }}
            />
            {form.status === "active" ? "Active" : "Inactive"}
          </button>
        )}

        <button
          className="save-btn"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 16px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 700,
            transition: "all 0.18s",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Save size={13} />
          )}
          {isEditing ? "Save Changes" : "Create Agent"}
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div
        className="create-layout"
        style={{
          display: "flex",
          gap: 0,
          maxWidth: 1060,
          margin: "0 auto",
          padding: "28px 24px",
          alignItems: "flex-start",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Step 1 — Name */}
          <Section
            step="1"
            title="Name your agent"
            subtitle="Give it a clear name so you can identify it in your flows"
            icon={Bot}
            iconColor="#0ea5e9"
          >
            <input
              className="focus-input"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Order Support Agent, FAQ Bot, Sales Agent…"
              style={{ ...inputBase, fontSize: 14, padding: "11px 14px" }}
            />
            <input
              className="focus-input"
              type="text"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Short description (optional) — shown in the agents list"
              style={{ ...inputBase, marginTop: 10, fontSize: 12 }}
            />
          </Section>

          {/* Step 2 — System Prompt */}
          <Section
            step="2"
            title="Tell the agent what it should do"
            subtitle="Write it like you're briefing a new employee — be clear about role, tone, and boundaries"
            icon={MessageSquare}
            iconColor="#8b5cf6"
          >
            <textarea
              className="focus-input"
              value={form.system_prompt}
              onChange={(e) => update("system_prompt", e.target.value)}
              placeholder={`You are a friendly customer support agent for Acme Store on WhatsApp.

Help customers with:
- Tracking orders (ask for Order ID if not provided)
- Returns and refunds
- Product questions

Keep replies short and friendly. If you can't help, offer to transfer to a human.

You can use details captured earlier in the flow:
Customer name: {{name}}
Order ID: {{order_id}}`}
              rows={10}
              style={{
                ...inputBase,
                resize: "vertical",
                lineHeight: 1.75,
                minHeight: 220,
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 9,
                padding: "11px 13px",
                background: "#f0f9ff",
                borderRadius: 9,
                border: "1px solid #bae6fd",
                marginTop: 12,
              }}
            >
              <Info
                size={13}
                color="#0369a1"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ fontSize: 11, color: "#0369a1", lineHeight: 1.65 }}>
                <strong>Tip:</strong> Use{" "}
                <code
                  style={{
                    background: "#dbeafe",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  {"{{variable_name}}"}
                </code>{" "}
                to inject data captured earlier in the flow — like the
                customer's name or order ID.
              </div>
            </div>
          </Section>

          {/* Step 3 — Model */}
          <Section
            step="3"
            title="Choose an AI model"
            subtitle="Affects how smart responses are and how many tokens are consumed per message"
            icon={Cpu}
            iconColor="#0ea5e9"
          >
            <div
              className="model-cards"
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              {(models.length > 0
                ? models
                : [
                    {
                      id: "claude-haiku-4-5-20251001",
                      label: "Haiku",
                      description:
                        "Fastest and cheapest. Perfect for most WhatsApp bots — handles FAQs, order tracking, and simple flows effortlessly.",
                      recommended: true,
                      warning: null,
                    },
                    {
                      id: "claude-sonnet-4-6",
                      label: "Sonnet",
                      description:
                        "Smarter and more nuanced. Good for complex multi-step conversations or when Haiku isn't giving the quality you need.",
                      recommended: false,
                      warning:
                        "Uses ~4× more tokens than Haiku — monitor your usage.",
                    },
                    {
                      id: "claude-opus-4-6",
                      label: "Opus",
                      description:
                        "Most powerful model. Best for highly complex reasoning, detailed analysis, or premium experiences.",
                      recommended: false,
                      warning:
                        "Uses ~15× more tokens than Haiku — only use if absolutely needed.",
                    },
                  ]
              ).map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={form.model}
                  onSelect={(id) => update("model", id)}
                />
              ))}
            </div>
          </Section>

          {/* Step 4 — Conversation Limit */}
          <Section
            step="4"
            title="How long can the conversation go?"
            subtitle="Set a message limit to prevent loops and keep API costs in check"
            icon={ShieldAlert}
            iconColor="#f59e0b"
          >
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}
                >
                  Max messages back-and-forth
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0ea5e9",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: 8,
                    padding: "2px 12px",
                    minWidth: 40,
                    textAlign: "center",
                  }}
                >
                  {form.max_turns}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={form.max_turns}
                onChange={(e) => update("max_turns", parseInt(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#0ea5e9",
                  cursor: "pointer",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span style={{ fontSize: 10, color: "#cbd5e1" }}>
                  1 — Very short
                </span>
                <span style={{ fontSize: 10, color: "#cbd5e1" }}>
                  50 — Long
                </span>
              </div>

              {/* Context hint */}
              <div
                style={{
                  marginTop: 10,
                  padding: "9px 13px",
                  borderRadius: 9,
                  fontSize: 11,
                  lineHeight: 1.6,
                  background:
                    form.max_turns <= 5
                      ? "#fef9c3"
                      : form.max_turns <= 20
                        ? "#f0fdf4"
                        : "#fff7ed",
                  border: `1px solid ${form.max_turns <= 5 ? "#fde68a" : form.max_turns <= 20 ? "#bbf7d0" : "#fed7aa"}`,
                  color:
                    form.max_turns <= 5
                      ? "#92400e"
                      : form.max_turns <= 20
                        ? "#15803d"
                        : "#c2410c",
                }}
              >
                {form.max_turns <= 5 &&
                  "⚡ Very short — good for quick lookups like order status (1–2 questions max)."}
                {form.max_turns > 5 &&
                  form.max_turns <= 20 &&
                  `✓ Good balance — allows ${form.max_turns} back-and-forth messages. Works well for most support flows.`}
                {form.max_turns > 20 &&
                  `⚠️ Long session — ${form.max_turns} messages could get expensive if many users hit the limit. Make sure your fallback is set correctly.`}
              </div>
            </div>

            {/* Fallback action */}
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 600,
                color: "#475569",
              }}
            >
              When the limit is reached, the agent should…
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                {
                  value: "handoff_to_agent",
                  emoji: "👤",
                  label: "Transfer to a human",
                  desc: "Best when issues may need a real person to resolve",
                },
                {
                  value: "end_flow",
                  emoji: "✅",
                  label: "End the conversation",
                  desc: "Best for info-only bots with no human backup",
                },
              ].map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => update("fallback_action", opt.value)}
                  style={{
                    flex: "1 1 180px",
                    border:
                      form.fallback_action === opt.value
                        ? "2px solid #0ea5e9"
                        : "1.5px solid #e2e8f0",
                    borderRadius: 11,
                    padding: "13px 15px",
                    cursor: "pointer",
                    background:
                      form.fallback_action === opt.value ? "#f0f9ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.emoji}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color:
                          form.fallback_action === opt.value
                            ? "#0284c7"
                            : "#1e293b",
                      }}
                    >
                      {opt.label}
                    </span>
                    {form.fallback_action === opt.value && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: 18,
                          height: 18,
                          background: "#0ea5e9",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </span>
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "#64748b",
                      lineHeight: 1.5,
                      paddingLeft: 26,
                    }}
                  >
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Step 5 — Exit Keywords */}
          <Section
            step="5"
            title="Let users exit the agent anytime"
            subtitle="Optional — users type one of these words to break out and return to the main flow"
            icon={GitBranch}
            iconColor="#22c55e"
          >
            <ExitKeywordsField
              keywords={form.exit_keywords}
              onChange={(v) => update("exit_keywords", v)}
            />
            <div
              style={{
                display: "flex",
                gap: 9,
                padding: "11px 13px",
                background: "#f0fdf4",
                borderRadius: 9,
                border: "1px solid #bbf7d0",
                marginTop: 14,
              }}
            >
              <Info
                size={13}
                color="#15803d"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ fontSize: 11, color: "#15803d", lineHeight: 1.65 }}>
                <strong>Example:</strong> Add{" "}
                <code
                  style={{
                    background: "#dcfce7",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  MENU
                </code>{" "}
                so users can type "MENU" at any point to go back to your main
                menu. Common ones:{" "}
                <code
                  style={{
                    background: "#dcfce7",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  STOP
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#dcfce7",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  HELP
                </code>
                ,{" "}
                <code
                  style={{
                    background: "#dcfce7",
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  EXIT
                </code>
                .
              </div>
            </div>
          </Section>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div
          className="create-sidebar"
          style={{
            width: 240,
            flexShrink: 0,
            marginLeft: 20,
            position: "sticky",
            top: 72,
          }}
        >
          {/* Checklist */}
          <div
            style={{
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg,#0f172a,#1e3a5f)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: 0.5,
                }}
              >
                PROGRESS
              </p>
            </div>
            <div style={{ padding: "12px 14px" }}>
              {checklistItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "6px 0",
                    borderBottom: "1px solid #f8fafc",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: item.done ? "#22c55e" : "#f1f5f9",
                      border: item.done ? "none" : "1.5px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    {item.done && (
                      <span
                        style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: item.done ? "#1e293b" : "#94a3b8",
                      fontWeight: item.done ? 600 : 400,
                      transition: "all 0.2s",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}

              {/* Overall progress bar */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    height: 4,
                    background: "#f1f5f9",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(checklistItems.filter((i) => i.done).length / checklistItems.length) * 100}%`,
                      background: allDone ? "#22c55e" : "#0ea5e9",
                      borderRadius: 4,
                      transition: "width 0.4s, background 0.4s",
                    }}
                  />
                </div>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 10,
                    color: "#94a3b8",
                    textAlign: "right",
                  }}
                >
                  {checklistItems.filter((i) => i.done).length}/
                  {checklistItems.length} complete
                </p>
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            className="save-btn"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: 11,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8,
              transition: "all 0.18s",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <Loader2
                size={14}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Save size={14} />
            )}
            {isEditing ? "Save Changes" : "Create Agent"}
          </button>

          {isEditing && (
            <button
              onClick={() => navigate(`/agents/${agent_id}/test`)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "11px",
                background: "#fff",
                color: "#8b5cf6",
                border: "1.5px solid #c4b5fd",
                borderRadius: 11,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f5f3ff")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <Zap size={14} /> Test This Agent
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
