// src/components/SamvaadikAssistant.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  samvaadikChat,
  previewGroupFromCsv,
  createGroupFromCsv,
} from "../api/agents";
import { getSupabaseUploadUrl, prepareMediaHeader, deleteMedia } from "../api/media";
import "../styles/SamvaadikAssistant.css";

// ── Suggestions ───────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  {
    label: "Create a new campaign",
    prompt: "I want to create a new campaign",
    icon: <IconCampaign />,
  },
  {
    label: "Create a contact group",
    prompt: "I want to create a new contact group",
    icon: <IconGroups />,
  },
  {
    label: "Create a template",
    prompt: "I want to create a new WhatsApp message template",
    icon: <IconTemplate />,
  },
  {
    label: "Schedule a campaign for later",
    prompt: "Help me schedule a campaign for later today",
    icon: <IconClock />,
  },
];

// ── Loading step detector ─────────────────────────────────────────────────────

function detectLoadingSteps(message) {
  if (!message) return [{ id: "think", label: "Processing request" }];
  const m = message.toLowerCase();
  const steps = [];
  if (m.includes("group") || m.includes("contact"))
    steps.push({ id: "groups", label: "Searching contact groups" });
  if (m.includes("template"))
    steps.push({ id: "templates", label: "Fetching templates" });
  if (m.includes("media") || m.includes("image") || m.includes("video"))
    steps.push({ id: "media", label: "Processing media" });
  if (
    m.includes("campaign") ||
    m.includes("create") ||
    m.includes("schedule") ||
    m.includes("send")
  )
    steps.push({ id: "campaign", label: "Building campaign" });
  if (
    (m.includes("show") || m.includes("list") || m.includes("what")) &&
    steps.length === 0
  )
    steps.push({ id: "fetch", label: "Fetching data" });
  if (steps.length === 0)
    steps.push({ id: "think", label: "Processing request" });
  return steps;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isConfirmation(text) {
  return /^(yes|yeah|yep|confirm|go ahead|sure|ok|okay|proceed|do it|create it|create group)$/i.test(
    text.trim(),
  );
}

// ── Message content renderer ──────────────────────────────────────────────────

function FormattedMessage({ content, onNavigateToTemplates }) {
  const hasRedirect = content.includes("REDIRECT_TO_TEMPLATES:");

  const cleanContent = content
    .replace(/^REDIRECT_TO_TEMPLATES:\s*/m, "")
    .replace(/REDIRECT_TO_TEMPLATES:\s*/g, "");

  const hasSummary = cleanContent.includes("───────");

  const renderWithRedirect = (body) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {body}
      <button className="sai-redirect-btn" onClick={onNavigateToTemplates}>
        <IconTemplate size={14} />
        <span>Open Templates Page</span>
        <IconArrow size={13} />
      </button>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
        After uploading your media, come back here and say "I uploaded the
        media" to continue.
      </p>
    </div>
  );

  if (!hasSummary) {
    const body = <InlineText text={cleanContent} />;
    return hasRedirect ? renderWithRedirect(body) : body;
  }

  const parts = cleanContent.split(/(─{3,}[\s\S]*?─{3,})/);
  const rendered = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {parts.map((part, i) => {
        if (part.match(/^─{3,}/)) {
          const lines = part
            .replace(/─{3,}/g, "")
            .trim()
            .split("\n")
            .filter(Boolean);
          return (
            <div key={i} className="sai-summary-card">
              {lines.map((line, j) => {
                if (
                  line.trim() === "Campaign Summary" ||
                  line.trim() === "Group Summary" ||
                  line.trim() === "Template Preview"
                ) {
                  return (
                    <div key={j} className="sai-summary-title">
                      {line.trim()}
                    </div>
                  );
                }
                if (line.includes(":")) {
                  const colonIdx = line.indexOf(":");
                  const label = line.slice(0, colonIdx).trim();
                  const value = line.slice(colonIdx + 1).trim();
                  return (
                    <div key={j} className="sai-summary-row">
                      <span className="sai-summary-label">{label}</span>
                      <span className="sai-summary-value">{value}</span>
                    </div>
                  );
                }
                return (
                  <p
                    key={j}
                    style={{ margin: 0, fontSize: 13, color: "#374151" }}
                  >
                    {line}
                  </p>
                );
              })}
            </div>
          );
        }
        return <InlineText key={i} text={part} />;
      })}
    </div>
  );

  return hasRedirect ? renderWithRedirect(rendered) : rendered;
}

function InlineText({ text }) {
  if (!text.trim()) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ fontWeight: 650 }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SamvaadikAssistant({ userId }) {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [plusOpen, setPlusOpen] = useState(false);
  const [error, setError] = useState(null);

  // Media attachment state
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [mediaAttachment, setMediaAttachment] = useState(null); // persisted across all turns
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Group creation state
  const [attachedFile, setAttachedFile] = useState(null);
  const [pendingGroupName, setPendingGroupName] = useState("");
  const [pendingGroup, setPendingGroup] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const stepTimerRef = useRef(null);
  const idRef = useRef(0);

  const nextId = () => `msg_${++idRef.current}`;

  const handleNavigateToTemplates = useCallback(() => {
    closePanel();
    setTimeout(() => navigate("/templates"), 300);
  }, [navigate]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setPanelVisible(true), 10);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setPanelVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    clearInterval(stepTimerRef.current);
    if (!loading || loadingSteps.length <= 1) return;
    setActiveStep(0);
    stepTimerRef.current = setInterval(() => {
      setActiveStep((s) => (s + 1) % loadingSteps.length);
    }, 1400);
    return () => clearInterval(stepTimerRef.current);
  }, [loading, loadingSteps]);

  // Routes CSV/Excel → group creation flow; image/video/doc → media attachment flow
  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";

      const isSpreadsheet =
        /\.(csv|xlsx|xls)$/i.test(file.name) || file.type === "text/csv";

      if (isSpreadsheet) {
        setAttachedFile({ file, name: file.name });
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      // Media flow — 2-step to bypass Vercel 4.5 MB body limit:
      // browser PUTs file straight to Supabase, backend only receives a JSON path
      setUploadingMedia(true);
      setError(null);
      try {
        const sizeMB = file.size / (1024 * 1024);
        if (
          file.type === "image/jpeg" ||
          file.type === "image/png" ||
          file.type === "image/webp"
        ) {
          if (sizeMB > 5) throw new Error("Image must be less than 5 MB.");
        } else if (
          file.type === "video/mp4" ||
          file.type === "video/3gpp" ||
          file.type === "video/quicktime"
        ) {
          if (sizeMB > 16) throw new Error("Video must be less than 16 MB.");
        } else {
          if (sizeMB > 100) throw new Error("Document must be less than 100 MB.");
        }

        // Step 1: get signed Supabase upload URL (tiny JSON request, never hits Vercel limit)
        const { data: urlData } = await getSupabaseUploadUrl({
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
        });

        // Step 2: PUT file directly to Supabase — bypasses Vercel entirely
        const putResp = await fetch(urlData.signed_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!putResp.ok)
          throw new Error("Upload to storage failed: " + putResp.statusText);

        // Step 3: backend downloads from Supabase → uploads to Meta → returns handles
        const { data: headerData } = await prepareMediaHeader({
          user_id: userId,
          storage_path: urlData.storage_path,
          file_name: file.name,
          file_type: file.type,
        });

        const attachment = {
          header_handle: headerData.header_handle,
          header_format: headerData.header_format,
          media_id: headerData.media_id,
          file_name: file.name,
        };
        setPendingAttachment(attachment);
        setMediaAttachment(attachment); // persist so every subsequent turn includes it
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to process media. Please try again.",
        );
      } finally {
        setUploadingMedia(false);
      }
    },
    [userId],
  );

  // Delete uploaded media from DB and clear attachment state
  const handleRemoveAttachment = useCallback(async () => {
    const mediaId = pendingAttachment?.media_id;
    setPendingAttachment(null);
    setMediaAttachment(null);
    if (mediaId) {
      try {
        await deleteMedia(mediaId, userId);
      } catch {
        // deletion failure is non-blocking — media will expire on its own
      }
    }
  }, [pendingAttachment, userId]);

  // Step 1 of group creation: parse CSV and show preview
  const runPreview = useCallback(
    async (file, groupName) => {
      setLoading(true);
      setLoadingSteps([
        { id: "read", label: "Reading your file" },
        { id: "parse", label: "Parsing contacts" },
      ]);
      setActiveStep(0);

      try {
        const { data } = await previewGroupFromCsv(userId, groupName, file);

        const skippedNote =
          data.skipped > 0
            ? ` (${data.skipped} rows skipped — missing phone)`
            : "";
        const sampleLines = data.sample
          .map((c) => `• ${c.full_name || "No name"} — ${c.phone_number}`)
          .join("\n");

        const summaryMsg =
          `Here is a preview of your group:\n\n` +
          `───────────────────────\n` +
          `Group Summary\n` +
          `Name: ${data.group_name}\n` +
          `Contacts: ${data.contact_count}${skippedNote}\n` +
          `───────────────────────\n` +
          `Sample contacts:\n${sampleLines}\n\n` +
          `Shall I go ahead and create this group?`;

        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: summaryMsg },
        ]);
        setPendingGroup({
          groupName: data.group_name,
          contacts: data.contacts,
          contactCount: data.contact_count,
        });
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            "Failed to read the file. Please check the format.",
        );
      } finally {
        setLoading(false);
        setLoadingSteps([]);
        setAttachedFile(null);
        setPendingGroupName("");
      }
    },
    [userId],
  );

  // Step 2 of group creation: create the group after confirmation
  const confirmGroupCreation = useCallback(async () => {
    if (!pendingGroup) return;
    const { groupName, contacts } = pendingGroup;

    setLoading(true);
    setLoadingSteps([
      { id: "create", label: "Creating group" },
      { id: "contacts", label: "Importing contacts" },
    ]);
    setActiveStep(0);

    try {
      const { data } = await createGroupFromCsv(
        userId,
        groupName,
        "",
        contacts,
      );
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: data.message },
      ]);
      setPendingGroup(null);
      setPendingGroupName("");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Failed to create group. Please try again.",
      );
    } finally {
      setLoading(false);
      setLoadingSteps([]);
    }
  }, [pendingGroup, userId]);

  const sendMessage = useCallback(
    async (text) => {
      const userText = (text || input).trim();
      if ((!userText && !attachedFile) || loading) return;

      // pendingAttachment: used only to show the chip on the user bubble
      // mediaAttachment: sent on every turn until the chat is cleared
      const chipAttachment = pendingAttachment;

      setInput("");
      setError(null);
      setPlusOpen(false);
      if (inputRef.current) inputRef.current.style.height = "auto";
      setPendingAttachment(null);

      // CASE 1: CSV file attached → run group preview
      if (attachedFile) {
        const fileToUpload = attachedFile.file;
        const fileName = attachedFile.name;
        setAttachedFile(null);
        const gName =
          userText ||
          pendingGroupName ||
          fileName
            .replace(/\.(csv|xlsx|xls)$/i, "")
            .replace(/[-_]/g, " ")
            .trim();
        const displayContent = userText || `Uploading file: ${fileName}`;
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "user", content: displayContent },
        ]);
        await runPreview(fileToUpload, gName);
        return;
      }

      // CASE 2: Pending group — user confirms
      if (pendingGroup && isConfirmation(userText)) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "user", content: userText },
        ]);
        await confirmGroupCreation();
        return;
      }

      // CASE 3: Pending group — user cancels
      if (
        pendingGroup &&
        /^(no|cancel|stop|abort|never mind)$/i.test(userText.trim())
      ) {
        setPendingGroup(null);
        setPendingGroupName("");
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "user", content: userText },
          {
            id: nextId(),
            role: "assistant",
            content: "No problem, the group creation has been cancelled.",
          },
        ]);
        return;
      }

      // CASE 4: Extract group name from message for later use
      const groupMatch = userText.match(
        /(?:create|make|add|new)\s+(?:a\s+)?group\s+(?:called|named?|:)?\s*["']?([^"'\n,]{2,40})["']?/i,
      );
      if (groupMatch) setPendingGroupName(groupMatch[1].trim());

      // CASE 5: Regular AI chat (with optional media attachment)
      const userMsg = {
        id: nextId(),
        role: "user",
        content: userText,
        attachment: chipAttachment || undefined,
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);
      setLoadingSteps(detectLoadingSteps(userText));
      setActiveStep(0);

      try {
        const { data } = await samvaadikChat(
          userId,
          updatedMessages.map(({ role, content }) => ({ role, content })),
          mediaAttachment, // always include until chat is cleared
        );
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: data.content },
        ]);
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            "Something went wrong. Please try again.",
        );
      } finally {
        setLoading(false);
        setLoadingSteps([]);
      }
    },
    [
      input,
      messages,
      loading,
      userId,
      pendingAttachment,
      mediaAttachment,
      attachedFile,
      pendingGroupName,
      pendingGroup,
      runPreview,
      confirmGroupCreation,
    ],
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const closePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setIsOpen(false), 280);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setMediaAttachment(null);
    setAttachedFile(null);
    setPendingGroup(null);
    setPendingGroupName("");
    setPendingAttachment(null);
  };

  const togglePlus = () => setPlusOpen((o) => !o);

  useEffect(() => {
    if (!plusOpen) return;
    const handler = (e) => {
      if (!e.target.closest(".sai-plus-wrap")) setPlusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [plusOpen]);

  const currentStep = loadingSteps[activeStep] || loadingSteps[0];
  const canSend =
    (input.trim() || attachedFile || pendingAttachment) && !loading;

  const placeholder = attachedFile
    ? `Type group name and hit Enter (or just hit Enter to use filename)...`
    : pendingGroup
      ? `Type "yes" to confirm or "cancel" to abort...`
      : "Ask me to create a campaign or group...";

  return (
    <>
      {/* FAB */}
      <button
        className="sai-fab"
        onClick={() => (isOpen ? closePanel() : setIsOpen(true))}
        aria-label="Open Samvaadik AI Assistant"
      >
        <span className={`sai-fab-icon ${isOpen ? "sai-fab-icon--open" : ""}`}>
          {isOpen ? <IconClose size={16} /> : <IconAI size={17} />}
        </span>
        <span className="sai-fab-label">
          {isOpen ? "Close" : "AI Assistant"}
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className={`sai-backdrop ${panelVisible ? "sai-backdrop--visible" : ""}`}
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={`sai-panel ${panelVisible ? "sai-panel--visible" : ""}`}
        >
          {/* Header */}
          <div className="sai-header">
            <div className="sai-header-left">
              <div className="sai-header-avatar">
                <IconAI size={16} />
              </div>
              <div>
                <div className="sai-header-title">Samvaadik AI</div>
                <div className="sai-header-subtitle">
                  <span className="sai-status-dot" />
                  Agentic Assistant
                </div>
              </div>
            </div>
            <div className="sai-header-actions">
              {messages.length > 0 && (
                <button
                  className="sai-icon-btn"
                  onClick={clearChat}
                  title="New conversation"
                >
                  <IconRefresh size={15} />
                </button>
              )}
              <button
                className="sai-icon-btn"
                onClick={closePanel}
                title="Close"
              >
                <IconClose size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="sai-messages">
            {messages.length === 0 ? (
              <EmptyState onSuggest={sendMessage} />
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onNavigateToTemplates={handleNavigateToTemplates}
                />
              ))
            )}

            {loading && currentStep && (
              <div className="sai-msg">
                <div className="sai-msg-avatar sai-msg-avatar--pulse">
                  <IconAI size={12} />
                </div>
                <div className="sai-loading-card">
                  <div className="sai-loading-row">
                    <span className="sai-loading-spinner" />
                    <span className="sai-loading-label">
                      {currentStep.label}...
                    </span>
                  </div>
                  {loadingSteps.length > 1 && (
                    <div className="sai-loading-steps">
                      {loadingSteps.map((s, i) => (
                        <span
                          key={s.id}
                          className={`sai-loading-step-dot ${i === activeStep ? "sai-loading-step-dot--active" : ""}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="sai-error">
                <IconError size={14} />
                <span>{error}</span>
                <button
                  className="sai-error-dismiss"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </div>
            )}

            <div ref={bottomRef} style={{ height: 4 }} />
          </div>

          {/* CSV file pill (group creation) */}
          {attachedFile && (
            <div className="sai-file-pill">
              <IconSheet size={13} />
              <span className="sai-file-pill-name">{attachedFile.name}</span>
              <button
                className="sai-file-pill-remove"
                onClick={() => setAttachedFile(null)}
                title="Remove"
              >
                <IconClose size={11} />
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="sai-input-wrap">
            {/* Media attachment chip */}
            {(pendingAttachment || uploadingMedia) && (
              <div className="sai-attachment-chip">
                {uploadingMedia ? (
                  <>
                    <span
                      className="sai-loading-spinner"
                      style={{ width: 11, height: 11 }}
                    />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    {pendingAttachment.header_format === "IMAGE" ? (
                      <IconImage size={12} />
                    ) : pendingAttachment.header_format === "VIDEO" ? (
                      <IconVideo size={12} />
                    ) : (
                      <IconDoc size={12} />
                    )}
                    <span>{pendingAttachment.file_name}</span>
                    <button
                      className="sai-attachment-remove"
                      onClick={handleRemoveAttachment}
                      title="Remove"
                    >
                      <IconClose size={10} />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Input row */}
            <div className="sai-input-row">
              {/* Plus menu */}
              <div className="sai-plus-wrap">
                <button
                  className={`sai-plus-btn ${plusOpen ? "sai-plus-btn--open" : ""}`}
                  onClick={togglePlus}
                  title="Attach file"
                  disabled={uploadingMedia}
                >
                  <IconPlus size={17} />
                </button>

                {plusOpen && (
                  <div className="sai-plus-menu">
                    <div className="sai-plus-menu-title">Import contacts</div>
                    {[
                      {
                        label: "CSV File",
                        sub: "Import contacts",
                        icon: <IconSheet size={15} />,
                        accept: ".csv,text/csv",
                      },
                      {
                        label: "Excel File",
                        sub: "XLSX, XLS",
                        icon: <IconSheet size={15} />,
                        accept: ".xlsx,.xls",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="sai-plus-item sai-plus-item--active"
                        onClick={() => {
                          setPlusOpen(false);
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = item.accept;
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <div className="sai-plus-item-icon">{item.icon}</div>
                        <div>
                          <div className="sai-plus-item-label">
                            {item.label}
                          </div>
                          <div className="sai-plus-item-sub">{item.sub}</div>
                        </div>
                      </div>
                    ))}

                    <div className="sai-plus-menu-title">Media</div>
                    {[
                      {
                        label: "Image",
                        sub: "JPG, PNG · Max 5 MB",
                        icon: <IconImage size={15} />,
                        accept: "image/jpeg,image/png",
                      },
                      {
                        label: "Video",
                        sub: "MP4, 3GP · Max 16 MB",
                        icon: <IconVideo size={15} />,
                        accept: "video/mp4,video/3gpp",
                      },
                      {
                        label: "Document",
                        sub: "PDF, DOC, XLS · Max 100 MB",
                        icon: <IconDoc size={15} />,
                        accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="sai-plus-item sai-plus-item--active"
                        onClick={() => {
                          setPlusOpen(false);
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = item.accept;
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <div className="sai-plus-item-icon">{item.icon}</div>
                        <div>
                          <div className="sai-plus-item-label">
                            {item.label}
                          </div>
                          <div className="sai-plus-item-sub">{item.sub}</div>
                        </div>
                        {!item.accept && (
                          <span className="sai-plus-soon">Soon</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                ref={inputRef}
                className="sai-textarea"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={loading}
                rows={1}
              />

              <button
                className={`sai-send-btn ${canSend ? "sai-send-btn--active" : ""}`}
                onClick={() => sendMessage()}
                disabled={!canSend}
                title="Send"
              >
                <IconSend size={16} />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>

          <div className="sai-hint">
            <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for
            new line
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ onSuggest }) {
  return (
    <div className="sai-empty">
      <div className="sai-empty-icon">
        <IconAI size={22} />
      </div>
      <h3 className="sai-empty-title">How can I help?</h3>
      <p className="sai-empty-sub">
        Create campaigns, manage contact groups, browse templates — all through
        conversation.
      </p>
      <div className="sai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            className="sai-suggestion"
            onClick={() => onSuggest(s.prompt)}
          >
            <span className="sai-suggestion-icon">{s.icon}</span>
            <span>{s.label}</span>
            <span className="sai-suggestion-arrow">
              <IconArrow size={13} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, onNavigateToTemplates }) {
  const isUser = message.role === "user";
  const hasSummary = !isUser && message.content.includes("───────");
  const hasRedirect =
    !isUser && message.content.includes("REDIRECT_TO_TEMPLATES");
  return (
    <div className={`sai-msg ${isUser ? "sai-msg--user" : ""}`}>
      {!isUser && (
        <div className="sai-msg-avatar">
          <IconAI size={12} />
        </div>
      )}
      <div
        className={`sai-bubble ${isUser ? "sai-bubble--user" : "sai-bubble--ai"}`}
        style={
          hasSummary || hasRedirect
            ? { maxWidth: "100%", width: "100%" }
            : undefined
        }
      >
        {isUser ? (
          <>
            {message.attachment && (
              <div className="sai-bubble-attachment">
                {message.attachment.header_format === "IMAGE" ? (
                  <IconImage size={12} />
                ) : message.attachment.header_format === "VIDEO" ? (
                  <IconVideo size={12} />
                ) : (
                  <IconDoc size={12} />
                )}
                <span>{message.attachment.file_name}</span>
              </div>
            )}
            <span
              style={{
                display: "block",
                margin: 0,
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
                color: "#ffffff",
              }}
            >
              {message.content}
            </span>
          </>
        ) : (
          <FormattedMessage
            content={message.content}
            onNavigateToTemplates={onNavigateToTemplates}
          />
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconAI({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <circle
        cx="12"
        cy="3.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="20.5"
        cy="8.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="20.5"
        cy="15.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="12"
        cy="20.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="3.5"
        cy="15.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle
        cx="3.5"
        cy="8.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <line
        x1="12"
        y1="9.8"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="13.9"
        y1="10.9"
        x2="19"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="13.9"
        y1="13.1"
        x2="19"
        y2="15.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="12"
        y1="14.2"
        x2="12"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="10.1"
        y1="13.1"
        x2="5"
        y2="15.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="10.1"
        y1="10.9"
        x2="5"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
function IconClose({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
function IconRefresh({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
function IconPlus({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconSend({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  );
}
function IconArrow({ size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconError({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
function IconCampaign({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 8.5c0 4.694-4.477 8.5-10 8.5a10.9 10.9 0 01-4-.75L3 17l1.25-3.5A7.8 7.8 0 012 8.5C2 3.806 6.477 0 12 0s10 3.806 10 8.5z" />
    </svg>
  );
}
function IconGroups({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.85" />
    </svg>
  );
}
function IconTemplate({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}
function IconImage({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function IconVideo({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="15" height="10" rx="2" />
      <path d="M17 9l5-2v10l-5-2" />
    </svg>
  );
}
function IconDoc({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}
function IconSheet({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}
function IconClock({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}
