import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Languages,
  LayoutTemplate,
  MessageSquareText,
  MoreVertical,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";
import { deleteMetaTemplate, fetchMetaTemplates } from "../api/templates";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const STATUS_STYLES = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
  PAUSED: "bg-slate-100 text-slate-700 border-slate-200",
};

const getComponent = (template, type) =>
  template?.components?.find((component) => component.type === type);

const getBodyText = (template) => getComponent(template, "BODY")?.text || "";

const getHeaderComponent = (template) => getComponent(template, "HEADER");

const getButtons = (template) =>
  getComponent(template, "BUTTONS")?.buttons || [];

const getHeaderMediaUrl = (template, userId) => {
  const header = getHeaderComponent(template);
  const mediaSource = header?.example?.header_handle?.[0];

  if (!mediaSource || !userId) return null;

  return `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy-url?url=${encodeURIComponent(
    mediaSource,
  )}&user_id=${userId}`;
};

const formatTemplateText = (text = "", values = []) => {
  if (!text) return "No body content";

  const positionalValues = Array.isArray(values) ? values : [];

  return text.replace(/\{\{(\d+)\}\}/g, (match, index) => {
    return positionalValues[Number(index) - 1] || match;
  });
};

function TemplatePhonePreview({ template, userId }) {
  const header = getHeaderComponent(template);
  const body = getComponent(template, "BODY");
  const footer = getComponent(template, "FOOTER");
  const buttons = getButtons(template);

  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const mediaUrl = getHeaderMediaUrl(template, userId);
  const mediaType = header?.format?.toLowerCase();
  const headerText = header?.text;
  const bodyText = formatTemplateText(
    body?.text,
    body?.example?.body_text?.[0] || [],
  );

  useEffect(() => {
    setIsMediaLoading(true);
    setMediaError(false);
  }, [template?.id]);

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-slate-900 p-3 shadow-2xl">
      <div className="overflow-hidden rounded-[1.6rem] bg-[#e8f5e9]">
        <div className="flex items-center justify-between bg-[#103529] px-4 py-3 text-white">
          <div>
            <p className="text-sm font-semibold">WhatsApp preview</p>
            <p className="text-xs text-white/70">Business template</p>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        <div
          className="min-h-[28rem] space-y-3 bg-cover bg-center p-4"
          style={{
            backgroundImage:
              "linear-gradient(rgba(235,252,240,0.94), rgba(235,252,240,0.94)), url('/wa-bg.png')",
          }}
        >
          <div className="ml-auto max-w-[92%] overflow-hidden rounded-[1.4rem] rounded-tr-md bg-white shadow-lg">
            {mediaUrl && (
              <div className="relative min-h-40 bg-slate-100">
                {isMediaLoading && !mediaError && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                    Loading media...
                  </div>
                )}

                {mediaError ? (
                  <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-slate-500">
                    Media preview unavailable
                  </div>
                ) : mediaType === "image" ? (
                  <img
                    src={mediaUrl}
                    alt={template.name}
                    className="max-h-72 w-full object-cover"
                    onLoad={() => setIsMediaLoading(false)}
                    onError={() => {
                      setIsMediaLoading(false);
                      setMediaError(true);
                    }}
                  />
                ) : mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="max-h-72 w-full bg-black"
                    onLoadedData={() => setIsMediaLoading(false)}
                    onError={() => {
                      setIsMediaLoading(false);
                      setMediaError(true);
                    }}
                  />
                ) : (
                  <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-slate-500">
                    {header?.format || "Media"} header attached
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 px-4 py-4 text-[15px] leading-6 text-slate-800">
              {headerText && (
                <p className="text-sm font-semibold text-slate-900">
                  {headerText}
                </p>
              )}

              <p className="whitespace-pre-wrap">{bodyText}</p>

              {footer?.text && (
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {footer.text}
                </p>
              )}

              <p className="text-right text-[11px] text-slate-400">12:07 PM</p>
            </div>

            {buttons.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                <div className="space-y-2">
                  {buttons.map((button, index) => (
                    <button
                      key={`${button.text}-${index}`}
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-sky-700"
                    >
                      {button.type === "PHONE_NUMBER" ||
                      button.type === "URL" ? (
                        <ArrowRight className="h-4 w-4" />
                      ) : (
                        <MessageSquareText className="h-4 w-4" />
                      )}
                      {button.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewDrawer({ template, userId, onClose, onSend }) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const buttons = getButtons(template);
  const header = getHeaderComponent(template);
  const body = getComponent(template, "BODY");

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close preview"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-white/20 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">
                Template Preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {template.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLES[template.status] ||
                    "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {template.status}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {template.category || "Uncategorized"}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {template.language || "Unknown language"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <TemplatePhonePreview template={template} userId={userId} />

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Template Details
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Name</span>
                  <span className="font-medium text-slate-900">
                    {template.name}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Category</span>
                  <span className="font-medium text-slate-900">
                    {template.category || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Language</span>
                  <span className="font-medium text-slate-900">
                    {template.language || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Format</span>
                  <span className="font-medium text-slate-900">
                    {template.parameter_format || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Header</span>
                  <span className="font-medium uppercase text-slate-900">
                    {header?.format || header?.type || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Buttons</span>
                  <span className="font-medium text-slate-900">
                    {buttons.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Body Content
              </h3>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {body?.text || "No body content"}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Quick Actions
              </h3>
              <div className="mt-4 space-y-3">
                {template.status === "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => onSend(template.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    <Send className="h-4 w-4" />
                    Send Template
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TemplateCard({
  template,
  isMenuOpen,
  onMenuToggle,
  onPreview,
  onSend,
  onDelete,
  attachMenuRef,
}) {
  const header = getHeaderComponent(template);
  const buttons = getButtons(template);
  const bodyText = getBodyText(template);
  const previewText =
    bodyText.length > 120 ? `${bodyText.slice(0, 120)}...` : bodyText;

  return (
    <article className="group rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[template.status] ||
                "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              {template.status}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {template.category || "Uncategorized"}
            </span>
          </div>

          <h3 className="mt-4 truncate text-xl font-semibold text-slate-900">
            {template.name}
          </h3>
          <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">
            {previewText || "No body content added to this template yet."}
          </p>
        </div>

        {/* <div
          className="relative shrink-0"
          ref={isMenuOpen ? attachMenuRef : null}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMenuToggle();
            }}
            className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Template actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <button
                type="button"
                onClick={onPreview}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              {template.status === "APPROVED" && (
                <button
                  type="button"
                  onClick={() => onSend(template.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-sky-700 transition hover:bg-sky-50"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              )}

              <button
                type="button"
                onClick={() => onDelete(template)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-rose-700 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div> */}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Languages className="h-4 w-4" />
            Language
          </div>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {template.language || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {header?.format === "IMAGE" ? (
              <ImageIcon className="h-4 w-4" />
            ) : header?.format === "VIDEO" ? (
              <Video className="h-4 w-4" />
            ) : (
              <LayoutTemplate className="h-4 w-4" />
            )}
            Header
          </div>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {header?.format || "None"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <MessageSquareText className="h-4 w-4" />
            Buttons
          </div>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {buttons.length > 0 ? `${buttons.length} attached` : "No buttons"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        {template.status === "APPROVED" && (
          <button
            type="button"
            onClick={() => onSend(template.id)}
            className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(template)}
          className="flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function TemplateList() {
  const { userId } = useAuthUser();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const menuRef = useRef(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetchMetaTemplates(userId);
      setTemplates(res?.data?.templates || []);
    } catch (error) {
      console.error(error);
      showError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTemplates();
    }
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (!openMenuId) return undefined;

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleDelete = async (template) => {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    const toastId = showLoading("Deleting template...");

    try {
      await deleteMetaTemplate(template.id, template.name, userId);
      dismissToast(toastId);
      showSuccess("Template deleted");

      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(null);
      }

      loadTemplates();
    } catch (error) {
      dismissToast(toastId);
      console.error(error);
      showError("Failed to delete template");
    }
  };

  const approvedTemplates = templates.filter(
    (template) => template.status === "APPROVED",
  ).length;
  const pendingTemplates = templates.filter(
    (template) => template.status === "PENDING",
  ).length;

  const filteredTemplates = templates.filter((template) => {
    const query = search.trim().toLowerCase();
    const bodyText = getBodyText(template).toLowerCase();
    const matchesSearch =
      !query ||
      template.name?.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query) ||
      template.language?.toLowerCase().includes(query) ||
      bodyText.includes(query);
    const matchesStatus =
      statusFilter === "ALL" ? true : template.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(134,239,172,0.22),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-600">
                  WhatsApp Templates
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900">
                  Manage, preview, and send your approved Meta templates.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  This view is rebuilt around template discovery. Users can scan
                  status quickly, open a right-side preview drawer, and start
                  template creation directly from this page.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/template/create")}
                    className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </button>

                  <button
                    type="button"
                    onClick={loadTemplates}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Refresh List
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[1.75rem] bg-slate-900 p-5 text-white shadow-lg">
                  <p className="text-sm text-white">Total templates</p>
                  <p className="mt-3 text-4xl font-semibold text-white">
                    {templates.length}
                  </p>
                </div>
                <div className="rounded-[1.75rem] bg-emerald-50 p-5 ring-1 ring-emerald-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">
                      Approved
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {approvedTemplates}
                  </p>
                </div>
                <div className="rounded-[1.75rem] bg-amber-50 p-5 ring-1 ring-amber-100">
                  <div className="flex items-center gap-3">
                    <LayoutTemplate className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium text-amber-700">
                      Pending review
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {pendingTemplates}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_15px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Template Library
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search by name, body copy, category, or language.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search templates"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 sm:min-w-72"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                >
                  <option value="ALL">All statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            </div>
          </section>

          {loading && (
            <div className="rounded-[2rem] border border-white/70 bg-white/90 px-6 py-16 text-center text-slate-500 shadow-sm">
              Loading templates...
            </div>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-6 py-16 text-center shadow-sm">
              <div className="mx-auto max-w-md">
                <h3 className="text-xl font-semibold text-slate-900">
                  No templates match this view
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Try a different search or status filter. If you have not
                  created any templates yet, start from the create action above.
                </p>
              </div>
            </div>
          )}

          {!loading && filteredTemplates.length > 0 && (
            <section className="grid gap-5 grid-cols-1 sm:grid-cols-2">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isMenuOpen={openMenuId === template.id}
                  attachMenuRef={menuRef}
                  onMenuToggle={() =>
                    setOpenMenuId((current) =>
                      current === template.id ? null : template.id,
                    )
                  }
                  onPreview={() => {
                    setSelectedTemplate(template);
                    setOpenMenuId(null);
                  }}
                  onSend={(templateId) => {
                    setOpenMenuId(null);
                    navigate(`/templates/send/${templateId}`);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </section>
          )}
        </div>
      </div>

      {selectedTemplate && (
        <PreviewDrawer
          template={selectedTemplate}
          userId={userId}
          onClose={() => setSelectedTemplate(null)}
          onSend={(templateId) => navigate(`/templates/send/${templateId}`)}
        />
      )}
    </>
  );
}
