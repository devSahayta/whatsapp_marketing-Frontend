// src/pages/CreateCarouselTemplate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { createTemplate as apiCreateTemplate } from "../api/templates";
import {
  createUploadSession,
  getSupabaseUploadUrl,
  uploadBinaryFromStorage,
  uploadMediaFromStorage,
} from "../api/media";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";
import {
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Loader2,
  Link2,
  Phone,
  AlignLeft,
  MessageSquare,
  Images,
  ImageIcon,
  Video,
  Minus,
} from "lucide-react";

/**
 * CreateCarouselTemplate.jsx
 *
 * Builder for WhatsApp "Media Card Carousel" marketing templates.
 * - top level: BODY only (no header/footer/buttons at the template level)
 * - CAROUSEL component: 2-10 cards, each with its own IMAGE/VIDEO header
 * - buttons are defined once and shared across every card (same type/order),
 *   only the URL button's trailing {{1}} variable example can differ per card
 * - reuses the same Supabase -> upload-session -> Meta media pipeline as
 *   CreateTemplate.jsx, looped once per card
 */

// ---------- Helpers (mirrors CreateTemplate.jsx) ----------
const slugifyForMeta = (s) => {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const detectVariables = (text) => {
  if (!text) return [];
  const re = /{{\s*([^}]+?)\s*}}/g;
  const vars = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    vars.push(m[1]);
  }
  const seen = new Set();
  return vars.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
};

const MIN_CARDS = 2;
const MAX_CARDS = 10;
const MAX_BUTTONS = 2;

const CARD_MEDIA_CONSTRAINTS = {
  IMAGE: {
    accept: "image/jpeg,image/png",
    allowedTypes: ["image/jpeg", "image/png"],
    maxMB: 5,
    hint: "JPG or PNG · max 5 MB",
  },
  VIDEO: {
    accept: "video/mp4,video/3gpp",
    allowedTypes: ["video/mp4", "video/3gpp"],
    maxMB: 16,
    hint: "MP4 or 3GP · max 16 MB",
  },
};

const newCard = (i) => ({
  id: `card-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
  headerFormat: "IMAGE",
  file: null,
  previewUrl: null,
  uploadError: null,
  urlExampleValue: "",
});

const buildCardButtons = (sharedButtons, card) =>
  sharedButtons.map((b) => {
    if (b.type === "QUICK_REPLY") {
      return { type: "QUICK_REPLY", text: b.text };
    }
    if (b.type === "URL") {
      const hasVariable = /{{\s*1\s*}}/.test(b.url || "");
      return hasVariable
        ? {
            type: "URL",
            text: b.text,
            url: b.url,
            example: [card.urlExampleValue || ""],
          }
        : { type: "URL", text: b.text, url: b.url };
    }
    if (b.type === "PHONE_NUMBER") {
      return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone };
    }
    return b;
  });

export default function CreateCarouselTemplate() {
  const navigate = useNavigate();
  const { userId } = useAuthUser();
  const [submitting, setSubmitting] = useState(false);
  const [uploadStage, setUploadStage] = useState("");

  // Top-level fields
  const [templateNameRaw, setTemplateNameRaw] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [nameError, setNameError] = useState("");
  const category = "MARKETING";
  const language = "en_US";
  const parameter_format = "positional";

  // Body (only top-level component besides CAROUSEL)
  const [bodyText, setBodyText] = useState("");
  const bodyVariables = useMemo(() => detectVariables(bodyText), [bodyText]);
  const [exampleValues, setExampleValues] = useState([]);

  useEffect(() => {
    const len = bodyVariables.length;
    setExampleValues((prev) =>
      Array(len)
        .fill("")
        .map((_, i) => (prev && prev[i] ? prev[i] : "")),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyVariables.join("|")]);

  // Cards
  const [cardCount, setCardCount] = useState(3);
  const [cards, setCards] = useState(() =>
    Array.from({ length: 3 }, (_, i) => newCard(i)),
  );
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);
  useEffect(
    () => () => {
      cardsRef.current.forEach((c) => {
        if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
      });
    },
    [],
  );

  useEffect(() => {
    setCards((prev) => {
      if (cardCount < prev.length) {
        prev
          .slice(cardCount)
          .forEach((c) => c.previewUrl && URL.revokeObjectURL(c.previewUrl));
      }
      return Array.from(
        { length: cardCount },
        (_, i) => prev[i] || newCard(i),
      );
    });
  }, [cardCount]);

  // Shared buttons (identical type/order applied to every card)
  const [sharedButtons, setSharedButtons] = useState([]);
  const urlButton = sharedButtons.find((b) => b.type === "URL");
  const urlHasVariable = /{{\s*1\s*}}/.test(urlButton?.url || "");

  const [formErrors, setFormErrors] = useState({});

  // ----------------- Card handlers -------------
  const onCardHeaderFormatChange = (index, format) => {
    setCards((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
        return {
          ...c,
          headerFormat: format,
          file: null,
          previewUrl: null,
          uploadError: null,
        };
      }),
    );
  };

  const onCardFileSelected = (index, file) => {
    if (!file) return;
    const card = cards[index];
    const constraint = CARD_MEDIA_CONSTRAINTS[card.headerFormat];
    const sizeMB = file.size / (1024 * 1024);
    let error = null;
    if (!constraint.allowedTypes.includes(file.type)) {
      error = `Invalid file type. Allowed: ${constraint.hint.split(" · ")[0]}`;
    } else if (sizeMB > constraint.maxMB) {
      error = `File too large. Max allowed size is ${constraint.maxMB} MB`;
    }

    setCards((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
        return {
          ...c,
          file: error ? null : file,
          uploadError: error,
          previewUrl: error ? null : URL.createObjectURL(file),
        };
      }),
    );
  };

  const updateCardUrlExample = (index, value) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, urlExampleValue: value } : c)),
    );
  };

  // ----------------- Shared button handlers -------------
  const addQuickReplyButton = () => {
    if (sharedButtons.length >= MAX_BUTTONS) return;
    setSharedButtons((p) => [
      ...p,
      { id: `btn-${Date.now()}`, type: "QUICK_REPLY", text: "" },
    ]);
  };

  const addUrlButton = () => {
    if (sharedButtons.length >= MAX_BUTTONS) return;
    if (sharedButtons.some((b) => b.type === "URL")) return;
    setSharedButtons((p) => [
      ...p,
      { id: `btn-${Date.now()}`, type: "URL", text: "Shop Now", url: "" },
    ]);
  };

  const addPhoneButton = () => {
    if (sharedButtons.length >= MAX_BUTTONS) return;
    if (sharedButtons.some((b) => b.type === "PHONE_NUMBER")) return;
    setSharedButtons((p) => [
      ...p,
      { id: `btn-${Date.now()}`, type: "PHONE_NUMBER", text: "Call", phone: "" },
    ]);
  };

  const updateSharedButton = (id, patch) => {
    setSharedButtons((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeSharedButton = (id) => {
    setSharedButtons((p) => p.filter((b) => b.id !== id));
  };

  // ---------- Name slug + validate ----------
  useEffect(() => {
    const slug = slugifyForMeta(templateNameRaw);
    setTemplateName(slug);
    if (!slug) {
      setNameError("Template name is required");
    } else if (!/^[a-z0-9_]+$/.test(slug)) {
      setNameError("Name must be lowercase alphanumeric and underscores only");
    } else {
      setNameError("");
    }
  }, [templateNameRaw]);

  // ---------- Validation ----------
  const validateBeforeSubmit = () => {
    const errors = {};
    if (!userId) errors.user = "User not authenticated";

    if (!templateName) {
      errors.name = "Template name required";
    } else if (!/^[a-z0-9_]+$/.test(templateName)) {
      errors.name = "Invalid name format (lowercase letters, numbers, underscore)";
    }

    if (!bodyText.trim()) {
      errors.body = "Body text is required";
    } else {
      const vars = bodyVariables;
      const nonNumeric = vars.filter((v) => !/^[0-9]+$/.test(v));
      if (nonNumeric.length > 0) {
        errors.variables = "Variables must be numeric like {{1}}, {{2}}, {{3}} only.";
      }
      if (vars.length > 0 && vars[0] !== "1") {
        errors.variables = "First variable must be {{1}}.";
      }
      const unique = new Set(vars);
      if (unique.size !== vars.length) {
        errors.variables = "Variables cannot repeat (e.g., {{1}} used twice).";
      }
      vars.forEach((v, i) => {
        const expected = String(i + 1);
        if (v !== expected) {
          errors.variables = "Variables must appear sequentially: {{1}}, {{2}}, {{3}}...";
        }
      });
      if (vars.length > 0) {
        if (!exampleValues || exampleValues.length < vars.length) {
          errors.examples = "Please provide example values for all variables.";
        } else if (exampleValues.some((v) => !v)) {
          errors.examples = "Example values cannot be empty for detected variables.";
        }
      }
    }

    if (cardCount < MIN_CARDS || cardCount > MAX_CARDS) {
      errors.cardCount = `Carousel must have between ${MIN_CARDS} and ${MAX_CARDS} cards.`;
    }

    const missingMedia = cards.some((c) => !c.file);
    if (missingMedia) {
      errors.cards = "Every card requires an uploaded image or video.";
    }

    if (sharedButtons.length > MAX_BUTTONS) {
      errors.buttons = `Maximum ${MAX_BUTTONS} buttons allowed per card.`;
    }
    for (const btn of sharedButtons) {
      if (!btn.text || !btn.text.trim()) {
        errors.buttons = "Every button needs a label.";
      }
      if (btn.type === "URL") {
        if (!btn.url || !/^https?:\/\//.test(btn.url)) {
          errors.buttons = "URL button must have a valid https:// URL.";
        }
        const hasVariable = /{{\s*1\s*}}/.test(btn.url || "");
        if (hasVariable && cards.some((c) => !c.urlExampleValue?.trim())) {
          errors.buttons =
            "Provide an example value for the URL's {{1}} variable on every card.";
        }
      }
      if (btn.type === "PHONE_NUMBER") {
        if (!btn.phone || !/^\+?[0-9]{6,15}$/.test(btn.phone)) {
          errors.buttons = "Phone button must have a valid phone number.";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- Submit ----------
  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    setFormErrors({});
    if (!validateBeforeSubmit()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const toastId = showLoading("Creating carousel template...");

    try {
      setSubmitting(true);

      const uploadedCards = [];
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setUploadStage(`Uploading card ${i + 1} of ${cards.length}...`);

        // 1. Signed upload URL
        const urlResp = await getSupabaseUploadUrl({
          user_id: userId,
          file_name: card.file.name,
          file_type: card.file.type,
        });
        const { signed_url, storage_path } = urlResp.data;

        // 2. PUT file directly to Supabase
        const putResp = await fetch(signed_url, {
          method: "PUT",
          headers: { "Content-Type": card.file.type },
          body: card.file,
        });
        if (!putResp.ok) {
          throw new Error(`Upload to storage failed for card ${i + 1}`);
        }

        // 3. Create Meta upload session
        const sessionResp = await createUploadSession({
          user_id: userId,
          file_name: card.file.name,
          file_type: card.file.type || "application/octet-stream",
        });
        const sessionId = sessionResp?.data?.id || sessionResp?.id;
        if (!sessionId) {
          throw new Error(`Failed to create upload session for card ${i + 1}`);
        }

        // 4. Backend downloads from Supabase -> forwards to Meta -> returns header handle
        const binaryResp = await uploadBinaryFromStorage({
          user_id: userId,
          session_id: sessionId,
          storage_path,
        });
        const headerHandle = binaryResp?.data?.h || binaryResp?.h;
        if (!headerHandle) {
          throw new Error(`Upload response missing header handle for card ${i + 1}`);
        }

        // 5. Upload media record -> get media_id (used for future card refresh/send)
        const mediaResp = await uploadMediaFromStorage({
          user_id: userId,
          type: card.file.type || "application/octet-stream",
          storage_path,
          file_name: card.file.name,
          file_size: card.file.size,
        });
        const mediaId =
          mediaResp?.data?.media?.id ||
          mediaResp?.data?.saved?.media_id ||
          mediaResp?.data?.id ||
          mediaResp?.media?.id ||
          mediaResp?.saved?.media_id ||
          mediaResp?.id ||
          null;
        if (!mediaId) {
          throw new Error(`Media upload succeeded but no media id returned for card ${i + 1}`);
        }

        uploadedCards.push({
          card_index: i,
          headerHandle,
          mediaId,
          headerFormat: card.headerFormat,
        });
      }

      setUploadStage("Submitting template to Meta...");

      const cardsPayload = uploadedCards.map((uc) => ({
        components: [
          {
            type: "HEADER",
            format: uc.headerFormat,
            example: { header_handle: [uc.headerHandle] },
          },
          ...(sharedButtons.length
            ? [
                {
                  type: "BUTTONS",
                  buttons: buildCardButtons(sharedButtons, cards[uc.card_index]),
                },
              ]
            : []),
        ],
      }));

      const bodyComponent =
        exampleValues.length > 0
          ? {
              type: "BODY",
              text: bodyText,
              example: { body_text: [exampleValues.map((v) => v || "")] },
            }
          : { type: "BODY", text: bodyText };

      const components = [
        bodyComponent,
        { type: "CAROUSEL", cards: cardsPayload },
      ];

      const carousel_media = uploadedCards.map((uc) => ({
        card_index: uc.card_index,
        media_id: uc.mediaId,
        header_format: uc.headerFormat,
      }));

      const payload = {
        user_id: userId,
        name: templateName,
        language,
        category,
        parameter_format,
        components,
        carousel_media,
      };

      const resp = await apiCreateTemplate(payload);

      const responseData = resp?.data;
      const isCreated =
        resp?.status === 201 &&
        responseData &&
        typeof responseData === "object" &&
        responseData.template;

      if (!isCreated) {
        throw new Error(
          responseData?.error ||
            responseData?.message ||
            "Unexpected create template response",
        );
      }

      showSuccess("Carousel template created successfully. Redirecting to list...");
      navigate("/templates");
    } catch (err) {
      console.error("Create carousel template error", err);
      const msg =
        err?.response?.data?.error?.error_user_msg ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        "Create carousel template failed";
      showError(
        "Create failed: " + (typeof msg === "object" ? JSON.stringify(msg) : msg),
      );
    } finally {
      dismissToast(toastId);
      setSubmitting(false);
      setUploadStage("");
    }
  };

  // ---------- Preview helpers ----------
  const previewBodyRendered = () => {
    if (!bodyText)
      return (
        <div className="text-gray-400 text-sm italic">
          Your message will appear here...
        </div>
      );
    let rendered = [];
    const re = /{{\s*([^}]+?)\s*}}/g;
    let lastIndex = 0;
    let match;
    while ((match = re.exec(bodyText)) !== null) {
      const before = bodyText.slice(lastIndex, match.index);
      if (before) rendered.push(<span key={`t-${lastIndex}`}>{before}</span>);
      const token = match[1];
      const idx = bodyVariables.indexOf(token);
      const replacement = exampleValues[idx] || `{{${token}}}`;
      rendered.push(
        <strong
          key={`v-${match.index}`}
          className="text-emerald-700 bg-emerald-50 px-0.5 rounded"
        >
          {replacement}
        </strong>,
      );
      lastIndex = match.index + match[0].length;
    }
    const tail = bodyText.slice(lastIndex);
    if (tail) rendered.push(<span key="tail">{tail}</span>);
    return (
      <div className="text-gray-800 text-sm leading-relaxed">{rendered}</div>
    );
  };

  const hasErrors = Object.keys(formErrors).length > 0;

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Images size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">
                Create Carousel Template
              </h1>
              <p className="text-xs text-gray-400">
                Media card carousel — submitted to Meta for approval
              </p>
            </div>
          </div>

          {templateName && (
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-400">ID:</span>
              <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-mono border border-gray-200">
                {templateName}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {hasErrors && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
            <div>
              <span className="font-semibold">
                Fix the following before submitting:
              </span>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                {Object.entries(formErrors).map(([k, v]) => (
                  <li key={k} className="text-xs">
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ═══ LEFT: FORM ═══ */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Template Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Template Settings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Basic configuration required by Meta
                </p>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Template Name
                  </label>
                  <input
                    className={`block w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300 ${
                      nameError
                        ? "border-red-300 focus:ring-red-100 bg-red-50"
                        : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
                    }`}
                    value={templateNameRaw}
                    onChange={(e) => setTemplateNameRaw(e.target.value)}
                    placeholder="e.g. summer_sale_carousel (auto-slugified)"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {templateName && (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-mono border border-gray-200">
                        {templateName}
                      </span>
                    )}
                    {nameError && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {nameError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">
                    Category: {category}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">
                    Language: {language}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">
                    Format: {parameter_format}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Media card carousel templates are only available under the{" "}
                  <span className="font-semibold text-gray-500">MARKETING</span>{" "}
                  category on Meta.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="rounded-2xl border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center gap-2">
                <AlignLeft size={14} className="text-emerald-600" />
                <span className="font-semibold text-xs uppercase tracking-wide text-emerald-800">
                  Body
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                  Required
                </span>
              </div>
              <div className="bg-white p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Message body — use{" "}
                    <code className="bg-gray-100 px-1 rounded text-gray-600">
                      {"{{1}}"}
                    </code>
                    ,{" "}
                    <code className="bg-gray-100 px-1 rounded text-gray-600">
                      {"{{2}}"}
                    </code>{" "}
                    for dynamic variables
                  </label>
                  <textarea
                    className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 min-h-[110px] resize-y transition-all placeholder-gray-300"
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder={"Hi {{1}}, check out this week's top picks!"}
                  />
                </div>

                {bodyVariables.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">
                      Detected:
                    </span>
                    {bodyVariables.map((v) => (
                      <code
                        key={v}
                        className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                )}

                {bodyVariables.length > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-amber-800 mb-0.5">
                      Example Values
                    </div>
                    <div className="text-xs text-amber-600 mb-3">
                      Required by Meta — provide realistic sample data.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {bodyVariables.map((v, i) => (
                        <div key={v}>
                          <label className="block text-xs text-amber-700 mb-1">
                            Value for{" "}
                            <code className="bg-amber-100 px-1 rounded">
                              {`{{${v}}}`}
                            </code>
                          </label>
                          <input
                            type="text"
                            className="w-full border border-amber-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all placeholder-amber-300"
                            value={exampleValues[i] || ""}
                            placeholder={`Sample for {{${v}}}`}
                            onChange={(e) =>
                              setExampleValues((prev) =>
                                prev.map((x, idx) =>
                                  idx === i ? e.target.value : x,
                                ),
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                    {formErrors.examples && (
                      <div className="text-red-600 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={11} />
                        {formErrors.examples}
                      </div>
                    )}
                  </div>
                )}

                {formErrors.variables && (
                  <div className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle size={11} className="flex-shrink-0" />
                    {formErrors.variables}
                  </div>
                )}
                {formErrors.body && (
                  <div className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle size={11} className="flex-shrink-0" />
                    {formErrors.body}
                  </div>
                )}
              </div>
            </div>

            {/* Shared Buttons */}
            <div className="rounded-2xl border border-blue-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-2">
                <Link2 size={14} className="text-blue-600" />
                <span className="font-semibold text-xs uppercase tracking-wide text-blue-800">
                  Buttons
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                  Shared across all cards
                </span>
              </div>
              <div className="bg-white p-4 space-y-4">
                <p className="text-xs text-gray-400">
                  Every card must use the same button types, in the same order
                  (max {MAX_BUTTONS}). Only the URL button's trailing{" "}
                  <code className="bg-gray-100 px-1 rounded">{"{{1}}"}</code>{" "}
                  variable can differ per card.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addQuickReplyButton}
                    disabled={sharedButtons.length >= MAX_BUTTONS}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={12} /> Quick Reply
                  </button>
                  <button
                    type="button"
                    onClick={addUrlButton}
                    disabled={
                      sharedButtons.length >= MAX_BUTTONS ||
                      sharedButtons.some((b) => b.type === "URL")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Link2 size={12} /> URL Button
                  </button>
                  <button
                    type="button"
                    onClick={addPhoneButton}
                    disabled={
                      sharedButtons.length >= MAX_BUTTONS ||
                      sharedButtons.some((b) => b.type === "PHONE_NUMBER")
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Phone size={12} /> Phone Button
                  </button>
                </div>

                {sharedButtons.length > 0 && (
                  <div className="space-y-3">
                    {sharedButtons.map((b) => (
                      <div
                        key={b.id}
                        className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                            {b.type === "QUICK_REPLY" && "Quick Reply"}
                            {b.type === "URL" && "URL Button"}
                            {b.type === "PHONE_NUMBER" && "Phone Button"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSharedButton(b.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder-gray-300"
                          placeholder="Button label text"
                          value={b.text}
                          onChange={(e) =>
                            updateSharedButton(b.id, { text: e.target.value })
                          }
                        />
                        {b.type === "URL" && (
                          <input
                            type="text"
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder-gray-300"
                            placeholder="https://yourstore.com/p/{{1}}"
                            value={b.url || ""}
                            onChange={(e) =>
                              updateSharedButton(b.id, { url: e.target.value })
                            }
                          />
                        )}
                        {b.type === "PHONE_NUMBER" && (
                          <input
                            type="text"
                            className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder-gray-300"
                            placeholder="+919000000000"
                            value={b.phone || ""}
                            onChange={(e) =>
                              updateSharedButton(b.id, { phone: e.target.value })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {formErrors.buttons && (
                  <div className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle size={11} />
                    {formErrors.buttons}
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Cards */}
            <div className="rounded-2xl border border-indigo-200 overflow-hidden">
              <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Images size={14} className="text-indigo-600" />
                  <span className="font-semibold text-xs uppercase tracking-wide text-indigo-800">
                    Carousel Cards
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                    Required
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCardCount((c) => Math.max(MIN_CARDS, c - 1))}
                    disabled={cardCount <= MIN_CARDS}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-semibold text-indigo-800 w-14 text-center">
                    {cardCount} cards
                  </span>
                  <button
                    type="button"
                    onClick={() => setCardCount((c) => Math.min(MAX_CARDS, c + 1))}
                    disabled={cardCount >= MAX_CARDS}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 space-y-4">
                <p className="text-xs text-gray-400">
                  Between {MIN_CARDS} and {MAX_CARDS} cards. Each card needs its
                  own image or video header — this is fixed once the template is
                  approved.
                </p>

                {cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">
                        Card {index + 1}
                      </span>
                      <div className="flex gap-1.5">
                        {["IMAGE", "VIDEO"].map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => onCardHeaderFormatChange(index, fmt)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                              card.headerFormat === fmt
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-700"
                            }`}
                          >
                            {fmt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <label
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all group ${
                          card.file
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"
                        }`}
                      >
                        {card.file ? (
                          <CheckCircle2 size={22} className="text-emerald-500 mb-2" />
                        ) : card.headerFormat === "VIDEO" ? (
                          <Video
                            size={22}
                            className="text-gray-300 group-hover:text-indigo-400 mb-2 transition-colors"
                          />
                        ) : (
                          <ImageIcon
                            size={22}
                            className="text-gray-300 group-hover:text-indigo-400 mb-2 transition-colors"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700 transition-colors">
                          {card.file
                            ? card.file.name
                            : `Click to upload ${card.headerFormat.toLowerCase()}`}
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          {CARD_MEDIA_CONSTRAINTS[card.headerFormat].hint}
                        </span>
                        <input
                          type="file"
                          accept={CARD_MEDIA_CONSTRAINTS[card.headerFormat].accept}
                          onChange={(e) =>
                            onCardFileSelected(index, e.target.files?.[0] || null)
                          }
                          className="hidden"
                        />
                      </label>

                      {card.uploadError && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <AlertCircle size={12} />
                          {card.uploadError}
                        </div>
                      )}

                      {card.previewUrl && !card.uploadError && (
                        <div className="rounded-lg overflow-hidden border border-gray-100">
                          {card.headerFormat === "IMAGE" ? (
                            <img
                              src={card.previewUrl}
                              alt={`Card ${index + 1} preview`}
                              className="w-full max-h-40 object-cover"
                            />
                          ) : (
                            <video
                              src={card.previewUrl}
                              controls
                              className="w-full max-h-40"
                            />
                          )}
                        </div>
                      )}

                      {urlButton && urlHasVariable && (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5">
                            URL variable value for this card (
                            <code className="bg-gray-100 px-1 rounded">
                              {"{{1}}"}
                            </code>
                            )
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all placeholder-gray-300"
                            placeholder="e.g. product-slug-1"
                            value={card.urlExampleValue}
                            onChange={(e) =>
                              updateCardUrlExample(index, e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(formErrors.cards || formErrors.cardCount) && (
                  <div className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle size={11} />
                    {formErrors.cards || formErrors.cardCount}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting
                    ? uploadStage || "Creating..."
                    : "Create Carousel Template"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/template/create")}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
                >
                  Switch to Standard Template
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                After submission, the template will be reviewed by Meta. Check
                status on the Templates page.
              </p>
            </div>
          </form>

          {/* ═══ RIGHT: PREVIEW ═══ */}
          <div>
            <div className="sticky top-[65px] space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                  <span className="text-xs font-semibold text-gray-600">
                    Live Preview
                  </span>
                </div>

                <div className="p-5">
                  <div className="relative max-w-[230px] mx-auto">
                    <div className="bg-gray-800 rounded-[28px] p-[10px] shadow-2xl ring-1 ring-gray-700">
                      <div className="rounded-[20px] overflow-hidden">
                        <div className="bg-[#128C7E] px-3 py-2.5 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <div className="w-4 h-4 rounded-full bg-white/40" />
                          </div>
                          <div>
                            <div className="text-white text-xs font-semibold leading-none">
                              Business
                            </div>
                            <div className="text-white/60 text-[10px] mt-0.5">
                              online
                            </div>
                          </div>
                        </div>

                        <div
                          className="p-2.5 min-h-[300px]"
                          style={{ backgroundColor: "#ECE5DD" }}
                        >
                          <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden max-w-[95%]">
                            <div className="px-3 py-2.5 whitespace-pre-wrap">
                              {previewBodyRendered()}
                            </div>
                            <div className="flex justify-end px-3 pb-1.5">
                              <span className="text-[10px] text-gray-400">
                                12:34 PM ✓✓
                              </span>
                            </div>
                          </div>

                          {/* Carousel strip */}
                          <div className="mt-2 -mx-2.5 px-2.5 flex gap-2 overflow-x-auto pb-1">
                            {cards.map((card, index) => (
                              <div
                                key={card.id}
                                className="flex-shrink-0 w-[150px] bg-white rounded-lg shadow-sm overflow-hidden"
                              >
                                <div className="bg-gray-100 h-20 flex items-center justify-center overflow-hidden">
                                  {card.previewUrl ? (
                                    card.headerFormat === "IMAGE" ? (
                                      <img
                                        src={card.previewUrl}
                                        alt={`Card ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <video
                                        src={card.previewUrl}
                                        className="w-full h-full object-cover"
                                      />
                                    )
                                  ) : (
                                    <span className="text-[10px] text-gray-400">
                                      Card {index + 1}
                                    </span>
                                  )}
                                </div>
                                {sharedButtons.length > 0 && (
                                  <div className="p-1.5 space-y-1">
                                    {sharedButtons.map((btn) => (
                                      <div
                                        key={btn.id}
                                        className="bg-gray-50 rounded px-1.5 py-1 text-center"
                                      >
                                        <span className="text-[9px] font-semibold text-[#0F9D58] flex items-center justify-center gap-1">
                                          {btn.type === "URL" && (
                                            <Link2 size={9} />
                                          )}
                                          {btn.type === "PHONE_NUMBER" && (
                                            <Phone size={9} />
                                          )}
                                          {btn.text ||
                                            (btn.type === "QUICK_REPLY"
                                              ? "Quick Reply"
                                              : btn.type === "URL"
                                                ? "Visit"
                                                : "Call")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {[
                      { label: "Name", value: templateName || "—", mono: true },
                      { label: "Category", value: category },
                      { label: "Language", value: language },
                      { label: "Cards", value: cardCount },
                    ].map(({ label, value, mono }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-400">{label}</span>
                        {mono ? (
                          <code className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-[11px] border border-gray-200">
                            {value}
                          </code>
                        ) : (
                          <span className="text-gray-700 font-medium">
                            {value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-3">
                  Meta Requirements
                </h4>
                <ul className="space-y-2">
                  {[
                    "Category must be MARKETING",
                    "Between 2 and 10 cards, fixed once approved",
                    "Card header: IMAGE or VIDEO only",
                    "Max 2 buttons per card, identical type & order",
                    "Only the URL button's trailing {{1}} can vary per card",
                    "Body variables must be sequential: {{1}}, {{2}}...",
                  ].map((rule, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-500"
                    >
                      <CheckCircle2
                        size={13}
                        className="text-gray-300 mt-0.5 flex-shrink-0"
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
