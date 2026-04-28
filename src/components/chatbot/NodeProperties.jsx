// src/components/chatbot/NodeProperties.jsx
// Right panel – edit config of the selected node

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Upload,
} from "lucide-react";
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

// ── Media picker ──────────────────────────────────────────────────────────────
// ── Compact media list (list-view, fits 260 px panel) ─────────────────────────
function CompactMediaList({ accountId, onSelect, selectedMediaId, mediaType }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (accountId) load();
  }, [accountId]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/media/list?account_id=${accountId}`,
      );
      const data = await res.json();
      setMediaList(data.data || []);
    } catch {
      setError("Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  const byType = mediaType
    ? mediaList.filter((m) => {
        const mime = m.type || "";
        if (mediaType === "IMAGE") return mime.startsWith("image/");
        if (mediaType === "VIDEO") return mime.startsWith("video/");
        if (mediaType === "DOCUMENT")
          return !mime.startsWith("image/") && !mime.startsWith("video/");
        return true;
      })
    : mediaList;

  const filtered = search
    ? byType.filter((m) =>
        m.file_name.toLowerCase().includes(search.toLowerCase()),
      )
    : byType;

  const typeChip = (mime) => {
    if (!mime) return { label: "FILE", color: "#64748b", bg: "#f1f5f9" };
    if (mime.startsWith("image/")) return { label: "IMG", color: "#0369a1", bg: "#dbeafe" };
    if (mime.startsWith("video/")) return { label: "VID", color: "#7c3aed", bg: "#ede9fe" };
    return { label: "DOC", color: "#166534", bg: "#dcfce7" };
  };

  const fmtSize = (b) => {
    if (!b) return "";
    return b < 1048576
      ? `${(b / 1024).toFixed(0)} KB`
      : `${(b / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div style={{ padding: "18px 0", textAlign: "center" }}>
        <Loader2
          size={16}
          color="#94a3b8"
          style={{ animation: "spin 1s linear infinite", display: "inline-block" }}
        />
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#94a3b8" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "12px 0", textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#dc2626" }}>{error}</p>
        <button
          onClick={load}
          style={{
            fontSize: 11,
            color: "#0ea5e9",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (mediaList.length === 0) {
    return (
      <div style={{ padding: "16px 0", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
          No media uploaded yet.
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 10, color: "#cbd5e1" }}>
          Switch to "Upload New" to add media.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search — only shown when list is long */}
      {mediaList.length > 5 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files…"
          style={{ ...inputStyle, marginBottom: 6, fontSize: 11 }}
        />
      )}

      {/* List */}
      <div
        style={{
          maxHeight: 220,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {filtered.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#94a3b8",
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            No files match "{search}"
          </p>
        ) : (
          filtered.map((media) => {
            const isSelected = selectedMediaId === media.media_id;
            const chip = typeChip(media.type);
            return (
              <div
                key={media.wmu_id}
                onClick={() => onSelect(media)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 8px",
                  borderRadius: 7,
                  cursor: "pointer",
                  background: isSelected ? "#fef3c7" : "#f8fafc",
                  border: `1px solid ${isSelected ? "#fbbf24" : "#e2e8f0"}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }
                }}
              >
                {/* Type badge */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: chip.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: chip.color,
                      letterSpacing: 0.4,
                    }}
                  >
                    {chip.label}
                  </span>
                </div>

                {/* File info */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#1e293b",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {media.file_name}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                    {[fmtSize(media.size_bytes), media.uploaded_at
                      ? new Date(media.uploaded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                      : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {/* Selected tick */}
                {isSelected && (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#d97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: "#fff", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>
                      ✓
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Count footer */}
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 10,
          color: "#cbd5e1",
          textAlign: "right",
        }}
      >
        {mediaList.length} file{mediaList.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Media picker (upload + gallery tabs) ──────────────────────────────────────
function MediaPickerField({ config, onChange, mediaType, accountId, userId }) {
  const [mode, setMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const accept =
    mediaType === "IMAGE"
      ? "image/*"
      : mediaType === "VIDEO"
        ? "video/*"
        : "application/pdf";

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const accRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/waccount/get-waccount?user_id=${userId}`,
      );
      const accData = await accRes.json();
      const acc = accData.data;
      if (!acc) throw new Error("Account not found");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", file.type);
      fd.append("messaging_product", "whatsapp");

      const waRes = await fetch(
        `https://graph.facebook.com/v21.0/${acc.phone_number_id}/media`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${acc.system_user_access_token}` },
          body: fd,
        },
      );
      const waData = await waRes.json();
      if (!waRes.ok) throw new Error(waData.error?.message || "Upload failed");

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/media/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          media_id: waData.id,
          file_name: file.name,
          type: file.type,
          mime_type: file.type,
          size_bytes: file.size,
        }),
      });

      onChange({ ...config, media_id: waData.id, media_name: file.name });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Selected state ────────────────────────────────────────────────────────────
  if (config.media_id) {
    return (
      <div style={fieldStyle}>
        <label style={labelStyle}>MEDIA ({mediaType})</label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 10px",
            background: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: 6,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#166534",
              fontWeight: 600,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            ✓ {config.media_name || config.media_id}
          </span>
          <button
            onClick={() => onChange({ ...config, media_id: "", media_name: "" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#dc2626",
              padding: 0,
              display: "flex",
              flexShrink: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── Picker ────────────────────────────────────────────────────────────────────
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        MEDIA ({mediaType}) <span style={{ color: "#ef4444" }}>*</span>
      </label>

      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[
          { id: "upload", label: "Upload New" },
          { id: "gallery", label: "From Gallery" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              flex: 1,
              padding: "5px 0",
              fontSize: 10,
              fontWeight: 600,
              border: "1px solid",
              borderRadius: 5,
              cursor: "pointer",
              borderColor: mode === id ? "#d97706" : "#e2e8f0",
              background: mode === id ? "#fef3c7" : "#f8fafc",
              color: mode === id ? "#92400e" : "#64748b",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {mode === "upload" && (
        <>
          <label
            style={{
              display: "block",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            <div
              style={{
                border: "2px dashed",
                borderColor: uploading ? "#d97706" : "#e2e8f0",
                borderRadius: 8,
                padding: "18px 10px",
                textAlign: "center",
                background: uploading ? "#fffbeb" : "#f8fafc",
              }}
            >
              {uploading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Loader2
                    size={14}
                    color="#d97706"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  <span style={{ fontSize: 11, color: "#d97706" }}>
                    Uploading…
                  </span>
                </div>
              ) : (
                <>
                  <Upload
                    size={16}
                    color="#94a3b8"
                    style={{ display: "block", margin: "0 auto 4px" }}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 2,
                    }}
                  >
                    Click to upload
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {mediaType === "IMAGE"
                      ? "PNG, JPG (max 5 MB)"
                      : mediaType === "VIDEO"
                        ? "MP4 (max 16 MB)"
                        : "PDF (max 100 MB)"}
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              accept={accept}
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) =>
                e.target.files[0] && handleUpload(e.target.files[0])
              }
            />
          </label>
          {uploadError && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 10,
                color: "#dc2626",
                lineHeight: 1.4,
              }}
            >
              {uploadError}
            </p>
          )}
        </>
      )}

      {/* Gallery tab — compact list view */}
      {mode === "gallery" && (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "8px 8px 4px",
            background: "#fafafa",
          }}
        >
          <CompactMediaList
            accountId={accountId}
            mediaType={mediaType}
            onSelect={(media) =>
              onChange({
                ...config,
                media_id: media.media_id,
                media_name: media.file_name,
              })
            }
            selectedMediaId={config.media_id}
          />
        </div>
      )}
    </div>
  );
}

// ── Schedule Message config editor ────────────────────────────────────────────
function ScheduleMessageEditor({ config, onChange, templates = [], userId, accountId }) {
  const update = (key, value) => onChange({ ...config, [key]: value });

  const extractVars = (components) => {
    const body = components?.find((c) => c.type === "BODY");
    if (!body?.text) return [];
    const matches = body.text.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))].sort(
      (a, b) => Number(a) - Number(b),
    );
  };

  const selectedTpl = templates.find((t) => t.name === config.template_name);
  const variables = selectedTpl ? extractVars(selectedTpl.components) : [];
  const bodyComp = selectedTpl?.components?.find((c) => c.type === "BODY");
  const headerComp = selectedTpl?.components?.find((c) => c.type === "HEADER");
  const isMediaTemplate =
    headerComp && ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerComp.format);

  const TIMEZONES = [
    { value: "Asia/Kolkata", label: "India (IST)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern (ET)" },
    { value: "America/Chicago", label: "Central (CT)" },
    { value: "America/Los_Angeles", label: "Pacific (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Asia/Singapore", label: "Singapore (SGT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  ];

  const DELAY_PRESETS = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 120, label: "2 hours" },
    { value: 360, label: "6 hours" },
    { value: 720, label: "12 hours" },
    { value: 1440, label: "1 day" },
    { value: 2880, label: "2 days" },
    { value: 4320, label: "3 days" },
    { value: 10080, label: "1 week" },
  ];

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
                onChange({
                  ...config,
                  template_name: "",
                  template_id: "",
                  template_variable_map: {},
                  header_format: "",
                  media_id: "",
                  media_name: "",
                });
                return;
              }
              onChange({
                ...config,
                template_name: t.name,
                template_id: t.id,
                template_variable_map: {},
                header_format:
                  t.components?.find((c) => c.type === "HEADER")?.format || "",
                media_id: "",
                media_name: "",
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
      {selectedTpl && bodyComp && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            background: "#fef3c7",
            borderRadius: 7,
            border: "1px solid #fde68a",
            fontSize: 11,
            color: "#374151",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}
        >
          {bodyComp.text}
        </div>
      )}

      {/* Variable mapping */}
      {variables.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>VARIABLE MAPPING</label>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
            Map each {"{{n}}"} to a session variable
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
                  color: "#92400e",
                  background: "#fde68a",
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

      {/* Media picker — only for media header templates */}
      {isMediaTemplate && (
        <MediaPickerField
          config={config}
          onChange={onChange}
          mediaType={headerComp.format}
          accountId={accountId}
          userId={userId}
        />
      )}

      {/* Schedule type — delay from now only */}
      <div style={fieldStyle}>
        <label style={labelStyle}>SCHEDULE TYPE</label>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 10px",
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            color: "#92400e",
            marginBottom: 10,
          }}
        >
          Delay from now
        </div>
        <label style={labelStyle}>SEND AFTER</label>
        <select
          value={config.delay_minutes || 60}
          onChange={(e) => update("delay_minutes", Number(e.target.value))}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {DELAY_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
          Scheduled relative to when this node is reached. e.g. node reached at
          6 pm + 30 min delay → sends at 6:30 pm.
        </p>
      </div>

      {/* Timezone */}
      <SelectField
        label="TIMEZONE"
        value={config.timezone || "Asia/Kolkata"}
        onChange={(v) => update("timezone", v)}
        options={TIMEZONES}
      />

      {/* Info box */}
      <div
        style={{
          padding: "9px 11px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: 7,
          fontSize: 10,
          color: "#92400e",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: "0 0 4px", fontWeight: 700 }}>How this node works</p>
        <ul style={{ margin: 0, paddingLeft: 14 }}>
          <li>Creates a scheduled message when the flow reaches this node</li>
          <li>The template is sent to the contact at the scheduled time</li>
          <li>Flow continues to the next node immediately after scheduling</li>
        </ul>
      </div>
    </>
  );
}

// ── AI Agent config editor ─────────────────────────────────────────────────────
function AiAgentEditor({ config, onChange, agents = [], agentsLoading }) {
  const update = (key, value) => onChange({ ...config, [key]: value });

  const selectedAgent = agents.find((a) => a.agent_id === config.agent_id);

  return (
    <div>
      {/* Agent selector */}
      <div style={fieldStyle}>
        <label style={labelStyle}>SELECT AGENT</label>

        {agentsLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 11,
              color: "#94a3b8",
            }}
          >
            <Loader2
              size={11}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Loading agents…
          </div>
        ) : agents.length === 0 ? (
          <div
            style={{
              padding: "10px 12px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 7,
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <AlertTriangle
                size={12}
                color="#f97316"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#c2410c",
                  }}
                >
                  No agents found
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: "#9a3412",
                    lineHeight: 1.5,
                  }}
                >
                  Create an agent first from the Agents section, then come back
                  to use it here.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <select
            value={config.agent_id || ""}
            onChange={(e) => {
              const agent = agents.find((a) => a.agent_id === e.target.value);
              onChange({
                ...config,
                agent_id: agent?.agent_id || "",
                agent_name: agent?.name || "",
              });
            }}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">Select an agent…</option>
            {agents.map((a) => (
              <option key={a.agent_id} value={a.agent_id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Selected agent preview card */}
      {selectedAgent && (
        <div
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            background: "#faf5ff",
            borderRadius: 8,
            border: "1px solid #e9d5ff",
          }}
        >
          {/* Agent name + model */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                background: "#7c3aed",
                borderRadius: 5,
                padding: 3,
                display: "flex",
              }}
            >
              <Sparkles size={10} color="#fff" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#4c1d95" }}>
              {selectedAgent.name}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 9,
                fontWeight: 700,
                background: "#ede9fe",
                color: "#6d28d9",
                borderRadius: 4,
                padding: "2px 6px",
                letterSpacing: 0.3,
              }}
            >
              {selectedAgent.model === "claude-haiku-4-5-20251001"
                ? "Haiku"
                : selectedAgent.model === "claude-sonnet-4-6"
                  ? "Sonnet"
                  : "Opus"}
            </span>
          </div>

          {/* Description */}
          {selectedAgent.description && (
            <p
              style={{
                margin: "0 0 7px",
                fontSize: 11,
                color: "#6d28d9",
                lineHeight: 1.5,
                opacity: 0.8,
              }}
            >
              {selectedAgent.description}
            </p>
          )}

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10,
                background: "#ede9fe",
                color: "#6d28d9",
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              Max {selectedAgent.max_turns} turns
            </span>
            <span
              style={{
                fontSize: 10,
                background: "#ede9fe",
                color: "#6d28d9",
                borderRadius: 4,
                padding: "2px 7px",
              }}
            >
              {selectedAgent.fallback_action === "handoff_to_agent"
                ? "→ Handoff"
                : "→ End flow"}
            </span>
            {selectedAgent.exit_keywords?.length > 0 && (
              <span
                style={{
                  fontSize: 10,
                  background: "#ede9fe",
                  color: "#6d28d9",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                {selectedAgent.exit_keywords.length} exit keyword
                {selectedAgent.exit_keywords.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Save response as */}
      <TextField
        label="SAVE LAST RESPONSE AS (optional)"
        value={config.save_response_as}
        onChange={(v) => update("save_response_as", v)}
        placeholder="agent_reply"
      />
      <p
        style={{
          margin: "-8px 0 12px",
          fontSize: 10,
          color: "#94a3b8",
          lineHeight: 1.5,
        }}
      >
        Store the agent's final reply in a session variable so later nodes can
        use it.
      </p>

      {/* How it works info box */}
      <div
        style={{
          padding: "9px 11px",
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 7,
          fontSize: 10,
          color: "#0369a1",
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
          How this node works
        </p>
        <ul style={{ margin: 0, paddingLeft: 14 }}>
          <li>
            The agent handles the conversation until the user exits or max turns
            is reached
          </li>
          <li>When done, the flow continues to the next connected node</li>
          <li>Exit keywords defined on the agent will break out immediately</li>
        </ul>
      </div>
    </div>
  );
}

// ── Main config editor switch ──────────────────────────────────────────────────
function ConfigEditor({
  type,
  config,
  onChange,
  templates = [],
  agents = [],
  agentsLoading = false,
  userId,
  accountId,
}) {
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
        return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))].sort(
          (a, b) => Number(a) - Number(b),
        );
      };

      const selectedTpl = templates.find(
        (t) => t.name === config.template_name,
      );
      const variables = selectedTpl ? extractVars(selectedTpl.components) : [];
      const headerComp = selectedTpl?.components?.find(
        (c) => c.type === "HEADER",
      );
      const bodyComp = selectedTpl?.components?.find((c) => c.type === "BODY");
      const buttonComp = selectedTpl?.components?.find(
        (c) => c.type === "BUTTONS",
      );
      const isMediaTemplate =
        headerComp && ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerComp.format);

      return (
        <>
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
                  const t = templates.find(
                    (tpl) => tpl.name === e.target.value,
                  );
                  if (!t) {
                    onChange({
                      ...config,
                      template_name: "",
                      template_id: "",
                      template_variable_map: {},
                      header_format: "",
                      media_id: "",
                      media_name: "",
                    });
                    return;
                  }
                  onChange({
                    ...config,
                    template_name: t.name,
                    template_id: t.id,
                    template_variable_map: {},
                    header_format:
                      t.header_format ||
                      t.components?.find((c) => c.type === "HEADER")?.format ||
                      "",
                    media_id: "",
                    media_name: "",
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
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
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

          {variables.length > 0 && (
            <div>
              <label style={labelStyle}>VARIABLE MAPPING</label>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 10,
                  color: "#94a3b8",
                  lineHeight: 1.5,
                }}
              >
                Map each {"{{n}}"} to a session variable (e.g. {"{{name}}"})
              </p>
              {variables.map((pos) => (
                <div
                  key={pos}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                  }}
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

          {isMediaTemplate && (
            <MediaPickerField
              config={config}
              onChange={onChange}
              mediaType={headerComp.format}
              accountId={accountId}
              userId={userId}
            />
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

    case "ai_agent":
      return (
        <AiAgentEditor
          config={config}
          onChange={onChange}
          agents={agents}
          agentsLoading={agentsLoading}
        />
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

    case "schedule_message":
      return (
        <ScheduleMessageEditor
          config={config}
          onChange={onChange}
          templates={templates}
          userId={userId}
          accountId={accountId}
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
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            This flow will start when triggered via the API. No additional
            configuration needed.
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

// ── Exported panel ─────────────────────────────────────────────────────────────
export default function NodeProperties({
  node,
  onChange,
  onClose,
  templates,
  agents,
  agentsLoading,
  userId,
  accountId,
}) {
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
          agents={agents}
          agentsLoading={agentsLoading}
          userId={userId}
          accountId={accountId}
        />
      </div>

      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
