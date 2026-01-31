// src/pages/SendTemplate.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  fetchMetaTemplatesById,
  sendTemplate as apiSendTemplate,
  sendTemplateBulk as apiSendBulkTemplate,
  fetchTemplateBulkProgress,
} from "../api/templates";
import { fetchGroups, fetchGroupParticipants } from "../api/groups";
import { listMedia, uploadMedia } from "../api/media";
import { showError, showSuccess } from "../utils/toast";

/*
  SendTemplate Page
  - Loads template by templateId
  - Extracts variables (positional {{1}} and named {{guest}})
  - Lets user fill variables, select event & participants
  - Lets user pick/upload header media if template requires it
  - Live preview updates as user types
  - Sends message(s) to selected recipients
*/

function extractPlaceholders(text = "") {
  // returns array of placeholders in occurrence order (e.g. ["1","2","guest"])
  const re = /\{\{(.*?)\}\}/g;
  const results = [];
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) results.push(m[1]);
  }
  return results;
}

// Build human-friendly label for a placeholder key
function placeholderLabel(key) {
  if (/^\d+$/.test(key)) return `{{${key}}}`; // positional
  return `{{${key}}}`; // named
}

// Fill template text using mapping { key -> value }
// key can be "1" or "guest"
function fillTemplateText(text = "", mapping = {}) {
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const v = mapping[key];
    return v !== undefined && v !== null ? v : match;
  });
}

// Preview component (simplified and reusing earlier design)
function TemplatePreviewSmall({ template, mapping, mediaProxyUrl }) {
  const header = template.components.find((c) => c.type === "HEADER");
  const body = template.components.find((c) => c.type === "BODY");
  const buttons = template.components.find((c) => c.type === "BUTTONS");

  const headerFormat = header?.format?.toLowerCase();

  const filledBody = body ? fillTemplateText(body.text || "", mapping) : "";

  return (
    <div className="bg-gray-50 rounded-lg p-4 border shadow-sm w-full">
      {header && headerFormat === "image" && mediaProxyUrl && (
        <img
          src={mediaProxyUrl}
          alt="header"
          className="w-full object-contain mb-3"
        />
      )}
      {header && headerFormat === "video" && mediaProxyUrl && (
        <video src={mediaProxyUrl} controls className="w-full mb-3" />
      )}
      <div className="bg-white p-4 rounded">
        <div className="text-gray-800 whitespace-pre-wrap">{filledBody}</div>
        {buttons?.buttons?.length > 0 && (
          <div className="mt-3 space-y-2">
            {buttons.buttons.map((b, i) => (
              <div
                key={i}
                className="inline-block px-3 py-2 rounded-full border text-sm bg-blue-50 text-blue-700"
              >
                {b.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SendTemplate() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuthUser();

  const progressRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState(null);

  // events & participants
  const [events, setEvents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [selectAllParticipants, setSelectAllParticipants] = useState(false);

  // media
  const [mediaList, setMediaList] = useState([]);
  const [mediaChoice, setMediaChoice] = useState("existing"); // none | existing | upload
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // variable inputs map: key => value, where key is "1" or "guest"
  const [variableMap, setVariableMap] = useState({});

  // UI state
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);
  const [sendingProgress, setSendingProgress] = useState(null);

  // derived: placeholders from components
  const placeholders = useMemo(() => {
    if (!template) return { body: [], header: [], buttons: [] };

    const body = template.components.find((c) => c.type === "BODY");
    const header = template.components.find((c) => c.type === "HEADER");
    const buttons = template.components.find((c) => c.type === "BUTTONS");

    const bodyPlace = body ? extractPlaceholders(body.text || "") : [];
    const headerPlace =
      header && header.format && header.format.toLowerCase() === "text"
        ? extractPlaceholders(header.text || "")
        : [];
    // button URLs might have placeholders
    let buttonPlace = [];
    if (buttons && buttons.buttons) {
      buttons.buttons.forEach((b) => {
        if (b.url) {
          buttonPlace = buttonPlace.concat(extractPlaceholders(b.url || ""));
        }
      });
    }

    // Normalize order and uniqueness while maintaining appearance order
    const unique = (arr) => {
      const seen = new Set();
      const out = [];
      arr.forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k);
          out.push(k);
        }
      });
      return out;
    };

    return {
      body: unique(bodyPlace),
      header: unique(headerPlace),
      buttons: unique(buttonPlace),
    };
  }, [template]);

  // media proxy url for preview (if header exists and we have selected media or example)
  const mediaProxyUrl = useMemo(() => {
    // priority: selectedMediaId -> existing example -> null
    if (!template) return null;
    const header = template.components.find((c) => c.type === "HEADER");
    if (!header) return null;

    // if user selected existing media id -> we can't build proxy for uploaded media id
    // because media id is from Meta; your backend proxy expects media CDN url for header_handle
    // For preview we can use media list selected item's link if present.
    // if (mediaChoice === "existing" && selectedMediaId) {
    //   const item = mediaList.find((m) => m.wmu_id === selectedMediaId);
    //   if (item && item.media_id) {
    //     // we will use /api/watemplates/media-proxy/:mediaId ? alternative: media-proxy route exists
    //     // Use media-proxy endpoint you've made (mediaId)
    //     return `${
    //       import.meta.env.VITE_BACKEND_URL
    //     }/api/watemplates/media-proxy/${item.media_id}?user_id=${userId}`;
    //   }
    // }

    // if header has example header_handle[] use proxy-url endpoint
    if (header.example?.header_handle?.[0]) {
      return `${
        import.meta.env.VITE_BACKEND_URL
      }/api/watemplates/media-proxy-url?url=${encodeURIComponent(
        header.example.header_handle[0],
      )}&user_id=${userId}`;
    }

    return null;
  }, [template, mediaChoice, selectedMediaId, mediaList, userId]);

  // load template
  useEffect(() => {
    // console.log(" before loading");
    // console.log({ templateId, userId });

    let mounted = true;
    async function load() {
      try {
        setLoadingTemplate(true);

        // console.log("in template loading, before template get loaded");

        setError(null);
        const resp = await fetchMetaTemplatesById(templateId, userId);
        // your api wrapper returns axios-like: resp.data.template maybe
        const tpl = resp.data?.template || resp.data || null;

        // console.log({ tpl_data: tpl });

        if (!tpl) {
          throw new Error("Template not found from server");
        }
        if (mounted) {
          setTemplate(tpl);
          // prefill positional variables from example.body_text[0] if present
          const body = tpl.components.find((c) => c.type === "BODY");
          const examples = body?.example?.body_text?.[0] || [];
          const initial = {};
          // find positional placeholders count
          const posKeys = extractPlaceholders(body?.text || "")
            .filter((k) => /^\d+$/.test(k))
            .map((k) => Number(k));
          const maxIndex = posKeys.length
            ? Math.max(...posKeys)
            : examples.length;
          for (let i = 1; i <= maxIndex; i++) {
            initial[String(i)] = examples[i - 1] || "";
          }
          // also prefill named placeholders if example found by order (best-effort)
          const header = tpl.components.find((c) => c.type === "HEADER");
          if (header && header.format === "TEXT") {
            const headerPlace = extractPlaceholders(header.text || "");
            headerPlace.forEach((k, idx) => {
              if (!initial[k]) initial[k] = header.example?.[idx] || "";
            });
          }
          setVariableMap(initial);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load template");
      } finally {
        setLoadingTemplate(false);
      }
    }
    if (templateId && userId) load();
    return () => (mounted = false);
  }, [templateId, userId]);

  // load events
  useEffect(() => {
    async function loadEvents() {
      try {
        // console.log({ userId });

        const r = await fetchGroups(userId);
        const ev = r.data || r; // api wrapper shape
        // console.log({ ev });

        setEvents(ev || []);
      } catch (err) {
        console.error("Failed to load groups", err);
      }
    }
    if (userId) loadEvents();
  }, [userId]);

  // load media list
  useEffect(() => {
    async function loadMedia() {
      try {
        const r = await listMedia(userId);
        const data = r.data.media || r;

        setMediaList(data || []);
      } catch (err) {
        console.error("Failed to load media", err);
      }
    }
    if (userId) loadMedia();
  }, [userId]);

  // when event selected, fetch participants
  useEffect(() => {
    async function loadParticipants() {
      try {
        if (!selectedGroup) {
          setParticipants([]);
          setSelectedParticipants({});
          return;
        }
        const r = await fetchGroupParticipants(selectedGroup, userId);
        const data = r.data || r;
        const list = data?.participants || data || [];
        // console.log({ list });

        setParticipants(list);
        // reset selectedParticipants
        const map = {};
        list.forEach((p) => (map[p.contact_id] = false));
        setSelectedParticipants(map);
        setSelectAllParticipants(false);
      } catch (err) {
        console.error("Failed to load participants", err);
      }
    }
    loadParticipants();
  }, [selectedGroup, userId]);

  // handle Select All participants
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    if (selectAllParticipants) {
      const map = {};
      participants.forEach((p) => (map[p.contact_id] = true));
      setSelectedParticipants(map);
    } else {
      const map = {};
      participants.forEach((p) => (map[p.contact_id] = false));
      setSelectedParticipants(map);
    }
  }, [selectAllParticipants, participants]);

  useEffect(() => {
    if (sendResults && progressRef.current) {
      progressRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [sendResults]);

  // helper to set variable
  const setVar = (key, value) =>
    setVariableMap((prev) => ({ ...prev, [key]: value }));

  // upload media handler
  const handleUploadMedia = async () => {
    if (!uploadFile) return alert("Choose a file to upload");
    try {
      setUploadingMedia(true);
      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("type", uploadFile.type || "image/jpeg");
      fd.append("file", uploadFile);
      const r = await uploadMedia(fd);
      const data = r.data || r;
      // expected response: { id: media_id } or { id: "123" } plus our DB row
      // best effort: refresh media list
      const listR = await listMedia(userId);
      const list = listR.data.media || listR || [];
      setMediaList(list);
      // find uploaded item if returned id present
      // assume data has wmu or media id; choose last from list as selected
      if (list.length) {
        const newest = list[list.length - 1];
        setSelectedMediaId(newest.wmu_id);
        setMediaChoice("existing");
      }
      alert("Uploaded successfully");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed: " + (err?.message || JSON.stringify(err)));
    } finally {
      setUploadingMedia(false);
    }
  };

  // build components array from variableMap + media selection + button mapping
  const buildComponentsForSend = () => {
    if (!template) return [];

    const comps = [];

    // HEADER: if template has header format IMAGE/VIDEO and user chose media
    const header = template.components.find((c) => c.type === "HEADER");
    if (header) {
      if (
        header.format &&
        (header.format === "IMAGE" || header.format === "VIDEO")
      ) {
        // if selected existing media
        if (mediaChoice === "existing" && selectedMediaId) {
          const item = mediaList.find((m) => m.wmu_id === selectedMediaId);
          if (item && item.media_id) {
            const mediaType = header.format === "VIDEO" ? "video" : "image";
            comps.push({
              type: "header",
              parameters: [
                {
                  type: mediaType,
                  [mediaType]: { id: item.media_id },
                },
              ],
            });
          }
        }
        // if uploaded and returned media id is stored in mediaList, treat as existing
        // if none selected, nothing is added (Meta might accept header from template creation example when sending? Safer to require user choose)
      } else if (header.format === "TEXT") {
        // header text may contain placeholders
        // const headerText = header.text || "";
        // const finalHeaderText = fillTemplateText(headerText, variableMap);
        // comps.push({
        //   type: "header",
        //   parameters: [{ type: "text", text: finalHeaderText }],
        // });
      }
    }

    // BODY: Meta expects body parameters array (text parameters). For positional templates, parameters should match placeholders
    const body = template.components.find((c) => c.type === "BODY");
    if (body) {
      // determine if body placeholders are numeric positional
      const bodyPlaceholders = extractPlaceholders(body.text || "");
      // If there are numeric placeholders, we build parameters in numeric order
      const numericKeys = bodyPlaceholders.filter((k) => /^\d+$/.test(k));
      if (numericKeys.length > 0) {
        // get unique numeric, sorted ascending
        const nums = Array.from(
          new Set(numericKeys.map((k) => Number(k))),
        ).sort((a, b) => a - b);
        const params = nums.map((n) => ({
          type: "text",
          text: variableMap[String(n)] || "",
        }));
        comps.push({ type: "body", parameters: params });
      } else {
        // no numeric placeholders -- use all placeholders order
        const orderKeys = Array.from(new Set(bodyPlaceholders));
        if (orderKeys.length > 0) {
          const params = orderKeys.map((k) => ({
            type: "text",
            text: variableMap[k] || "",
          }));
          comps.push({ type: "body", parameters: params });
        } else {
          // no placeholders — some templates have static body only — send empty body params
          comps.push({ type: "body", parameters: [] });
        }
      }
    }

    // BUTTONS: handle URL button params
    const buttons = template.components.find((c) => c.type === "BUTTONS");
    if (buttons && buttons.buttons) {
      // iterate each button and add a 'button' component if it requires parameters
      buttons.buttons.forEach((btn, idx) => {
        if (btn.type === "URL") {
          // find placeholders in URL
          const urlPlace = extractPlaceholders(btn.url || "");
          if (urlPlace.length > 0) {
            // build parameters for this button index
            // Meta expects: { type:"button", sub_type:"url", index:"0", parameters: [{type:"text", text: "value"}] }
            const params = urlPlace.map((k) => ({
              type: "text",
              text: variableMap[k] || "",
            }));
            comps.push({
              type: "button",
              sub_type: "url",
              index: String(idx),
              parameters: params,
            });
          } else {
            // no parameters — nothing to do for URL buttons in send payload
          }
        } else if (btn.type === "QUICK_REPLY") {
          // quick replies usually don't need parameters
        }
      });
    }

    return comps;
  };

  // send to a single recipient
  const sendToRecipient = async (toNumber, componentsPayload) => {
    // body to send to backend
    const body = {
      user_id: userId,
      to: toNumber,
      components: componentsPayload,
    };
    return apiSendTemplate(templateId, body);
  };

  // handle send click

  const handleSend = async () => {
    if (!template) return alert("Template not loaded");

    const recipients = [];
    const selectedIds = Object.keys(selectedParticipants).filter(
      (k) => selectedParticipants[k],
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach((pid) => {
        const p = participants.find((pp) => pp.contact_id === pid);
        if (p && p.phone_number) recipients.push(p.phone_number);
      });
    }

    if (recipients.length === 0)
      return alert("Select at least one participant to send to");

    const comps = buildComponentsForSend();

    if (!comps || comps.length === 0) {
      if (
        !window.confirm(
          "No components detected. Continue sending without parameters?",
        )
      ) {
        return;
      }
    }

    setSending(true);

    // to scroll to progress UI
    setTimeout(() => {
      progressRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    setSendingProgress({ total: recipients.length, current: 0 });
    setSendResults(null);

    // -------------------------
    // Simulated progress
    // -------------------------
    setSendingProgress({ total: recipients.length, current: 0 });

    const progressInterval = setInterval(async () => {
      const r = await fetchTemplateBulkProgress(userId, templateId);
      const data = r.data;

      if (data.total > 0) {
        setSendingProgress({
          total: data.total,
          current: data.completed,
        });
      }
    }, 500);

    try {
      // --------------- CALL BULK SEND ---------------
      const bulkResp = await apiSendBulkTemplate(templateId, {
        user_id: userId,
        recipients,
        group_id: selectedGroup,
        components: comps,
      });

      const data = bulkResp.data;

      setSendResults([
        ...data.results.success.map((s) => ({
          to: s.to,
          ok: true,
          resp: s,
        })),
        ...data.results.failed.map((f) => ({
          to: f.to,
          ok: false,
          error: f.error,
        })),
      ]);

      if (bulkResp.status === 200) {
        showSuccess(`Sending Status:
          Success: ${data.summary.success}
          Failed: ${data.summary.failed}`);
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Bulk send failed", err);
      showError("Bulk send failed: " + (err?.message || JSON.stringify(err)));
      // alert("Bulk send failed: " + (err?.message || JSON.stringify(err)));
    } finally {
      setSending(false);
      clearInterval(progressInterval);
      setSendingProgress(null);
    }
  };

  // console.log({ sendResults });

  // console.log({ sending, sendingProgress });

  //Retry failed recipients
  const retryFailed = async () => {
    if (!sendResults) return;

    const failed = sendResults.filter((r) => !r.ok).map((r) => r.to);
    if (failed.length === 0) return showError("No failed numbers to retry.");

    const comps = buildComponentsForSend();

    setSending(true);

    setSendingProgress({ total: failed.length, current: 0 });

    const progressInterval = setInterval(async () => {
      const r = await fetchTemplateBulkProgress(userId, templateId);
      const data = r.data;

      if (data.total > 0) {
        setSendingProgress({
          total: data.total,
          current: data.completed,
        });
      }
    }, 500);

    try {
      const bulkResp = await apiSendBulkTemplate(templateId, {
        user_id: userId,
        recipients: failed,
        components: comps,
      });

      const data = bulkResp.data;

      //       alert(
      //         `Retry complete:
      // Success: ${data.summary.success}
      // Failed: ${data.summary.failed}`,
      //       );

      showSuccess(`Retry complete:
Success: ${data.summary.success}
Failed: ${data.summary.failed}`);

      // Update results
      const successes = data.results.success.map((s) => ({
        to: s.to,
        ok: true,
        resp: s,
      }));
      const failures = data.results.failed.map((f) => ({
        to: f.to,
        ok: false,
        error: f.error,
      }));

      // Merge with existing
      setSendResults((prev) => {
        const updated = prev.map(
          (x) =>
            successes.find((y) => y.to === x.to) ||
            failures.find((y) => y.to === x.to) ||
            x,
        );
        return updated;
      });
    } catch (err) {
      clearInterval(progressInterval);
      showError("Retry failed: " + err.message);
      // alert("Retry failed: " + err.message);
    } finally {
      setSending(false);
      clearInterval(progressInterval);
      setSendingProgress(null);
    }
  };

  // handle participant checkbox toggle
  const toggleParticipant = (participant_id) => {
    setSelectedParticipants((prev) => ({
      ...prev,
      [participant_id]: !prev[participant_id],
    }));
  };

  // render loading / error
  if (loadingTemplate) {
    return <div className="p-6 text-center">Loading template...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }
  if (!template) {
    return <div className="p-6">Template not found.</div>;
  }

  // UI: show variable inputs for placeholders.body, placeholders.header, placeholders.buttons
  const allPlaceholders = [
    ...(placeholders.header || []),
    ...(placeholders.body || []),
    ...(placeholders.buttons || []),
  ];

  // console.log({ events, selectedGroup });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Send Template —{" "}
          <span className=" text-blue-600 ">{template.name}</span>
        </h1>
        <div className="text-sm text-gray-500">{template.language}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Inputs */}
        <div className="col-span-2 space-y-4">
          {/* Template preview */}
          <div>
            <h3 className="font-semibold mb-2">Preview</h3>
            <TemplatePreviewSmall
              template={template}
              mapping={variableMap}
              mediaProxyUrl={mediaProxyUrl}
            />
          </div>

          {/* Variables */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Variables</h3>

            {allPlaceholders.length === 0 && (
              <div className="text-sm text-gray-500">
                No variables found in template.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allPlaceholders.map((ph) => (
                <div key={ph} className="flex flex-col">
                  <label className="text-xs text-gray-600 mb-1">
                    {placeholderLabel(ph)}
                  </label>
                  <input
                    className="border p-2 rounded"
                    value={variableMap[ph] || ""}
                    onChange={(e) => setVar(ph, e.target.value)}
                    placeholder={`Value for ${placeholderLabel(ph)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Buttons (show button param inputs separately if exist) */}
          {placeholders.buttons.length > 0 && (
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Button URL Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {placeholders.buttons.map((ph) => (
                  <div key={ph} className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">
                      {placeholderLabel(ph)}
                    </label>
                    <input
                      className="border p-2 rounded"
                      value={variableMap[ph] || ""}
                      onChange={(e) => setVar(ph, e.target.value)}
                      placeholder={`Value for ${placeholderLabel(ph)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header media (if template header image/video) */}
          {template.components.find((c) => c.type === "HEADER") &&
            (template.components.find((c) => c.type === "HEADER").format ===
              "IMAGE" ||
              template.components.find((c) => c.type === "HEADER").format ===
                "VIDEO" ||
              template.components.find((c) => c.type === "HEADER").format ===
                "TEXT") && (
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold mb-3">Header</h3>

                {/* If header is text we show preview and editable text mapping */}
                {template.components.find((c) => c.type === "HEADER").format ===
                  "TEXT" && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-600">Header Text</label>
                    <input
                      className="w-full border p-2 rounded"
                      value={
                        fillTemplateText(
                          template.components.find((c) => c.type === "HEADER")
                            .text || "",
                          variableMap,
                        ) || ""
                      }
                      readOnly
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Header text is filled from variables above.
                    </div>
                  </div>
                )}

                {/* If header is image/video allow choose existing or upload */}
                {["IMAGE", "VIDEO"].includes(
                  template.components.find((c) => c.type === "HEADER").format,
                ) && (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mediaChoice"
                          checked={mediaChoice === "existing"}
                          onChange={() => setMediaChoice("existing")}
                        />
                        <span className="text-sm">Choose existing media</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mediaChoice"
                          checked={mediaChoice === "upload"}
                          onChange={() => setMediaChoice("upload")}
                        />
                        <span className="text-sm">Upload new media</span>
                      </label>
                    </div>

                    {mediaChoice === "existing" && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-600">
                          Select media
                        </label>
                        <select
                          className="w-full border p-2 rounded"
                          value={selectedMediaId || ""}
                          onChange={(e) => setSelectedMediaId(e.target.value)}
                        >
                          <option value="">-- choose --</option>
                          {mediaList.map((m) => (
                            <option key={m.wmu_id} value={m.wmu_id}>
                              {m.file_name || m.media_id || m.wmu_id}
                            </option>
                          ))}
                        </select>
                        Media preview
                        {selectedMediaId && (
                          <div className="mt-3 border rounded p-2 bg-gray-50">
                            {(() => {
                              const media = mediaList.find(
                                (m) => m.wmu_id === selectedMediaId,
                              );
                              if (!media) return null;

                              const previewUrl = `${
                                import.meta.env.VITE_BACKEND_URL
                              }/api/watemplates/media-proxy/${
                                media.media_id
                              }?user_id=${userId}`;

                              if (media.mime_type?.startsWith("image")) {
                                return (
                                  <img
                                    src={previewUrl}
                                    alt={media.file_name}
                                    className="max-h-48 rounded mx-auto"
                                  />
                                );
                              }

                              if (media.mime_type?.startsWith("video")) {
                                return (
                                  <video
                                    src={previewUrl}
                                    controls
                                    className="max-h-48 rounded mx-auto"
                                  />
                                );
                              }

                              return (
                                <div className="text-xs text-gray-500">
                                  Preview not available
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Selected media will be used as header media.
                        </div>
                      </div>
                    )}

                    {mediaChoice === "upload" && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-600">
                          Upload file
                        </label>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            className="px-3 py-2 bg-blue-600 text-white rounded"
                            onClick={handleUploadMedia}
                            disabled={uploadingMedia}
                          >
                            {uploadingMedia ? "Uploading..." : "Upload"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          {/* Events & Participants */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-3">Send to participants</h3>

            <div className="mb-3">
              <label className="text-xs text-gray-600">Select Group</label>
              <select
                className="w-full border p-2 rounded"
                value={selectedGroup || ""}
                onChange={(e) => setSelectedGroup(e.target.value || null)}
              >
                <option value="">-- choose group --</option>
                {events.map((ev) => (
                  <option key={ev.group_id} value={ev.group_id}>
                    {ev.group_name}
                  </option>
                ))}
              </select>
            </div>

            {participants.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectAllParticipants}
                      onChange={(e) =>
                        setSelectAllParticipants(e.target.checked)
                      }
                    />
                    <span className="text-sm">
                      Select All ({participants.length})
                    </span>
                  </label>
                </div>

                <div className="max-h-56 overflow-auto border rounded p-2 grid gap-2">
                  {participants.map((p) => (
                    <label
                      key={p.contact_id}
                      className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded"
                    >
                      <div>
                        <div className="text-sm font-medium">{p.full_name}</div>
                        <div className="text-xs text-gray-500">
                          {p.phone_number}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!selectedParticipants[p.contact_id]}
                        onChange={() => toggleParticipant(p.contact_id)}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Send button */}
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending…" : "Send to selected participants"}
            </button>

            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => navigate("/templates")}
              disabled={sending}
            >
              Cancel
            </button>
          </div>

          {/* Progress & Results Anchor */}
          <div ref={progressRef}>
            {/* Sending Progress */}
            {sendingProgress && (
              <div className="mt-4 bg-white p-4 rounded shadow space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    Sending messages…
                  </span>
                  <span className="text-gray-500">
                    {sendingProgress.current} / {sendingProgress.total}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (sendingProgress.current / sendingProgress.total) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="text-xs text-gray-500">
                  Please don’t close this page while sending is in progress.
                </div>
              </div>
            )}

            {/* Send Results */}
            {/* Send Results */}
            {sendResults && (
              <div className="bg-white p-4 rounded shadow mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Send Summary</h3>

                {/* Summary cards */}
                {(() => {
                  const total = sendResults.length;
                  const successCount = sendResults.filter((r) => r.ok).length;
                  const failedCount = total - successCount;

                  return (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded text-center">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-xl font-bold text-blue-700">
                          {total}
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded text-center">
                        <div className="text-xs text-gray-500">Sent</div>
                        <div className="text-xl font-bold text-green-700">
                          {successCount}
                        </div>
                      </div>

                      <div className="bg-red-50 p-3 rounded text-center">
                        <div className="text-xs text-gray-500">Failed</div>
                        <div className="text-xl font-bold text-red-700">
                          {failedCount}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Successful sends */}
                {sendResults.some((r) => r.ok) && (
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">
                      ✅ Successfully Sent
                    </h4>
                    <ul className="max-h-40 overflow-auto space-y-1 text-sm">
                      {sendResults
                        .filter((r) => r.ok)
                        .map((r) => (
                          <li
                            key={r.to}
                            className="flex items-center justify-between bg-green-50 px-3 py-2 rounded"
                          >
                            <span>{r.to}</span>
                            <span className="text-xs font-medium text-green-700">
                              SENT
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Failed sends */}
                {sendResults.some((r) => !r.ok) && (
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      ❌ Failed to Send
                    </h4>

                    <ul className="max-h-40 overflow-auto space-y-2 text-sm">
                      {sendResults
                        .filter((r) => !r.ok)
                        .map((r) => (
                          <li
                            key={r.to}
                            className="bg-red-50 border border-red-200 p-3 rounded"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{r.to}</span>
                              <span className="text-xs font-semibold text-red-700">
                                FAILED
                              </span>
                            </div>

                            <div className="mt-1 text-xs text-red-600 break-words">
                              {typeof r.error === "string"
                                ? r.error
                                : JSON.stringify(
                                    r?.error?.error?.message ||
                                      r?.error?.error ||
                                      r?.error,
                                  )}
                            </div>
                          </li>
                        ))}
                    </ul>

                    {/* Retry button */}
                    <div className="mt-4">
                      <button
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded"
                        onClick={retryFailed}
                      >
                        Retry Failed Sends
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column: summary & help */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold text-lg mb-2">Template info</h4>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Name:</strong> {template.name}
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Category:</strong> {template.category}
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Language:</strong> {template.language}
            </div>
            <div className="text-sm text-gray-700">
              <strong>Status:</strong> {template.status}
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h4 className="font-semibold mb-2">Preview variables</h4>
            <div className="text-sm text-gray-600">
              Live preview updates as you type above. Variables are replaced in
              body, header text and URL buttons.
            </div>
            <div className="mt-3">
              <strong>Variables</strong>
              <ul className="text-sm mt-2 space-y-1">
                {allPlaceholders.length === 0 && (
                  <li className="text-gray-500">None</li>
                )}
                {allPlaceholders.map((k) => (
                  <li key={k}>
                    <span className="font-mono">{placeholderLabel(k)}</span> →{" "}
                    <span className="text-sm">
                      {variableMap[k] || "<empty>"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow text-sm text-gray-500">
            <div className="font-semibold mb-2">Notes</div>
            <div>- If header image is required, choose or upload media.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
