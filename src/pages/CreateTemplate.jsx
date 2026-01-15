// src/pages/CreateTemplate.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { createTemplate as apiCreateTemplate } from "../api/templates";
import { createUploadSession, uploadBinary } from "../api/media";

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
    [components]
  );

  // Derived: variables in body text
  const bodyVariables = useMemo(
    () => detectVariables(bodyComponent?.text || ""),
    [bodyComponent]
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
          : c
      )
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
    setComponents((p) => p.filter((c) => c.id !== compId));
    // cleanup header if removed
    const removed = components.find((c) => c.id === compId);
    if (removed?.type === "HEADER") {
      setHeaderType("NONE");
      setHeaderText("");
      setHeaderSessionId(null);
      setHeaderHandle(null);
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
          : c
      )
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
          : c
      )
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
          : c
      )
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
          : c
      )
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
          : c
      )
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
                b.id === id ? { ...b, ...patch } : b
              ),
            }
          : c
      )
    );
  };

  const removeButtonItem = (id) => {
    setButtonItems((p) => p.filter((b) => b.id !== id));
    setComponents((prev) =>
      prev.map((c) =>
        c.type === "BUTTONS"
          ? { ...c, buttons: (c.buttons || []).filter((b) => b.id !== id) }
          : c
      )
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
        err?.response?.data || err.message || "Session creation failed"
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
            : c
        )
      );

      return h;
    } catch (err) {
      console.error("Binary upload failed", err);
      setUploadError(
        err?.response?.data || err.message || "Binary upload failed"
      );
      return null;
    } finally {
      setUploadingHeader(false);
    }
  };

  const onHeaderFileSelected = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    // create upload session -> upload binary
    const sessionId = await handleCreateUploadSession(file);
    if (!sessionId) return;
    await handleUploadBinary(file, sessionId);
  };

  const onHeaderTypeChange = (newType) => {
    setHeaderType(newType);
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
            : c
        )
      );
    }
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

    const payload = {
      user_id: userId,
      name: templateName,
      language,
      category,
      parameter_format,
      components: comps,
    };

    try {
      setSubmitting(true);
      setLoading(true);
      const resp = await apiCreateTemplate(payload);
      // success: show toast and redirect
      alert("Template created successfully. Redirecting to list...");
      navigate("/templates");
    } catch (err) {
      console.error("Create template error", err);
      const msg =
        err?.response?.data || err?.message || "Create template failed";
      alert("Create failed: " + JSON.stringify(msg));
    } finally {
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
      return <div className="px-3 py-2 font-semibold">{text}</div>;
    }
    // media: prefer local preview if uploaded, else show placeholder
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerComp.format)) {
      if (headerFilePreviewUrl) {
        if (headerComp.format === "IMAGE") {
          return (
            <img
              src={headerFilePreviewUrl}
              alt="header-preview"
              className="w-full max-h-72 object-contain rounded"
            />
          );
        }
        if (headerComp.format === "VIDEO") {
          return (
            <video
              src={headerFilePreviewUrl}
              controls
              className="w-full max-h-72 rounded"
            />
          );
        }
        // document
        return (
          <div className="flex items-center gap-3 p-4">
            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
              📄
            </div>
            <div>
              <div className="font-medium">
                {headerFileRef.current?.files?.[0]?.name || "Uploaded document"}
              </div>
              <div className="text-xs text-gray-500">Document preview</div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="p-6 text-sm text-gray-500">
            No media preview (upload to preview)
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
        <div className="text-gray-500">Body preview (type your message)</div>
      );

    // Replace variables with example values (wrap variable tokens with <strong>)
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
        <strong key={`v-${match.index}`} className="bg-yellow-50 px-1 rounded">
          {replacement}
        </strong>
      );
      lastIndex = match.index + match[0].length;
      varIndex++;
    }
    const tail = text.slice(lastIndex);
    if (tail) rendered.push(<span key={`tail`}>{tail}</span>);

    return <div>{rendered}</div>;
  };

  // ---------- UI ----------
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create WhatsApp Template</h1>

      {/* Top area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium text-gray-700">
            Template Name
          </label>
          <input
            className="mt-1 block w-full border p-2 rounded"
            value={templateNameRaw}
            onChange={(e) => setTemplateNameRaw(e.target.value)}
            placeholder="friendly_name_here (will be slugified)"
          />
          <div className="text-xs text-gray-500 mt-1">
            Generated name: <code>{templateName}</code>
          </div>
          {nameError && (
            <div className="text-red-600 text-sm mt-1">{nameError}</div>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            className="mt-1 block w-full border p-2 rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="mt-3 text-sm text-gray-600">
            Language: <strong>{language}</strong>
          </div>
          <div className="mt-1 text-sm text-gray-600">
            Parameter format: <strong>{parameter_format}</strong>
          </div>
        </div>
      </div>

      {/* Components builder + preview layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left: Builder */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Components</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                  onClick={() => addComponent("HEADER")}
                >
                  Add Header
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                  onClick={() => addComponent("BODY")}
                >
                  Add Body
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                  onClick={() => addComponent("FOOTER")}
                >
                  Add Footer
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                  onClick={() => addComponent("BUTTONS")}
                >
                  Add Buttons
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* Render current components in order */}
              {components.map((comp) => (
                <div key={comp.id} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{comp.type}</div>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        className="text-xs text-red-600"
                        onClick={() => removeComponent(comp.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    {/* BODY */}
                    {comp.type === "BODY" && (
                      <>
                        <label className="text-xs text-gray-600">
                          Body text
                        </label>
                        <textarea
                          className="mt-1 block w-full border p-2 rounded min-h-[120px]"
                          value={comp.text}
                          onChange={(e) => {
                            updateBodyText(e.target.value);
                          }}
                          placeholder={
                            "Hi {{1}}, your order number is {{2}} ..."
                          }
                        />
                        <div className="text-xs text-gray-500 mt-2">
                          Variables detected:{" "}
                          {bodyVariables.length === 0 ? (
                            <span className="text-gray-400">none</span>
                          ) : (
                            bodyVariables.map((v, i) => (
                              <code
                                key={v}
                                className="mx-1 bg-gray-100 px-1 rounded"
                              >
                                {`{{${v}}}`}
                              </code>
                            ))
                          )}
                        </div>

                        {/* Example values */}
                        {bodyVariables.length > 0 && (
                          <div className="mt-3">
                            <div className="text-sm font-medium">
                              Example values (required)
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              Enter values in same order as variables appear.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {bodyVariables.map((v, i) => (
                                <div key={v} className="space-y-1">
                                  <div className="text-xs text-gray-600">
                                    Value for <code>{`{{${v}}}`}</code>
                                  </div>
                                  <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={exampleValues[i] || ""}
                                    onChange={(e) =>
                                      setExampleValues((prev) =>
                                        prev.map((x, idx) =>
                                          idx === i ? e.target.value : x
                                        )
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                            {formErrors.examples && (
                              <div className="text-red-600 text-sm mt-2">
                                {formErrors.examples}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* HEADER */}
                    {comp.type === "HEADER" && (
                      <div>
                        <label className="text-xs text-gray-600">
                          Header type
                        </label>
                        <select
                          value={headerType}
                          onChange={(e) => onHeaderTypeChange(e.target.value)}
                          className="mt-1 block w-48 border p-2 rounded"
                        >
                          <option value="NONE">None</option>
                          <option value="TEXT">Text</option>
                          <option value="IMAGE">Image</option>
                          <option value="VIDEO">Video</option>
                          <option value="DOCUMENT">Document</option>
                        </select>

                        {headerType === "TEXT" && (
                          <div className="mt-3">
                            <label className="text-xs text-gray-600">
                              Header text
                            </label>
                            <input
                              type="text"
                              className="w-full border p-2 rounded mt-1"
                              value={headerText}
                              onChange={(e) => {
                                setHeaderText(e.target.value);
                                // update header comp text too
                                setComponents((prev) =>
                                  prev.map((c) =>
                                    c.id === comp.id
                                      ? { ...c, text: e.target.value }
                                      : c
                                  )
                                );
                              }}
                              placeholder="Short header text (no variables recommended)"
                            />
                          </div>
                        )}

                        {["IMAGE", "VIDEO", "DOCUMENT"].includes(
                          headerType
                        ) && (
                          <div className="mt-3">
                            <div className="text-sm font-medium">
                              Upload {headerType.toLowerCase()}
                            </div>
                            <div className="text-xs text-gray-500">
                              This will create a temporary session and upload
                              the binary to obtain a header handle (used only
                              for this template creation).
                            </div>

                            <div className="mt-2">
                              <input
                                ref={headerFileRef}
                                type="file"
                                accept={
                                  headerType === "IMAGE"
                                    ? "image/*"
                                    : headerType === "VIDEO"
                                    ? "video/*"
                                    : undefined
                                }
                                onChange={onHeaderFileSelected}
                                className="text-sm"
                              />
                            </div>

                            {uploadingHeader && (
                              <div className="mt-2 text-sm text-blue-600">
                                Uploading…
                              </div>
                            )}
                            {uploadError && (
                              <div className="mt-2 text-sm text-red-600">
                                {uploadError?.toString()}
                              </div>
                            )}
                            {headerHandle && (
                              <div className="mt-2 text-sm text-green-600">
                                Uploaded — header handle ready
                              </div>
                            )}
                          </div>
                        )}

                        {formErrors.header && (
                          <div className="text-red-600 text-sm mt-2">
                            {formErrors.header}
                          </div>
                        )}
                      </div>
                    )}

                    {/* FOOTER */}
                    {comp.type === "FOOTER" && (
                      <div>
                        <label className="text-xs text-gray-600">
                          Footer text (optional)
                        </label>
                        <input
                          type="text"
                          className="mt-1 block w-full border p-2 rounded"
                          value={footerText}
                          onChange={(e) => {
                            setFooterText(e.target.value);
                            setComponents((prev) =>
                              prev.map((c) =>
                                c.id === comp.id
                                  ? { ...c, text: e.target.value }
                                  : c
                              )
                            );
                          }}
                          placeholder="Small footer text (optional)"
                        />
                      </div>
                    )}

                    {/* BUTTONS */}
                    {comp.type === "BUTTONS" && (
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            onClick={() => addQuickReply("")}
                          >
                            Add Quick Reply
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            onClick={addUrlButton}
                          >
                            Add URL Button
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 bg-gray-100 rounded text-sm"
                            onClick={addPhoneButton}
                          >
                            Add Phone Button
                          </button>
                        </div>

                        <div className="mt-3 space-y-3">
                          {buttonItems.map((b) => (
                            <div key={b.id} className="border rounded p-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  {b.type}
                                </div>
                                <button
                                  type="button"
                                  className="text-xs text-red-600"
                                  onClick={() => removeButtonItem(b.id)}
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  className="w-full border p-2 rounded"
                                  placeholder="Button text"
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
                                    className="w-full border p-2 rounded"
                                    placeholder="https://..."
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
                                    className="w-full border p-2 rounded"
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
                            </div>
                          ))}
                        </div>

                        {formErrors.buttons && (
                          <div className="text-red-600 text-sm mt-2">
                            {formErrors.buttons}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit area */}
          <div className="bg-white p-4 rounded shadow">
            {Object.keys(formErrors).length > 0 && (
              <div className="mb-3 text-sm text-red-600">
                Please fix errors above before submitting.
                {formErrors?.variables && (
                  <p className=" text-sm text-red-600 ">
                    <strong>Error: </strong>
                    <span>{formErrors.variables}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Template"}
              </button>

              <button
                type="button"
                className="px-4 py-2 bg-gray-100 rounded"
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
                  setButtonItems([]);
                  setFooterText("");
                  setExampleValues([]);
                }}
              >
                Reset
              </button>
            </div>

            <div className="text-xs text-gray-500 mt-3">
              After creation the template will be submitted to Meta for
              approval. You can check status on the Templates list.
            </div>
          </div>
        </form>

        {/* Right: Live Preview */}
        <div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Live Preview</h3>

            <div className="bg-[url('/wa-bg.png')] bg-cover bg-center rounded-xl p-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="w-full bg-gray-50 p-3">{previewHeader()}</div>

                {/* Body */}
                <div className="p-4 whitespace-pre-wrap leading-relaxed text-gray-800 min-h-[120px]">
                  {previewBodyRendered()}
                </div>

                {/* Footer (small) */}
                {footerText && (
                  <div className="px-4 pb-2 text-sm text-gray-500 border-t">
                    {footerText}
                  </div>
                )}

                {/* Buttons */}
                {buttonItems.length > 0 && (
                  <div className="border-t">
                    {buttonItems.map((btn) => (
                      <button
                        key={btn.id}
                        className="w-full text-left p-3 hover:bg-gray-50"
                      >
                        {btn.type === "QUICK_REPLY" && (
                          <span>➜ {btn.text || "Quick Reply"}</span>
                        )}
                        {btn.type === "URL" && (
                          <span>
                            🔗 {btn.text || "Visit"} —{" "}
                            {btn.url || "https://..."}
                          </span>
                        )}
                        {btn.type === "PHONE_NUMBER" && (
                          <span>
                            📞 {btn.text || "Call"} — {btn.phone || "+91..."}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview details */}
            <div className="mt-3 text-xs text-gray-500">
              <div>
                <strong>Template name:</strong>{" "}
                {templateName || (
                  <span className="text-gray-400">(slug will appear)</span>
                )}
              </div>
              <div className="mt-1">
                <strong>Category:</strong> {category}
              </div>
              <div className="mt-1">
                <strong>Language:</strong> {language}
              </div>
            </div>
          </div>

          {/* Help / Validation summary */}
          <div className="bg-white p-4 rounded shadow mt-4 text-sm text-gray-600">
            <h4 className="font-medium mb-2">Validation</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Template name must be lowercase, letters/numbers/underscores
                only.
              </li>
              <li>
                Body is required and example values are mandatory when variables
                used.
              </li>
              <li>
                If header uses IMAGE/VIDEO/DOCUMENT, upload is required to get
                header handle.
              </li>
              <li>
                Button URL must start with <code>http://</code> or{" "}
                <code>https://</code>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
