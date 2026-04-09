// src/pages/CreateTemplate.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { createTemplate as apiCreateTemplate } from "../api/templates";
import {
  createUploadSession,
  uploadBinary,
  uploadMedia,
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
  Layout,
  MessageSquare,
  FileText,
} from "lucide-react";

/**
 * CreateTemplate.jsx
 *
 * Single-file full template builder:
 * - flexible components (HEADER, BODY, FOOTER, BUTTONS)
 * - automatic variable detection from body
 * - required example values for variables (no autofill)
 * - header media upload (two step): create-upload-session -> upload-binary
 * - live preview
 * - meta-compatible final payload
 *
 * Notes:
 * - Language is fixed to en_US
 * - parameter_format is "positional"
 * - Category options: MARKETING, UTILITY, AUTHENTICATION
 */

// ---------- Helpers ----------
const slugifyForMeta = (s) => {
  if (!s) return "";
  // Lowercase, replace non allowed chars with underscore, remove consecutive underscores
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const detectVariables = (text) => {
  // returns array of variable tokens in order of appearance
  // variable can be number like 1 or name like guest
  if (!text) return [];
  const re = /{{\s*([^}]+?)\s*}}/g;
  const vars = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    vars.push(m[1]);
  }
  // remove duplicates but preserve order: keep first occurrence of each token
  const seen = new Set();
  return vars.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
};

const initialComponentState = {
  type: "BODY",
  text: "",
  example: { body_text: [[]] },
};

const categories = ["MARKETING", "UTILITY", "AUTHENTICATION"];

// Component visual styles — fully spelled-out Tailwind classes for JIT
const COMP_STYLES = {
  HEADER: {
    border: "border-purple-200",
    headerBg: "bg-purple-50",
    headerBorder: "border-b border-purple-100",
    iconColor: "text-purple-500",
    labelColor: "text-purple-800",
    label: "Header",
  },
  BODY: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    headerBorder: "border-b border-emerald-100",
    iconColor: "text-emerald-600",
    labelColor: "text-emerald-800",
    label: "Body",
  },
  FOOTER: {
    border: "border-amber-200",
    headerBg: "bg-amber-50",
    headerBorder: "border-b border-amber-100",
    iconColor: "text-amber-600",
    labelColor: "text-amber-800",
    label: "Footer",
  },
  BUTTONS: {
    border: "border-blue-200",
    headerBg: "bg-blue-50",
    headerBorder: "border-b border-blue-100",
    iconColor: "text-blue-600",
    labelColor: "text-blue-800",
    label: "Buttons",
  },
};

// ---------- Main Component ----------
export default function CreateTemplate() {
  const navigate = useNavigate();
  const { userId } = useAuthUser(); // expects hook returns { userId }
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Top-level fields
  const [templateNameRaw, setTemplateNameRaw] = useState("");
  const [templateName, setTemplateName] = useState(""); // slugified
  const [nameError, setNameError] = useState("");
  const [category, setCategory] = useState("MARKETING");
  const language = "en_US";
  const parameter_format = "positional";

  // Components list (flexible). Body must exist.
  const [components, setComponents] = useState([
    {
      id: "comp-body",
      type: "BODY",
      text: "",
      example: { body_text: [[]] },
    },
  ]);

  // Header upload state
  const [headerType, setHeaderType] = useState("NONE"); // NONE | TEXT | IMAGE | VIDEO | DOCUMENT
  const [headerText, setHeaderText] = useState("");
  const [headerSessionId, setHeaderSessionId] = useState(null);
  const [headerHandle, setHeaderHandle] = useState(null); // header_handle returned (h)
  const [headerFilePreviewUrl, setHeaderFilePreviewUrl] = useState(null);
  const [headerUploadFile, setHeaderUploadFile] = useState(null);
  const headerFileRef = useRef(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Buttons state: we keep one "BUTTONS" component object when user adds buttons
  const [buttonsComponentId, setButtonsComponentId] = useState(null);
  // buttonItems: array of { type: 'QUICK_REPLY'|'URL'|'PHONE_NUMBER', text, url?, phone? }
  const [buttonItems, setButtonItems] = useState([]);

  // Footer
  const [footerText, setFooterText] = useState("");

  // Validation UI
  const [formErrors, setFormErrors] = useState({});

  // Live preview related (derived)
  // find body component
  const bodyComponent = useMemo(
    () => components.find((c) => c.type === "BODY"),
    [components],
  );

  // Derived: variables in body text
  const bodyVariables = useMemo(
    () => detectVariables(bodyComponent?.text || ""),
    [bodyComponent],
  );

  // Example values management (we store as array of strings, matching variable order)
  // Use the bodyComponent.example.body_text[0] if present
  const [exampleValues, setExampleValues] = useState([]);

  // Update exampleValues whenever variable count changes: keep existing values where possible
  useEffect(() => {
    const len = bodyVariables.length;
    setExampleValues((prev) => {
      const next = Array(len)
        .fill("")
        .map((_, i) => (prev && prev[i] ? prev[i] : ""));
      return next;
    });
    // Also update the body component's example structure so preview uses it
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BODY"
          ? {
              ...c,
              example: { body_text: [Array(len).fill("")] },
            }
          : c,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyVariables.join("|")]);

  // Keep header preview cleanup
  useEffect(() => {
    return () => {
      if (headerFilePreviewUrl) URL.revokeObjectURL(headerFilePreviewUrl);
    };
  }, [headerFilePreviewUrl]);

  // ----------------- Handlers for components -------------
  const addComponent = (type) => {
    // For HEADER we don't add a component until user sets header type and content.
    if (type === "HEADER") {
      // ensure only one header component exists
      if (components.some((c) => c.type === "HEADER")) return;
      const comp = {
        id: `comp-header-${Date.now()}`,
        type: "HEADER",
        format: "TEXT",
        text: "",
        example: {},
      };
      setComponents((p) => [comp, ...p]);
      setHeaderType("TEXT");
      return;
    }
    if (type === "BODY") {
      if (components.some((c) => c.type === "BODY")) return;
      const comp = {
        id: `comp-body-${Date.now()}`,
        type: "BODY",
        text: "",
        example: { body_text: [[]] },
      };
      setComponents((p) => [comp, ...p]);
      return;
    }
    if (type === "FOOTER") {
      if (components.some((c) => c.type === "FOOTER")) return;
      const comp = {
        id: `comp-footer-${Date.now()}`,
        type: "FOOTER",
        text: "",
      };
      setComponents((p) => [...p, comp]);
      return;
    }
    if (type === "BUTTONS") {
      if (components.some((c) => c.type === "BUTTONS")) return;
      const comp = {
        id: `comp-buttons-${Date.now()}`,
        type: "BUTTONS",
        buttons: [],
      };
      setComponents((p) => [...p, comp]);
      setButtonsComponentId(comp.id);
      setButtonItems([]);
      return;
    }
  };

  const removeComponent = (compId) => {
    // console.log({ compId });
    const checkBody = components.find((c) => c.id === compId);
    // console.log({ checkBody, newdata: checkBody.type });

    if (checkBody.type === "BODY") {
      showError("Body can not be removed");
      return;
    }

    setComponents((p) => p.filter((c) => c.id !== compId));
    // cleanup header if removed
    const removed = components.find((c) => c.id === compId);
    if (removed?.type === "HEADER") {
      setHeaderType("NONE");
      setHeaderText("");
      setHeaderSessionId(null);
      setHeaderHandle(null);
      setHeaderUploadFile(null);
      if (headerFilePreviewUrl) {
        URL.revokeObjectURL(headerFilePreviewUrl);
        setHeaderFilePreviewUrl(null);
      }
    }
    if (removed?.type === "BUTTONS") {
      setButtonItems([]);
      setButtonsComponentId(null);
    }
  };

  // Update body text
  const updateBodyText = (newText) => {
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BODY"
          ? {
              ...c,
              text: newText,
            }
          : c,
      ),
    );
  };

  // Update example values into the BODY component's example structure
  useEffect(() => {
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BODY"
          ? {
              ...c,
              example: { body_text: [exampleValues.map((v) => v || "")] },
            }
          : c,
      ),
    );
  }, [exampleValues]);

  // Buttons management
  const addQuickReply = (text = "") => {
    const item = { id: `btn-${Date.now()}`, type: "QUICK_REPLY", text };
    setButtonItems((p) => [...p, item]);
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? { ...c, buttons: [...(c.buttons || []), item] }
          : c,
      ),
    );
  };

  const addUrlButton = () => {
    // only one URL allowed
    if (buttonItems.some((b) => b.type === "URL")) return;
    const item = {
      id: `btn-${Date.now()}`,
      type: "URL",
      text: "Visit",
      url: "",
    };
    setButtonItems((p) => [...p, item]);
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? { ...c, buttons: [...(c.buttons || []), item] }
          : c,
      ),
    );
  };

  const addPhoneButton = () => {
    if (buttonItems.some((b) => b.type === "PHONE_NUMBER")) return;
    const item = {
      id: `btn-${Date.now()}`,
      type: "PHONE_NUMBER",
      text: "Call",
      phone: "",
    };
    setButtonItems((p) => [...p, item]);
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? { ...c, buttons: [...(c.buttons || []), item] }
          : c,
      ),
    );
  };

  const updateButtonItem = (id, patch) => {
    setButtonItems((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? {
              ...c,
              buttons: (c.buttons || []).map((b) =>
                b.id === id ? { ...b, ...patch } : b,
              ),
            }
          : c,
      ),
    );
  };

  const removeButtonItem = (id) => {
    setButtonItems((p) => p.filter((b) => b.id !== id));
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? { ...c, buttons: (c.buttons || []).filter((b) => b.id !== id) }
          : c,
      ),
    );
  };

  // ---------- Header upload workflow ----------
  // Step 1: create upload session
  const handleCreateUploadSession = async (file) => {
    if (!userId) {
      setUploadError("User not authenticated");
      return null;
    }
    if (!file) {
      setUploadError("No file chosen");
      return null;
    }
    setUploadError(null);
    try {
      setUploadingHeader(true);
      const payload = {
        user_id: userId,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
      };
      const resp = await createUploadSession(payload);
      // Expect resp.data.id or resp.data?.id
      const sessionId = resp?.data?.id || resp?.id;
      setHeaderSessionId(sessionId);
      return sessionId;
    } catch (err) {
      console.error("Create session failed", err);
      setUploadError(
        err?.response?.data || err.message || "Session creation failed",
      );
      return null;
    } finally {
      setUploadingHeader(false);
    }
  };

  // Step 2: upload binary (multipart)
  const handleUploadBinary = async (file, sessionId) => {
    if (!userId) {
      setUploadError("User not authenticated");
      return null;
    }
    if (!file || !sessionId) {
      setUploadError("file and session_id required");
      return null;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("session_id", sessionId);
    // key name 'file' expected by backend
    formData.append("file", file);

    try {
      setUploadingHeader(true);
      setUploadError(null);
      const resp = await uploadBinary(formData);
      // backend returns { h: header_handle }
      const h = resp?.data?.h || resp?.h;
      if (!h) {
        setUploadError("Upload response missing header handle");
        return null;
      }
      setHeaderHandle(h);

      // preview: show local object url
      if (headerFilePreviewUrl) {
        URL.revokeObjectURL(headerFilePreviewUrl);
      }
      const objUrl = URL.createObjectURL(file);
      setHeaderFilePreviewUrl(objUrl);

      // update components: ensure header component contains example.header_handle
      setComponents((prev) =>
        prev.map((c) =>
          c.type === "HEADER"
            ? {
                ...c,
                format: headerType === "TEXT" ? "TEXT" : headerType,
                example: { header_handle: [h] },
              }
            : c,
        ),
      );

      return h;
    } catch (err) {
      console.error("Binary upload failed", err);
      setUploadError(
        err?.response?.data || err.message || "Binary upload failed",
      );
      return null;
    } finally {
      setUploadingHeader(false);
    }
  };

  // const onHeaderFileSelected = async (ev) => {
  //   const file = ev.target.files?.[0];
  //   if (!file) return;
  //   // create upload session -> upload binary
  //   const sessionId = await handleCreateUploadSession(file);
  //   if (!sessionId) return;
  //   await handleUploadBinary(file, sessionId);
  // };

  const onHeaderFileSelected = async (ev) => {
    const file = ev.target.files?.[0];
    setHeaderUploadFile(null);
    if (!file) return;

    setUploadError(null);

    const sizeMB = file.size / (1024 * 1024);
    const type = file.type;

    // IMAGE VALIDATION
    if (headerType === "IMAGE") {
      if (!["image/jpeg", "image/png"].includes(type)) {
        setUploadError("Only JPG and PNG images are allowed.");
        return;
      }
      if (sizeMB > 5) {
        setUploadError("Image must be less than 5 MB.");
        return;
      }
    }

    // VIDEO VALIDATION
    if (headerType === "VIDEO") {
      if (!["video/mp4", "video/3gpp"].includes(type)) {
        setUploadError("Only MP4 and 3GP videos are allowed.");
        return;
      }
      if (sizeMB > 16) {
        setUploadError("Video must be less than 16 MB.");
        return;
      }
    }

    // DOCUMENT VALIDATION
    if (headerType === "DOCUMENT") {
      const allowedDocs = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
      ];

      if (!allowedDocs.includes(type)) {
        setUploadError("Unsupported document type.");
        return;
      }

      if (sizeMB > 100) {
        setUploadError("Document must be less than 100 MB.");
        return;
      }
    }

    setHeaderUploadFile(file);

    // ✅ Proceed only if valid
    const sessionId = await handleCreateUploadSession(file);
    if (!sessionId) return;

    await handleUploadBinary(file, sessionId);
  };

  const onHeaderTypeChange = (newType) => {
    setHeaderType(newType);
    setHeaderUploadFile(null);
    setHeaderSessionId(null);
    setHeaderHandle(null);
    setUploadError(null);
    if (headerFileRef.current) {
      headerFileRef.current.value = "";
    }
    if (headerFilePreviewUrl) {
      URL.revokeObjectURL(headerFilePreviewUrl);
      setHeaderFilePreviewUrl(null);
    }
    // Add or remove header component in components list
    if (!components.some((c) => c.type === "HEADER") && newType !== "NONE") {
      // add a header component at the top
      const comp = {
        id: `comp-header-${Date.now()}`,
        type: "HEADER",
        format: newType,
        text: "",
        example: {},
      };
      setComponents((p) => [comp, ...p]);
    } else if (
      components.some((c) => c.type === "HEADER") &&
      newType === "NONE"
    ) {
      // remove header component
      const headerComp = components.find((c) => c.type === "HEADER");
      if (headerComp) removeComponent(headerComp.id);
    } else {
      // update existing header component's format
      setComponents((p) =>
        p.map((c) =>
          c.type === "HEADER"
            ? {
                ...c,
                format: newType,
              }
            : c,
        ),
      );
    }
  };

  const uploadHeaderMediaBeforeTemplateCreate = async () => {
    if (!userId) return null;
    if (!["IMAGE", "VIDEO", "DOCUMENT"].includes(headerType)) return null;
    if (!headerUploadFile) return null;

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append(
      "type",
      headerUploadFile.type || "application/octet-stream",
    );
    formData.append("file", headerUploadFile);

    const uploadResponse = await uploadMedia(formData);
    const mediaId =
      uploadResponse?.data?.media?.id ||
      uploadResponse?.data?.saved?.media_id ||
      uploadResponse?.data?.id ||
      uploadResponse?.media?.id ||
      uploadResponse?.saved?.media_id ||
      uploadResponse?.id ||
      null;

    if (!mediaId) {
      throw new Error("Media upload succeeded but no media id was returned");
    }

    return mediaId;
  };

  // ---------- Name slug and validate ----------
  useEffect(() => {
    const slug = slugifyForMeta(templateNameRaw);
    setTemplateName(slug);
    // validate
    if (!slug) {
      setNameError("Template name is required");
    } else if (!/^[a-z0-9_]+$/.test(slug)) {
      setNameError("Name must be lowercase alphanumeric and underscores only");
    } else {
      setNameError("");
    }
  }, [templateNameRaw]);

  // ---------- Form validation ----------
  const validateBeforeSubmit = () => {
    const errors = {};
    if (!userId) {
      errors.user = "User not authenticated";
    }
    if (!templateName) {
      errors.name = "Template name required";
    } else if (!/^[a-z0-9_]+$/.test(templateName)) {
      errors.name =
        "Invalid name format (lowercase letters, numbers, underscore)";
    }
    // Body presence
    // const body = components.find((c) => c.type === "BODY");
    // if (!body) {
    //   errors.body = "Body component is required";
    // } else {
    //   // If body has variables, ensure example values provided
    //   const vars = detectVariables(body.text);
    //   if (vars.length > 0) {
    //     if (!exampleValues || exampleValues.length < vars.length) {
    //       errors.examples = "Please provide example values for all variables";
    //     } else {
    //       // ensure none empty
    //       const empty = exampleValues.some((v) => v === "" || v == null);
    //       if (empty)
    //         errors.examples =
    //           "Example values cannot be empty for detected variables";
    //     }
    //   }
    // }

    //New version with variable number canot repeated and same number cannot be used again and always start with {{1}}
    // Body presence
    const body = components.find((c) => c.type === "BODY");
    if (!body) {
      errors.body = "Body component is required";
    } else {
      const vars = detectVariables(body.text);

      // ---- VARIABLE RULES ----
      // 1. Must be numeric only
      const nonNumeric = vars.filter((v) => !/^[0-9]+$/.test(v));
      if (nonNumeric.length > 0) {
        errors.variables =
          "Variables must be numeric like {{1}}, {{2}}, {{3}} only.";
      }

      // 2. First variable must be 1
      if (vars.length > 0 && vars[0] !== "1") {
        errors.variables = "First variable must be {{1}}.";
      }

      // 3. No duplicates
      const unique = new Set(vars);
      if (unique.size !== vars.length) {
        errors.variables = "Variables cannot repeat (e.g., {{1}} used twice).";
      }

      // 4. Must be strictly increasing with no gaps (1,2,3,...)
      vars.forEach((v, i) => {
        const expected = String(i + 1);
        if (v !== expected) {
          errors.variables = `Variables must appear sequentially: {{1}}, {{2}}, {{3}}...`;
        }
      });

      // ---- EXISTING EXAMPLE VALUE REQUIREMENT ----
      if (vars.length > 0) {
        if (!exampleValues || exampleValues.length < vars.length) {
          errors.examples = "Please provide example values for all variables.";
        } else {
          const empty = exampleValues.some((v) => !v || v === "");
          if (empty) {
            errors.examples =
              "Example values cannot be empty for detected variables.";
          }
        }
      }
    }

    // If header type is IMAGE/VIDEO/DOCUMENT then headerHandle must exist
    const headerComp = components.find((c) => c.type === "HEADER");
    if (
      headerComp &&
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerComp.format)
    ) {
      // require headerHandle (we stored in headerHandle state)
      if (!headerHandle) {
        errors.header =
          "Upload a file for header (create session + upload binary)";
      }
    }
    // Buttons validation (if url button present, url must be valid-ish)
    const buttonsComp = components.find((c) => c.type === "BUTTONS");
    if (buttonsComp && buttonsComp.buttons) {
      for (const btn of buttonsComp.buttons) {
        if (btn.type === "URL") {
          if (!btn.url || !/^https?:\/\//.test(btn.url)) {
            errors.buttons = "URL button must have a valid https:// URL";
          }
        }
        if (btn.type === "PHONE_NUMBER") {
          if (!btn.phone || !/^\+?[0-9]{6,15}$/.test(btn.phone)) {
            errors.buttons = "Phone button must have a valid phone number";
          }
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- Build final components for payload ----------
  const buildFinalComponents = () => {
    const final = [];
    // preserve component order in components state
    for (const comp of components) {
      if (comp.type === "HEADER") {
        if (comp.format === "TEXT") {
          final.push({
            type: "HEADER",
            format: "TEXT",
            text: headerText || comp.text || "",
          });
        } else if (["IMAGE", "VIDEO", "DOCUMENT"].includes(comp.format)) {
          // use headerHandle (h) that we got from uploadBinary
          if (headerHandle) {
            final.push({
              type: "HEADER",
              format: comp.format,
              example: { header_handle: [headerHandle] },
            });
          } else {
            // shouldn't reach here if validated
            // push nothing
          }
        }
      } else if (comp.type === "BODY") {
        if (exampleValues.length > 0) {
          final.push({
            type: "BODY",
            text: comp.text || "",
            example: { body_text: [exampleValues.map((v) => v || "")] },
          });
        } else {
          final.push({
            type: "BODY",
            text: comp.text || "",
          });
        }
      } else if (comp.type === "FOOTER") {
        final.push({
          type: "FOOTER",
          text: footerText || comp.text || "",
        });
      } else if (comp.type === "BUTTONS") {
        // normalize buttons: we need simple structure used earlier
        const buttonsPayload = (comp.buttons || []).map((b) => {
          if (b.type === "QUICK_REPLY") {
            return { type: "QUICK_REPLY", text: b.text };
          } else if (b.type === "URL") {
            // Some templates expect "type":"URL", "text": "...", "url":"..."
            return { type: "URL", text: b.text, url: b.url };
          } else if (b.type === "PHONE_NUMBER") {
            return { type: "PHONE_NUMBER", text: b.text, phone: b.phone };
          }
          return b;
        });
        final.push({ type: "BUTTONS", buttons: buttonsPayload });
      } else {
        // unknown component type: include raw
        final.push(comp);
      }
    }
    return final;
  };

  // ---------- Submit handler ----------
  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    setFormErrors({});
    if (!validateBeforeSubmit()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const comps = buildFinalComponents();

    const toastId = showLoading("Creating template...");

    try {
      setSubmitting(true);
      setLoading(true);
      const mediaId = await uploadHeaderMediaBeforeTemplateCreate();

      const payload = {
        user_id: userId,
        name: templateName,
        language,
        category,
        parameter_format,
        components: comps,
        media_id: mediaId,
        header_format: headerType !== "NONE" ? headerType : null,
        header_handle: headerHandle || null,
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

      const successMessage = responseData?.meta_error
        ? `Template saved locally, but Meta submission failed: ${responseData.meta_error}`
        : responseData?.note
          ? responseData.note
          : "Template created successfully. Redirecting to list...";

      showSuccess(
        mediaId ? `${successMessage} Media uploaded too.` : successMessage,
      );
      navigate("/templates");
    } catch (err) {
      console.error("Create template error", err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data ||
        err?.message ||
        "Create template failed";
      // showError("Create failed: " + JSON.stringify(msg));
      showError(
        "Create failed: " +
          (typeof msg === "object" ? JSON.stringify(msg) : msg),
      );
    } finally {
      dismissToast(toastId);
      setSubmitting(false);
      setLoading(false);
    }
  };

  // ---------- Preview rendering helpers ----------
  const previewHeader = () => {
    const headerComp = components.find((c) => c.type === "HEADER");
    if (!headerComp) return null;
    if (headerComp.format === "TEXT") {
      const text = headerText || headerComp.text || "";
      return (
        <div className="px-3 pt-3 pb-1 font-bold text-gray-900 text-[15px] leading-tight">
          {text || (
            <span className="text-gray-400 font-normal text-sm italic">
              Header text...
            </span>
          )}
        </div>
      );
    }
    // media: prefer local preview if uploaded, else show placeholder
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerComp.format)) {
      if (headerFilePreviewUrl) {
        if (headerComp.format === "IMAGE") {
          return (
            <img
              src={headerFilePreviewUrl}
              alt="header-preview"
              className="w-full max-h-48 object-cover"
            />
          );
        }
        if (headerComp.format === "VIDEO") {
          return (
            <video
              src={headerFilePreviewUrl}
              controls
              className="w-full max-h-48"
            />
          );
        }
        // document
        return (
          <div className="flex items-center gap-3 px-3 py-3 bg-gray-50 border-b border-gray-100">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-emerald-700" />
            </div>
            <div>
              <div className="font-medium text-sm text-gray-800">
                {headerFileRef.current?.files?.[0]?.name || "Uploaded document"}
              </div>
              <div className="text-xs text-gray-500">Document</div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center py-8 bg-gray-100 text-gray-400 gap-2">
            <FileText size={28} />
            <span className="text-xs">Upload to preview</span>
          </div>
        );
      }
    }
    return null;
  };

  const previewBodyRendered = () => {
    const text = bodyComponent?.text || "";
    if (!text)
      return (
        <div className="text-gray-400 text-sm italic">
          Your message will appear here...
        </div>
      );

    // Replace variables with example values
    let rendered = [];
    const re = /{{\s*([^}]+?)\s*}}/g;
    let lastIndex = 0;
    let match;
    const vars = bodyVariables;
    let varIndex = 0;

    while ((match = re.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) rendered.push(<span key={`t-${lastIndex}`}>{before}</span>);
      const token = match[1];
      // find index of this token in vars array
      const idx = vars.indexOf(token);
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
      varIndex++;
    }
    const tail = text.slice(lastIndex);
    if (tail) rendered.push(<span key={`tail`}>{tail}</span>);

    return (
      <div className="text-gray-800 text-sm leading-relaxed">{rendered}</div>
    );
  };

  // ---------- Derived flags ----------
  const hasHeader = components.some((c) => c.type === "HEADER");
  const hasFooter = components.some((c) => c.type === "FOOTER");
  const hasButtons = components.some((c) => c.type === "BUTTONS");
  const hasErrors = Object.keys(formErrors).length > 0;

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
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
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm leading-tight">
                Create WhatsApp Template
              </h1>
              <p className="text-xs text-gray-400">
                Design and submit to Meta for approval
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

      {/* ── Error Banner ── */}
      {hasErrors && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle
              size={16}
              className="mt-0.5 flex-shrink-0 text-red-500"
            />
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

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ═══════════════ LEFT: FORM ═══════════════ */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* ── Template Settings ── */}
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
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Template Name
                  </label>
                  <input
                    className={`block w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300 ${
                      nameError
                        ? "border-red-300 focus:ring-red-100 bg-red-50"
                        : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-400 bg-white"
                    }`}
                    value={templateNameRaw}
                    onChange={(e) => setTemplateNameRaw(e.target.value)}
                    placeholder="e.g. order_confirmation (auto-slugified)"
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

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          category === c
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Read-only metadata */}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">
                    Language: {language}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg font-medium">
                    Format: {parameter_format}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Message Components ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 text-sm">
                  Message Components
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Build your template — header, body, footer, and buttons
                </p>
              </div>

              <div className="p-5 space-y-4">
                {components.map((comp) => {
                  const styles = COMP_STYLES[comp.type] || {
                    border: "border-gray-200",
                    headerBg: "bg-gray-50",
                    headerBorder: "border-b border-gray-100",
                    iconColor: "text-gray-500",
                    labelColor: "text-gray-700",
                    label: comp.type,
                  };

                  const compIcon =
                    comp.type === "HEADER" ? (
                      <Layout size={14} />
                    ) : comp.type === "BODY" ? (
                      <AlignLeft size={14} />
                    ) : comp.type === "FOOTER" ? (
                      <MessageSquare size={14} />
                    ) : comp.type === "BUTTONS" ? (
                      <Link2 size={14} />
                    ) : null;

                  return (
                    <div
                      key={comp.id}
                      className={`rounded-xl border ${styles.border} overflow-hidden`}
                    >
                      {/* Component header bar */}
                      <div
                        className={`${styles.headerBg} ${styles.headerBorder} px-4 py-2.5 flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={styles.iconColor}>{compIcon}</span>
                          <span
                            className={`font-semibold text-xs uppercase tracking-wide ${styles.labelColor}`}
                          >
                            {styles.label}
                          </span>
                          {comp.type === "BODY" && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                              Required
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeComponent(comp.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      </div>

                      {/* Component content */}
                      <div className="p-4">
                        {/* ── BODY ── */}
                        {comp.type === "BODY" && (
                          <div className="space-y-4">
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
                                className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 min-h-[130px] resize-y transition-all placeholder-gray-300"
                                value={comp.text}
                                onChange={(e) => updateBodyText(e.target.value)}
                                placeholder={
                                  "Hi {{1}}, your order #{{2}} is confirmed and will arrive by {{3}}."
                                }
                              />
                            </div>

                            {/* Detected variables */}
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

                            {/* Example values */}
                            {bodyVariables.length > 0 && (
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <div className="text-xs font-semibold text-amber-800 mb-0.5">
                                  Example Values
                                </div>
                                <div className="text-xs text-amber-600 mb-3">
                                  Required by Meta — provide realistic sample
                                  data.
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
                                <AlertCircle
                                  size={11}
                                  className="flex-shrink-0"
                                />
                                {formErrors.variables}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── HEADER ── */}
                        {comp.type === "HEADER" && (
                          <div className="space-y-4">
                            {/* Type selector */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-2">
                                Header type
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  "NONE",
                                  "TEXT",
                                  "IMAGE",
                                  "VIDEO",
                                  "DOCUMENT",
                                ].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => onHeaderTypeChange(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                      headerType === t
                                        ? "bg-purple-600 text-white border-purple-600"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Text input */}
                            {headerType === "TEXT" && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1.5">
                                  Header text
                                </label>
                                <input
                                  type="text"
                                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all placeholder-gray-300"
                                  value={headerText}
                                  onChange={(e) => {
                                    setHeaderText(e.target.value);
                                    setComponents((prev) =>
                                      prev.map((c) =>
                                        c.id === comp.id
                                          ? { ...c, text: e.target.value }
                                          : c,
                                      ),
                                    );
                                  }}
                                  placeholder="Short header text (no variables recommended)"
                                />
                              </div>
                            )}

                            {/* Media upload */}
                            {["IMAGE", "VIDEO", "DOCUMENT"].includes(
                              headerType,
                            ) && (
                              <div className="space-y-3">
                                <label
                                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all group ${
                                    uploadingHeader
                                      ? "border-purple-300 bg-purple-50"
                                      : headerHandle
                                        ? "border-emerald-300 bg-emerald-50"
                                        : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/40"
                                  }`}
                                >
                                  {uploadingHeader ? (
                                    <Loader2
                                      size={24}
                                      className="text-purple-500 animate-spin mb-2"
                                    />
                                  ) : headerHandle ? (
                                    <CheckCircle2
                                      size={24}
                                      className="text-emerald-500 mb-2"
                                    />
                                  ) : (
                                    <Upload
                                      size={24}
                                      className="text-gray-300 group-hover:text-purple-400 mb-2 transition-colors"
                                    />
                                  )}
                                  <span className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">
                                    {uploadingHeader
                                      ? "Uploading..."
                                      : headerHandle
                                        ? "File uploaded successfully"
                                        : `Click to upload ${headerType.toLowerCase()}`}
                                  </span>
                                  <span className="text-xs text-gray-400 mt-1">
                                    {headerType === "IMAGE" &&
                                      "JPG, PNG • Max 5 MB"}
                                    {headerType === "VIDEO" &&
                                      "MP4, 3GP • Max 16 MB"}
                                    {headerType === "DOCUMENT" &&
                                      "PDF, DOC, XLS, PPT, TXT • Max 100 MB"}
                                  </span>
                                  <input
                                    ref={headerFileRef}
                                    type="file"
                                    accept={
                                      headerType === "IMAGE"
                                        ? "image/jpeg,image/png"
                                        : headerType === "VIDEO"
                                          ? "video/mp4,video/3gpp"
                                          : headerType === "DOCUMENT"
                                            ? ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                            : undefined
                                    }
                                    onChange={onHeaderFileSelected}
                                    className="hidden"
                                  />
                                </label>

                                {uploadError && (
                                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    <AlertCircle size={12} />
                                    {uploadError?.toString()}
                                  </div>
                                )}
                                {headerHandle && (
                                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                                    <CheckCircle2 size={12} />
                                    Header handle ready
                                  </div>
                                )}
                              </div>
                            )}

                            {formErrors.header && (
                              <div className="text-red-600 text-xs flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                <AlertCircle size={11} />
                                {formErrors.header}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── FOOTER ── */}
                        {comp.type === "FOOTER" && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">
                              Footer text (optional)
                            </label>
                            <input
                              type="text"
                              className="block w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 transition-all placeholder-gray-300"
                              value={footerText}
                              onChange={(e) => {
                                setFooterText(e.target.value);
                                setComponents((prev) =>
                                  prev.map((c) =>
                                    c.id === comp.id
                                      ? { ...c, text: e.target.value }
                                      : c,
                                  ),
                                );
                              }}
                              placeholder='e.g. "Reply STOP to unsubscribe"'
                            />
                          </div>
                        )}

                        {/* ── BUTTONS ── */}
                        {comp.type === "BUTTONS" && (
                          <div className="space-y-4">
                            {/* Add button actions */}
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => addQuickReply("")}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <Plus size={12} /> Quick Reply
                              </button>
                              <button
                                type="button"
                                onClick={addUrlButton}
                                disabled={buttonItems.some(
                                  (b) => b.type === "URL",
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Link2 size={12} /> URL Button
                              </button>
                              <button
                                type="button"
                                onClick={addPhoneButton}
                                disabled={buttonItems.some(
                                  (b) => b.type === "PHONE_NUMBER",
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Phone size={12} /> Phone Button
                              </button>
                            </div>

                            {/* Button items */}
                            {buttonItems.length > 0 && (
                              <div className="space-y-3">
                                {buttonItems.map((b) => (
                                  <div
                                    key={b.id}
                                    className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg">
                                        {b.type === "QUICK_REPLY" &&
                                          "Quick Reply"}
                                        {b.type === "URL" && "URL Button"}
                                        {b.type === "PHONE_NUMBER" &&
                                          "Phone Button"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeButtonItem(b.id)}
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
                                        updateButtonItem(b.id, {
                                          text: e.target.value,
                                        })
                                      }
                                    />
                                    {b.type === "URL" && (
                                      <input
                                        type="text"
                                        className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder-gray-300"
                                        placeholder="https://yourwebsite.com"
                                        value={b.url || ""}
                                        onChange={(e) =>
                                          updateButtonItem(b.id, {
                                            url: e.target.value,
                                          })
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
                                          updateButtonItem(b.id, {
                                            phone: e.target.value,
                                          })
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
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* ── Add Component Pills ── */}
                {(!hasHeader || !hasFooter || !hasButtons) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400 font-medium">
                      Add section:
                    </span>
                    {!hasHeader && (
                      <button
                        type="button"
                        onClick={() => addComponent("HEADER")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Header
                      </button>
                    )}
                    {!hasFooter && (
                      <button
                        type="button"
                        onClick={() => addComponent("FOOTER")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Footer
                      </button>
                    )}
                    {!hasButtons && (
                      <button
                        type="button"
                        onClick={() => addComponent("BUTTONS")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Plus size={12} /> Buttons
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Submit Area ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  {submitting ? "Creating..." : "Create Template"}
                </button>

                <button
                  type="button"
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
                  onClick={() => {
                    // reset
                    setTemplateNameRaw("");
                    setTemplateName("");
                    setCategory("MARKETING");
                    setComponents([
                      {
                        id: "comp-body",
                        type: "BODY",
                        text: "",
                        example: { body_text: [[]] },
                      },
                    ]);
                    setHeaderType("NONE");
                    setHeaderText("");
                    setHeaderSessionId(null);
                    setHeaderHandle(null);
                    setHeaderFilePreviewUrl(null);
                    setHeaderUploadFile(null);
                    if (headerFileRef.current) {
                      headerFileRef.current.value = "";
                    }
                    setButtonItems([]);
                    setFooterText("");
                    setExampleValues([]);
                  }}
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                After submission, the template will be reviewed by Meta. Check
                status on the Templates page.
              </p>
            </div>
          </form>

          {/* ═══════════════ RIGHT: PREVIEW ═══════════════ */}
          <div>
            <div className="sticky top-[65px] space-y-4">
              {/* Live Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span className="text-xs font-semibold text-gray-600">
                    Live Preview
                  </span>
                </div>

                <div className="p-5">
                  {/* Phone mockup */}
                  <div className="relative max-w-[230px] mx-auto">
                    {/* Outer shell */}
                    <div className="bg-gray-800 rounded-[28px] p-[10px] shadow-2xl ring-1 ring-gray-700">
                      {/* Screen */}
                      <div className="rounded-[20px] overflow-hidden">
                        {/* WhatsApp top bar */}
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

                        {/* Chat area */}
                        <div
                          className="p-2.5 min-h-[300px]"
                          style={{ backgroundColor: "#ECE5DD" }}
                        >
                          {/* Message bubble */}
                          <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden max-w-[95%]">
                            {/* Header */}
                            {previewHeader()}

                            {/* Body */}
                            <div className="px-3 py-2.5 whitespace-pre-wrap">
                              {previewBodyRendered()}
                            </div>

                            {/* Footer */}
                            {footerText && (
                              <div className="px-3 pb-2 text-[11px] text-gray-400 leading-tight">
                                {footerText}
                              </div>
                            )}

                            {/* Timestamp */}
                            <div className="flex justify-end px-3 pb-1.5">
                              <span className="text-[10px] text-gray-400">
                                12:34 PM ✓✓
                              </span>
                            </div>
                          </div>

                          {/* Buttons below bubble */}
                          {buttonItems.length > 0 && (
                            <div className="mt-1.5 space-y-1 max-w-[95%]">
                              {buttonItems.map((btn) => (
                                <div
                                  key={btn.id}
                                  className="bg-white rounded-lg shadow-sm px-3 py-2 text-center"
                                >
                                  {btn.type === "QUICK_REPLY" && (
                                    <span className="text-[#0F9D58] text-xs font-semibold">
                                      {btn.text || "Quick Reply"}
                                    </span>
                                  )}
                                  {btn.type === "URL" && (
                                    <span className="text-[#0F9D58] text-xs font-semibold flex items-center justify-center gap-1">
                                      <Link2 size={11} />
                                      {btn.text || "Visit"}
                                    </span>
                                  )}
                                  {btn.type === "PHONE_NUMBER" && (
                                    <span className="text-[#0F9D58] text-xs font-semibold flex items-center justify-center gap-1">
                                      <Phone size={11} />
                                      {btn.text || "Call"}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template meta */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {[
                      { label: "Name", value: templateName || "—", mono: true },
                      { label: "Category", value: category },
                      { label: "Language", value: language },
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

              {/* Requirements checklist */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-3">
                  Meta Requirements
                </h4>
                <ul className="space-y-2">
                  {[
                    "Name: lowercase letters, numbers & underscores only",
                    "Body is always required",
                    "Variables must be {{1}}, {{2}}, {{3}}… (sequential)",
                    "Example values required for each variable",
                    "Media headers require a file upload",
                    "URL buttons must start with https://",
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
