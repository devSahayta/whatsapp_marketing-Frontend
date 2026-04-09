// src/components/chatbot/NodeProperties.jsx
// Right panel – edit config of the selected node

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { NODE_META } from "./ChatbotNode";

const inputStyle = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  fontSize: 12,
  color: "#1e293b",
  background: "#f8fafc",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 4,
};

const fieldStyle = { marginBottom: 12 };

function TextField({ label, value, onChange, placeholder, multiline }) {
  return (
    <div style={fieldStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={fieldStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function KeywordsField({ keywords = [], onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim().toUpperCase();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
    }
    setInput("");
  };

  const remove = (kw) => onChange(keywords.filter((k) => k !== kw));

  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>KEYWORDS</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Type and press Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={add}
          style={{
            padding: "7px 10px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          <Plus size={13} />
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {keywords.map((kw) => (
          <span
            key={kw}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#e0f2fe",
              color: "#0369a1",
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              padding: "2px 7px",
            }}
          >
            {kw}
            <button
              onClick={() => remove(kw)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#0369a1",
                display: "flex",
              }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function ConfigEditor({ type, config, onChange, templates = [] }) {
  const update = (key, value) => onChange({ ...config, [key]: value });

  switch (type) {
    case "keyword_trigger":
      return (
        <>
          <KeywordsField
            keywords={config.keywords || []}
            onChange={(v) => update("keywords", v)}
          />
          <SelectField
            label="MATCH TYPE"
            value={config.match_type || "contains"}
            onChange={(v) => update("match_type", v)}
            options={[
              { value: "contains", label: "Contains" },
              { value: "exact", label: "Exact match" },
              { value: "starts_with", label: "Starts with" },
            ]}
          />
        </>
      );

    case "send_message":
      return (
        <TextField
          label="MESSAGE TEXT"
          value={config.text}
          onChange={(v) => update("text", v)}
          placeholder="Hi {{name}}! How can I help you?"
          multiline
        />
      );

    case "send_template": {
      const extractVars = (components) => {
        const body = components?.find((c) => c.type === "BODY");
        if (!body?.text) return [];
        const matches = body.text.match(/\{\{(\d+)\}\}/g) || [];
        return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))]
          .sort((a, b) => Number(a) - Number(b));
      };

      const selectedTpl = templates.find((t) => t.name === config.template_name);
      const variables = selectedTpl ? extractVars(selectedTpl.components) : [];
      const headerComp = selectedTpl?.components?.find((c) => c.type === "HEADER");
      const bodyComp = selectedTpl?.components?.find((c) => c.type === "BODY");
      const buttonComp = selectedTpl?.components?.find((c) => c.type === "BUTTONS");

      return (
        <>
          {/* Template selector */}
          <div style={fieldStyle}>
            <label style={labelStyle}>TEMPLATE</label>
            {templates.length === 0 ? (
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                No approved templates found.
              </p>
            ) : (
              <select
                value={config.template_name || ""}
                onChange={(e) => {
                  const t = templates.find((tpl) => tpl.name === e.target.value);
                  if (!t) {
                    onChange({ ...config, template_name: "", template_id: "", template_variable_map: {} });
                    return;
                  }
                  onChange({
                    ...config,
                    template_name: t.name,
                    template_id: t.id,
                    template_variable_map: {},
                  });
                }}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">Select template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.language})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Template preview */}
          {selectedTpl && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 12px",
                background: "#f8fafc",
                borderRadius: 7,
                border: "1px solid #e2e8f0",
                fontSize: 11,
              }}
            >
              {headerComp && (
                <div style={{ marginBottom: 6 }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 4,
                      padding: "1px 6px",
                      marginBottom: 4,
                    }}
                  >
                    {headerComp.format} HEADER
                  </span>
                </div>
              )}
              {bodyComp && (
                <p
                  style={{
                    margin: "0 0 6px",
                    color: "#374151",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {bodyComp.text}
                </p>
              )}
              {buttonComp?.buttons?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {buttonComp.buttons.map((btn, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 10,
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 4,
                        padding: "2px 7px",
                        color: "#475569",
                      }}
                    >
                      {btn.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Variable mapping */}
          {variables.length > 0 && (
            <div>
              <label style={labelStyle}>VARIABLE MAPPING</label>
              <p style={{ margin: "0 0 8px", fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
                Map each {"{{n}}"} to a session variable (e.g. {"{{name}}"})
              </p>
              {variables.map((pos) => (
                <div
                  key={pos}
                  style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0369a1",
                      background: "#e0f2fe",
                      borderRadius: 4,
                      padding: "3px 7px",
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {`{{${pos}}}`}
                  </span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>→</span>
                  <input
                    type="text"
                    value={config.template_variable_map?.[pos] || ""}
                    onChange={(e) => {
                      const map = { ...(config.template_variable_map || {}) };
                      map[pos] = e.target.value;
                      onChange({ ...config, template_variable_map: map });
                    }}
                    placeholder="{{variable_name}}"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    case "wait_for_input":
      return (
        <>
          <TextField
            label="PROMPT (optional)"
            value={config.prompt}
            onChange={(v) => update("prompt", v)}
            placeholder="Please enter your Order ID"
          />
          <TextField
            label="SAVE RESPONSE AS"
            value={config.save_as}
            onChange={(v) => update("save_as", v)}
            placeholder="order_id"
          />
        </>
      );

    case "condition":
      return (
        <>
          <TextField
            label="VARIABLE"
            value={config.variable}
            onChange={(v) => update("variable", v)}
            placeholder="order.found"
          />
          <SelectField
            label="OPERATOR"
            value={config.operator || "=="}
            onChange={(v) => update("operator", v)}
            options={[
              { value: "==", label: "equals" },
              { value: "!=", label: "not equals" },
              { value: "contains", label: "contains" },
              { value: "not_contains", label: "not contains" },
              { value: ">", label: "greater than" },
              { value: "<", label: "less than" },
            ]}
          />
          <TextField
            label="VALUE"
            value={config.value}
            onChange={(v) => update("value", v)}
            placeholder="true"
          />
        </>
      );

    case "http_request":
      return (
        <>
          <SelectField
            label="METHOD"
            value={config.method || "GET"}
            onChange={(v) => update("method", v)}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
              { value: "PUT", label: "PUT" },
              { value: "DELETE", label: "DELETE" },
            ]}
          />
          <TextField
            label="URL"
            value={config.url}
            onChange={(v) => update("url", v)}
            placeholder="https://api.example.com/orders/{{order_id}}"
          />
          <TextField
            label="SAVE RESPONSE AS"
            value={config.save_as}
            onChange={(v) => update("save_as", v)}
            placeholder="order"
          />
          <TextField
            label="HEADERS (JSON)"
            value={
              config.headers
                ? typeof config.headers === "string"
                  ? config.headers
                  : JSON.stringify(config.headers, null, 2)
                : ""
            }
            onChange={(v) => {
              try {
                update("headers", JSON.parse(v));
              } catch {
                update("headers", v);
              }
            }}
            placeholder={'{"Authorization": "Bearer token"}'}
            multiline
          />
          <TextField
            label="BODY (JSON, POST only)"
            value={
              config.body
                ? typeof config.body === "string"
                  ? config.body
                  : JSON.stringify(config.body, null, 2)
                : ""
            }
            onChange={(v) => {
              try {
                update("body", JSON.parse(v));
              } catch {
                update("body", v);
              }
            }}
            placeholder='{"key": "value"}'
            multiline
          />
        </>
      );

    case "delay":
      return (
        <div style={fieldStyle}>
          <label style={labelStyle}>DELAY (seconds)</label>
          <input
            type="number"
            min={1}
            max={3600}
            value={config.seconds || 5}
            onChange={(e) => update("seconds", Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      );

    case "ai_fallback":
      return (
        <TextField
          label="FALLBACK MESSAGE"
          value={config.fallback_message}
          onChange={(v) => update("fallback_message", v)}
          placeholder="I'm sorry, I didn't understand that. Please try again or type HELP."
          multiline
        />
      );

    case "handoff_to_agent":
      return (
        <TextField
          label="HANDOFF MESSAGE (optional)"
          value={config.message}
          onChange={(v) => update("message", v)}
          placeholder="Transferring you to a human agent, please wait..."
        />
      );

    case "end_flow":
      return (
        <TextField
          label="GOODBYE MESSAGE (optional)"
          value={config.message}
          onChange={(v) => update("message", v)}
          placeholder="Thank you for contacting us!"
        />
      );

    case "trigger_campaign":
      return (
        <TextField
          label="CAMPAIGN ID"
          value={config.campaign_id}
          onChange={(v) => update("campaign_id", v)}
          placeholder="uuid of campaign"
        />
      );

    case "api_trigger":
      return (
        <div
          style={{
            padding: "10px 12px",
            background: "#f8fafc",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            This flow will start when triggered via the API.
            No additional configuration needed.
          </p>
        </div>
      );

    default:
      return (
        <p style={{ fontSize: 11, color: "#94a3b8" }}>
          No configuration for this node type.
        </p>
      );
  }
}

export default function NodeProperties({ node, onChange, onClose, templates }) {
  const [config, setConfig] = useState(node?.data || {});

  useEffect(() => {
    setConfig(node?.data || {});
  }, [node?.id]);

  if (!node) return null;

  const meta = NODE_META[node.type] || {};

  const handleChange = (newConfig) => {
    setConfig(newConfig);
    onChange(node.id, newConfig);
  };

  return (
    <div
      style={{
        width: 260,
        background: "#ffffff",
        borderLeft: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid #e2e8f0",
          background: meta.bg || "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              background: meta.color || "#64748b",
              borderRadius: 5,
              padding: 4,
              display: "flex",
            }}
          >
            {meta.icon && <meta.icon size={13} color="#fff" />}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>
            Node Properties
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#64748b",
            padding: 2,
            display: "flex",
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: "14px" }}>
        {/* Node type badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: meta.bg || "#f1f5f9",
            color: meta.color || "#64748b",
            borderRadius: 5,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 700,
            marginBottom: 14,
            letterSpacing: 0.5,
          }}
        >
          {meta.label || node.type}
        </div>

        <ConfigEditor
          type={node.type}
          config={config}
          onChange={handleChange}
          templates={templates}
        />
      </div>
    </div>
  );
}
