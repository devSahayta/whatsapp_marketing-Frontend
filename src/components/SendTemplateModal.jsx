// components/SendTemplateModal.jsx
// Pick an approved template and send it to the open chat.
// Templates can be sent any time, including outside WhatsApp's 24-hour window.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Images,
  Link2,
  Loader2,
  Search,
  Send,
  Type,
  UserRound,
  Video,
  X,
} from "lucide-react";
import { fetchTemplatesPaginated, sendTemplateToChat } from "../api/templates";
import { showError, showSuccess } from "../utils/toast";

const PAGE_SIZE = 20;
const MEDIA_FORMATS = ["IMAGE", "VIDEO", "DOCUMENT"];

/* ─── template helpers ─────────────────────────────────────────────────── */

const findComp = (components, type) =>
  (components || []).find((c) => (c.type || "").toUpperCase() === type);

const getPlaceholderKeys = (text) => {
  const keys = [];
  for (const m of String(text || "").matchAll(/\{\{\s*(\w+)\s*\}\}/g)) {
    if (!keys.includes(m[1])) keys.push(m[1]);
  }
  return keys.every((k) => /^\d+$/.test(k))
    ? keys.sort((a, b) => Number(a) - Number(b))
    : keys;
};

const fillPlaceholders = (text, values) =>
  String(text || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) =>
    values?.[key]?.toString().trim() ? values[key] : match,
  );

const isDynamicUrlButton = (btn) =>
  (btn?.type || "").toUpperCase() === "URL" &&
  /\{\{\s*\w+\s*\}\}/.test(btn?.url || "");

const parseList = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isCarouselTemplate = (t) =>
  !!t?.is_carousel || !!findComp(t?.components, "CAROUSEL");

/** Example values Meta approved, used as input hints. */
const getBodyExamples = (body, keys) => {
  const positional = body?.example?.body_text?.[0] || [];
  const named = body?.example?.body_text_named_params || [];
  return Object.fromEntries(
    keys.map((k, i) => [
      k,
      /^\d+$/.test(k)
        ? positional[Number(k) - 1] ?? positional[i]
        : named.find((n) => n.param_name === k)?.example,
    ]),
  );
};

/** Everything the form needs to know about a template, derived once. */
const analyzeTemplate = (template) => {
  const components = template?.components || [];
  const header = findComp(components, "HEADER");
  const body = findComp(components, "BODY");
  const footer = findComp(components, "FOOTER");
  const isCarousel = isCarouselTemplate(template);
  const headerFormat = (header?.format || "").toUpperCase();
  const bodyKeys = getPlaceholderKeys(body?.text);
  const headerKey =
    headerFormat === "TEXT" ? getPlaceholderKeys(header?.text)[0] : null;

  const urlButtons = isCarousel
    ? []
    : (findComp(components, "BUTTONS")?.buttons || [])
        .map((btn, index) => ({ ...btn, index }))
        .filter(isDynamicUrlButton);

  const cards = isCarousel ? findComp(components, "CAROUSEL")?.cards || [] : [];
  const carouselMedia = parseList(template?.carousel_media);
  const templateButtonVars = parseList(template?.button_variables);

  const cardUrlButtons = cards.flatMap((card, cardIndex) =>
    (findComp(card.components, "BUTTONS")?.buttons || [])
      .map((btn, index) => ({ ...btn, index, cardIndex }))
      .filter(isDynamicUrlButton)
      .map((btn) => ({
        ...btn,
        defaultValue:
          templateButtonVars.find((v) => Number(v.card_index) === cardIndex)
            ?.example ??
          btn.example?.[0] ??
          "",
      })),
  );

  const missingMedia = isCarousel
    ? cards
        .map((_, i) => i)
        .filter(
          (i) =>
            !carouselMedia.find((m) => Number(m.card_index) === i)?.media_id,
        )
    : MEDIA_FORMATS.includes(headerFormat) && !template?.media_id
      ? [0]
      : [];

  return {
    header,
    headerFormat,
    headerKey,
    body,
    bodyKeys,
    bodyExamples: getBodyExamples(body, bodyKeys),
    footer,
    isCarousel,
    cards,
    urlButtons,
    cardUrlButtons,
    missingMedia,
    buttons: findComp(components, "BUTTONS")?.buttons || [],
  };
};

const HeaderIcon = ({ format, className }) => {
  if (format === "IMAGE") return <ImageIcon className={className} />;
  if (format === "VIDEO") return <Video className={className} />;
  if (format === "DOCUMENT") return <FileText className={className} />;
  if (format === "TEXT") return <Type className={className} />;
  return null;
};

/* ─── component ────────────────────────────────────────────────────────── */

export default function SendTemplateModal({
  open,
  onClose,
  chatId,
  userId,
  contactName,
  phoneNumber,
  onSent,
  // Layering: the AI assistant panel sits above z-[1000], so it passes a higher one
  zIndexClass = "z-[1000]",
}) {
  // Without a chatId (AI assistant, new contact) the template is sent by phone
  // number and the backend creates the chat after WhatsApp accepts it.
  const navigate = useNavigate();
  const { getToken } = useKindeAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [bodyValues, setBodyValues] = useState({});
  const [headerValue, setHeaderValue] = useState("");
  const [buttonValues, setButtonValues] = useState({});
  const [sending, setSending] = useState(false);

  const searchRef = useRef(null);

  // Reset whenever the modal opens (or the chat changes underneath it)
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setDebouncedSearch("");
    setSelected(null);
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [open, chatId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load first page on open / search change
  useEffect(() => {
    if (!open || !userId) return;
    loadTemplates(1, true);
  }, [open, userId, debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sending, onClose]);

  const loadTemplates = async (nextPage, replace) => {
    try {
      setLoading(true);
      const res = await fetchTemplatesPaginated(userId, {
        page: nextPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: "APPROVED",
      });
      const body = res?.data || {};
      const list = body.data || [];
      setTemplates((prev) => (replace ? list : [...prev, ...list]));
      setPage(nextPage);
      setTotalPages(body.pagination?.totalPages || 1);
    } catch {
      showError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const info = useMemo(
    () => (selected ? analyzeTemplate(selected) : null),
    [selected],
  );

  const pickTemplate = (template) => {
    const a = analyzeTemplate(template);
    setSelected(template);
    setBodyValues(Object.fromEntries(a.bodyKeys.map((k) => [k, ""])));
    setHeaderValue("");
    setButtonValues(
      Object.fromEntries(
        a.cardUrlButtons.map((b) => [
          `${b.cardIndex}:${b.index}`,
          String(b.defaultValue || ""),
        ]),
      ),
    );
  };

  const missingFields = useMemo(() => {
    if (!info) return [];
    const missing = [];
    info.bodyKeys.forEach((k) => {
      if (!bodyValues[k]?.trim()) missing.push(`{{${k}}}`);
    });
    if (info.headerKey && !headerValue.trim()) missing.push("header");
    info.urlButtons.forEach((b) => {
      if (!buttonValues[`btn:${b.index}`]?.trim()) missing.push(b.text);
    });
    info.cardUrlButtons.forEach((b) => {
      if (!buttonValues[`${b.cardIndex}:${b.index}`]?.trim())
        missing.push(b.text);
    });
    return missing;
  }, [info, bodyValues, headerValue, buttonValues]);

  const canSend =
    !!info && !sending && missingFields.length === 0 && info.missingMedia.length === 0;

  const handleSend = async () => {
    if (!canSend) return;
    try {
      setSending(true);
      const token = await getToken();
      const button_variables = [
        ...info.urlButtons.map((b) => ({
          button_index: b.index,
          value: buttonValues[`btn:${b.index}`].trim(),
        })),
        ...info.cardUrlButtons.map((b) => ({
          card_index: b.cardIndex,
          button_index: b.index,
          value: buttonValues[`${b.cardIndex}:${b.index}`].trim(),
        })),
      ];

      const res = await sendTemplateToChat(
        {
          ...(chatId
            ? { chat_id: chatId }
            : { phone_number: phoneNumber, person_name: contactName || "" }),
          wt_id: selected.wt_id,
          body_variables: Object.fromEntries(
            Object.entries(bodyValues).map(([k, v]) => [k, v.trim()]),
          ),
          ...(info.headerKey && { header_variable: headerValue.trim() }),
          button_variables,
        },
        token,
      );

      showSuccess(`Template "${selected.name}" sent`);
      onSent?.(res?.data?.message || null, {
        templateName: selected.name,
        chatId: res?.data?.chat_id || chatId || null,
      });
      onClose();
    } catch (err) {
      showError(
        err?.response?.data?.error || "Failed to send template. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const firstName = contactName?.trim() || "";

  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-end justify-center sm:items-center`}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={() => !sending && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-template-title"
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            {selected && (
              <button
                type="button"
                onClick={() => !sending && setSelected(null)}
                className="mt-0.5 shrink-0 rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                aria-label="Back to template list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2
                id="send-template-title"
                className="truncate text-lg font-semibold text-slate-900"
              >
                {selected ? selected.name : "Send a template"}
              </h2>
              <p className="truncate text-sm text-slate-500">
                To {firstName || phoneNumber}
                {firstName && phoneNumber ? ` · ${phoneNumber}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !sending && onClose()}
            className="shrink-0 rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {!selected ? (
          <TemplatePicker
            searchRef={searchRef}
            search={search}
            setSearch={setSearch}
            templates={templates}
            loading={loading}
            canLoadMore={page < totalPages}
            onLoadMore={() => loadTemplates(page + 1, false)}
            onPick={pickTemplate}
          />
        ) : (
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 md:grid-cols-[minmax(0,1fr)_17rem]">
            {/* Form */}
            <div className="min-w-0 space-y-5">
              {info.missingMedia.length > 0 && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    {info.isCarousel
                      ? `Card ${info.missingMedia.map((i) => i + 1).join(", ")} has no media uploaded.`
                      : "This template's header media is not uploaded."}{" "}
                    WhatsApp media expires, so upload it again before sending.
                    <button
                      type="button"
                      onClick={() => navigate("/templates")}
                      className="ml-1 font-semibold underline underline-offset-2"
                    >
                      Go to Templates
                    </button>
                  </div>
                </div>
              )}

              {info.headerKey && (
                <Field
                  label="Header variable"
                  hint={info.header?.example?.header_text?.[0]}
                  value={headerValue}
                  onChange={setHeaderValue}
                />
              )}

              {info.bodyKeys.length > 0 ? (
                <div className="space-y-3">
                  <SectionTitle>Message variables</SectionTitle>
                  {info.bodyKeys.map((k) => (
                    <Field
                      key={k}
                      label={`{{${k}}}`}
                      hint={info.bodyExamples[k]}
                      value={bodyValues[k] || ""}
                      onChange={(v) =>
                        setBodyValues((prev) => ({ ...prev, [k]: v }))
                      }
                      quickFill={
                        firstName && firstName !== phoneNumber
                          ? { label: "Use contact name", value: firstName }
                          : null
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This template has no variables — it will be sent exactly as
                  shown.
                </p>
              )}

              {info.urlButtons.length > 0 && (
                <div className="space-y-3">
                  <SectionTitle>Button links</SectionTitle>
                  {info.urlButtons.map((b) => (
                    <Field
                      key={b.index}
                      label={b.text}
                      prefix={b.url.split(/\{\{/)[0]}
                      hint={b.example?.[0]}
                      value={buttonValues[`btn:${b.index}`] || ""}
                      onChange={(v) =>
                        setButtonValues((prev) => ({
                          ...prev,
                          [`btn:${b.index}`]: v,
                        }))
                      }
                    />
                  ))}
                </div>
              )}

              {info.cardUrlButtons.length > 0 && (
                <div className="space-y-3">
                  <SectionTitle>Card button links</SectionTitle>
                  {info.cardUrlButtons.map((b) => (
                    <Field
                      key={`${b.cardIndex}:${b.index}`}
                      label={`Card ${b.cardIndex + 1} · ${b.text}`}
                      prefix={b.url.split(/\{\{/)[0]}
                      value={buttonValues[`${b.cardIndex}:${b.index}`] || ""}
                      onChange={(v) =>
                        setButtonValues((prev) => ({
                          ...prev,
                          [`${b.cardIndex}:${b.index}`]: v,
                        }))
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            <TemplatePreview
              info={info}
              bodyValues={bodyValues}
              headerValue={headerValue}
            />
          </div>
        )}

        {/* Footer */}
        {selected && (
          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {missingFields.length > 0
                ? `Fill in ${missingFields.length} more field${missingFields.length > 1 ? "s" : ""} to send.`
                : "Templates can be sent even outside the 24-hour window."}
            </p>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Sending…" : "Send template"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── sub-components ───────────────────────────────────────────────────── */

function TemplatePicker({
  searchRef,
  search,
  setSearch,
  templates,
  loading,
  canLoadMore,
  onLoadMore,
  onPick,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved templates"
            className="w-full rounded-2xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div className="min-h-[16rem] flex-1 space-y-2 overflow-y-auto px-5 py-4">
        {templates.map((t) => {
          const a = analyzeTemplate(t);
          return (
            <button
              key={t.wt_id}
              type="button"
              onClick={() => onPick(t)}
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-medium text-slate-900">
                  {t.name}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {a.isCarousel ? (
                    <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
                      <Images className="h-3 w-3" /> Carousel
                    </Badge>
                  ) : (
                    a.headerFormat && (
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        <HeaderIcon format={a.headerFormat} className="h-3 w-3" />
                        {a.headerFormat.toLowerCase()}
                      </Badge>
                    )
                  )}
                  <Badge className="border-slate-200 bg-white text-slate-500">
                    {t.category || "—"}
                  </Badge>
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {a.body?.text || "No body text"}
              </p>
              {a.missingMedia.length > 0 && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> Media needs re-upload
                </p>
              )}
            </button>
          );
        })}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-500">
            {search
              ? "No approved templates match your search."
              : "No approved templates yet. Create one from the Templates page."}
          </div>
        )}

        {!loading && canLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full rounded-2xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}

function TemplatePreview({ info, bodyValues, headerValue }) {
  const headerText =
    info.headerFormat === "TEXT"
      ? fillPlaceholders(
          info.header?.text,
          info.headerKey ? { [info.headerKey]: headerValue } : {},
        )
      : null;

  return (
    <div className="md:sticky md:top-0 md:self-start">
      <SectionTitle>Preview</SectionTitle>
      <div className="mt-3 max-h-[26rem] overflow-y-auto overscroll-contain rounded-2xl bg-[#ECE5DD] p-3">
        <div className="ml-auto max-w-[95%] overflow-hidden rounded-xl rounded-tr-sm bg-white shadow-sm">
          {MEDIA_FORMATS.includes(info.headerFormat) && (
            <div className="flex h-24 items-center justify-center gap-2 bg-slate-100 text-xs text-slate-500">
              <HeaderIcon format={info.headerFormat} className="h-4 w-4" />
              {info.headerFormat.toLowerCase()} header
            </div>
          )}
          <div className="space-y-2 px-3 py-2.5 text-[13px] leading-5 text-slate-800">
            {headerText && <p className="font-semibold">{headerText}</p>}
            <p className="whitespace-pre-wrap break-words">
              {fillPlaceholders(info.body?.text, bodyValues)}
            </p>
            {info.footer?.text && (
              <p className="text-[11px] text-slate-400">{info.footer.text}</p>
            )}
          </div>
          {!info.isCarousel && info.buttons.length > 0 && (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {info.buttons.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-[#0F9D58]"
                >
                  {b.type === "URL" && <Link2 className="h-3 w-3" />}
                  {b.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {info.isCarousel && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {info.cards.map((card, i) => {
              const cardBody = findComp(card.components, "BODY");
              const cardButtons =
                findComp(card.components, "BUTTONS")?.buttons || [];
              return (
                <div
                  key={i}
                  className="w-36 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  <div className="flex h-16 items-center justify-center bg-slate-100 text-[11px] text-slate-400">
                    Card {i + 1}
                  </div>
                  {cardBody?.text && (
                    <p className="line-clamp-3 px-2 py-1.5 text-[11px] text-slate-700">
                      {cardBody.text}
                    </p>
                  )}
                  {cardButtons.map((b, j) => (
                    <div
                      key={j}
                      className="truncate border-t border-slate-100 px-2 py-1.5 text-center text-[11px] font-semibold text-[#0F9D58]"
                    >
                      {b.text}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, value, onChange, prefix, quickFill }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-700">
          {label}
        </span>
        {quickFill && value !== quickFill.value && (
          <button
            type="button"
            onClick={() => onChange(quickFill.value)}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
          >
            <UserRound className="h-3 w-3" />
            {quickFill.label}
          </button>
        )}
      </span>
      <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
        {prefix && (
          <span
            className="max-w-[45%] shrink-0 truncate border-r border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500"
            title={prefix}
          >
            {prefix}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint ? `e.g. ${hint}` : "Enter value"}
          className="min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
        />
      </div>
    </label>
  );
}

const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
    {children}
  </h3>
);

const Badge = ({ className = "", children }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${className}`}
  >
    {children}
  </span>
);
