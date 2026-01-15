// src/pages/SendTemplate.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  fetchMetaTemplatesById,
  sendTemplate as apiSendTemplate,
  sendTemplateBulk as apiSendBulkTemplate,
} from "../api/templates";
import { fetchEvents, fetchEventParticipants } from "../api/events";
import { listMedia, uploadMedia } from "../api/media";

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

  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [error, setError] = useState(null);

  // events & participants
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
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
        header.example.header_handle[0]
      )}&user_id=${userId}`;
    }

    return null;
  }, [template, mediaChoice, selectedMediaId, mediaList, userId]);

  // load template
  useEffect(() => {
    console.log(" before loading");
    console.log({ templateId, userId });

    let mounted = true;
    async function load() {
      try {
        setLoadingTemplate(true);

        console.log("in template loading, before template get loaded");

        setError(null);
        const resp = await fetchMetaTemplatesById(templateId, userId);
        // your api wrapper returns axios-like: resp.data.template maybe
        const tpl = resp.data?.template || resp.data || null;

        console.log({ tpl_data: tpl });

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
        const r = await fetchEvents(userId);
        const ev = r.data || r; // api wrapper shape
        setEvents(ev || []);
      } catch (err) {
        console.error("Failed to load events", err);
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
        if (!selectedEvent) {
          setParticipants([]);
          setSelectedParticipants({});
          return;
        }
        const r = await fetchEventParticipants(selectedEvent, userId);
        const data = r.data || r;
        const list = data?.participants || data || [];
        setParticipants(list);
        // reset selectedParticipants
        const map = {};
        list.forEach((p) => (map[p.participant_id] = false));
        setSelectedParticipants(map);
        setSelectAllParticipants(false);
      } catch (err) {
        console.error("Failed to load participants", err);
      }
    }
    loadParticipants();
  }, [selectedEvent, userId]);

  // handle Select All participants
  useEffect(() => {
    if (!participants || participants.length === 0) return;
    if (selectAllParticipants) {
      const map = {};
      participants.forEach((p) => (map[p.participant_id] = true));
      setSelectedParticipants(map);
    } else {
      const map = {};
      participants.forEach((p) => (map[p.participant_id] = false));
      setSelectedParticipants(map);
    }
  }, [selectAllParticipants, participants]);

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
          new Set(numericKeys.map((k) => Number(k)))
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

  // // handle send click
  // const handleSend = async () => {
  //   if (!template) return alert("Template not loaded");
  //   // gather recipients
  //   const recipients = [];
  //   // from participants map
  //   const selectedIds = Object.keys(selectedParticipants).filter(
  //     (k) => selectedParticipants[k]
  //   );
  //   if (selectedIds.length > 0) {
  //     selectedIds.forEach((pid) => {
  //       const p = participants.find((pp) => pp.participant_id === pid);
  //       if (p && p.phone_number) recipients.push(p.phone_number);
  //     });
  //   }
  //   // also allow manual single number (if no participants selected) - for simplicity, require at least one recipient
  //   if (recipients.length === 0)
  //     return alert("Select at least one participant to send to");

  //   // build components once (those are same for all recipients except you may want to customize per recipient — currently same)
  //   const comps = buildComponentsForSend();

  //   if (!comps || comps.length === 0) {
  //     if (
  //       !window.confirm(
  //         "No components detected. Do you want to proceed sending without parameters?"
  //       )
  //     ) {
  //       return;
  //     }
  //   }

  //   setSending(true);
  //   setSendResults(null);
  //   try {
  //     // send in parallel (Promise.allSettled) to collect successes/fails
  //     const promises = recipients.map((to) => sendToRecipient(to, comps));
  //     const settled = await Promise.allSettled(promises);

  //     const results = settled.map((s, i) => {
  //       if (s.status === "fulfilled") {
  //         const respData = s.value.data || s.value;
  //         const ok = !respData?.sendResp?.error && !respData?.error;
  //         return {
  //           to: recipients[i],
  //           ok,
  //           resp: respData,
  //         };
  //       } else {
  //         return {
  //           to: recipients[i],
  //           ok: false,
  //           error: s.reason?.response?.data || s.reason?.message || s.reason,
  //         };
  //       }
  //     });

  //     setSendResults(results);

  //     // show simple summary
  //     const successCount = results.filter((r) => r.ok).length;
  //     const failCount = results.length - successCount;
  //     alert(`Send complete: ${successCount} success, ${failCount} failed.`);

  //     // after sending to all, redirect to templates list (as requested)
  //     navigate("/templates"); // adjust path if different
  //   } catch (err) {
  //     console.error("Send failed", err);
  //     alert("Send process failed: " + (err?.message || JSON.stringify(err)));
  //   } finally {
  //     setSending(false);
  //   }
  // };

  //   const handleSend = async () => {
  //     if (!template) return alert("Template not loaded");

  //     // ------------------------
  //     // Build recipient list
  //     // ------------------------
  //     const recipients = [];
  //     const selectedIds = Object.keys(selectedParticipants).filter(
  //       (k) => selectedParticipants[k]
  //     );

  //     if (selectedIds.length > 0) {
  //       selectedIds.forEach((pid) => {
  //         const p = participants.find((pp) => pp.participant_id === pid);
  //         if (p && p.phone_number) recipients.push(p.phone_number);
  //       });
  //     }

  //     if (recipients.length === 0)
  //       return alert("Select at least one participant to send to");

  //     // ------------------------
  //     // Build components
  //     // ------------------------
  //     const comps = buildComponentsForSend();

  //     if (!comps || comps.length === 0) {
  //       if (
  //         !window.confirm(
  //           "No components detected. Do you want to proceed sending without parameters?"
  //         )
  //       ) {
  //         return;
  //       }
  //     }

  //     setSending(true);
  //     setSendResults(null);

  //     try {
  //       // ------------------------
  //       // CALL BULK SEND ENDPOINT
  //       // ------------------------
  //       const bulkResp = await apiSendBulkTemplate(templateId, {
  //         user_id: userId,
  //         recipients: recipients, // <-- list of phone numbers
  //         components: comps,
  //       });

  //       const data = bulkResp.data;

  //       // ------------------------
  //       // Show summary + detailed result
  //       // ------------------------
  //       alert(
  //         `Bulk send complete:
  // Success: ${data.summary.success}
  // Failed: ${data.summary.failed}`
  //       );

  //       // Show results in UI
  //       setSendResults([
  //         ...data.results.success.map((s) => ({
  //           to: s.to,
  //           ok: true,
  //           resp: s,
  //         })),
  //         ...data.results.failed.map((f) => ({
  //           to: f.to,
  //           ok: false,
  //           error: f.error,
  //         })),
  //       ]);

  //       // Redirect after done
  //       navigate("/templates");
  //     } catch (err) {
  //       console.error("Bulk send failed", err);
  //       alert("Bulk send failed: " + (err?.message || JSON.stringify(err)));
  //     } finally {
  //       setSending(false);
  //     }
  //   };

  const handleSend = async () => {
    if (!template) return alert("Template not loaded");

    const recipients = [];
    const selectedIds = Object.keys(selectedParticipants).filter(
      (k) => selectedParticipants[k]
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach((pid) => {
        const p = participants.find((pp) => pp.participant_id === pid);
        if (p && p.phone_number) recipients.push(p.phone_number);
      });
    }

    if (recipients.length === 0)
      return alert("Select at least one participant to send to");

    const comps = buildComponentsForSend();

    if (!comps || comps.length === 0) {
      if (
        !window.confirm(
          "No components detected. Continue sending without parameters?"
        )
      ) {
        return;
      }
    }

    setSending(true);
    setSendingProgress({ total: recipients.length, current: 0 });
    setSendResults(null);

    // -------------------------
    // Simulated progress
    // -------------------------
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress += Math.ceil(recipients.length / 25); // smooth animation
      if (progress > recipients.length) progress = recipients.length;
      setSendingProgress({ total: recipients.length, current: progress });
    }, 120);

    try {
      // --------------- CALL BULK SEND ---------------
      const bulkResp = await apiSendBulkTemplate(templateId, {
        user_id: userId,
        recipients,
        event_id: selectedEvent,
        components: comps,
      });

      clearInterval(progressTimer);
      setSendingProgress({
        total: recipients.length,
        current: recipients.length,
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
    } catch (err) {
      clearInterval(progressTimer);
      console.error("Bulk send failed", err);
      alert("Bulk send failed: " + (err?.message || JSON.stringify(err)));
    } finally {
      setSending(false);
    }
  };

  //Retry failed recipients
  const retryFailed = async () => {
    if (!sendResults) return;

    const failed = sendResults.filter((r) => !r.ok).map((r) => r.to);
    if (failed.length === 0) return alert("No failed numbers to retry.");

    const comps = buildComponentsForSend();

    setSending(true);
    setSendingProgress({ total: failed.length, current: 0 });
    let progress = 0;

    const timer = setInterval(() => {
      progress += Math.ceil(failed.length / 20);
      if (progress > failed.length) progress = failed.length;
      setSendingProgress({ total: failed.length, current: progress });
    }, 120);

    try {
      const bulkResp = await apiSendBulkTemplate(templateId, {
        user_id: userId,
        recipients: failed,
        components: comps,
      });

      clearInterval(timer);

      const data = bulkResp.data;

      alert(
        `Retry complete:
Success: ${data.summary.success}
Failed: ${data.summary.failed}`
      );

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
            x
        );
        return updated;
      });
    } catch (err) {
      clearInterval(timer);
      alert("Retry failed: " + err.message);
    } finally {
      setSending(false);
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

  // console.log({ events, selectedEvent });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Send Template — {template.name}</h1>
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
                          variableMap
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
                  template.components.find((c) => c.type === "HEADER").format
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

                      {/* <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mediaChoice"
                          checked={mediaChoice === "none"}
                          onChange={() => setMediaChoice("none")}
                        />
                        <span className="text-sm">No media</span>
                      </label> */}
                    </div>

                    {/* {mediaChoice === "existing" && (
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
                        <div className="text-xs text-gray-400 mt-1">
                          Selected media which will be used to send template.
                        </div>
                      </div>
                    )} */}

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
                                (m) => m.wmu_id === selectedMediaId
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
              <label className="text-xs text-gray-600">Select Event</label>
              <select
                className="w-full border p-2 rounded"
                value={selectedEvent || ""}
                onChange={(e) => setSelectedEvent(e.target.value || null)}
              >
                <option value="">-- choose event --</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.title || ev.event_name || ev.event_id}
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
                      key={p.participant_id}
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
                        checked={!!selectedParticipants[p.participant_id]}
                        onChange={() => toggleParticipant(p.participant_id)}
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
            >
              Cancel
            </button>
          </div>

          {/* send results */}
          {/* {sendResults && (
            <div className="bg-white p-3 rounded shadow mt-4">
              <h3 className="font-semibold mb-2">Send results</h3>
              <ul className="space-y-2 text-sm">
                {sendResults.map((r) => (
                  <li
                    key={r.to}
                    className={r.ok ? "text-green-700" : "text-red-600"}
                  >
                    {r.to}: {r.ok ? "SENT" : "FAILED"}{" "}
                    {!r.ok && (
                      <pre className="text-xs">{JSON.stringify(r.error)}</pre>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )} */}

          {/* Progress UI */}
          {/* {sendingProgress && (
            <div className="mt-4 text-sm text-blue-700 bg-blue-50 p-3 rounded">
              Sending… {sendingProgress.current}/{sendingProgress.total}
            </div>
          )} */}

          {/* Send Results */}
          {sendResults && (
            <div className="bg-white p-3 rounded shadow mt-4">
              <h3 className="font-semibold mb-2">Send results</h3>

              <ul className="space-y-2 text-sm">
                {sendResults.map((r) => (
                  <li
                    key={r.to}
                    className={r.ok ? "text-green-700" : "text-red-600"}
                  >
                    {r.to}: {r.ok ? "SENT" : "FAILED"}
                    {!r.ok && (
                      <pre className="text-xs bg-red-50 p-2 rounded mt-1 text-wrap">
                        {JSON.stringify(r.error)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>

              {/* Retry Failed Button */}
              {sendResults.some((r) => !r.ok) && (
                <button
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded"
                  onClick={retryFailed}
                >
                  Retry Failed Sends
                </button>
              )}
            </div>
          )}
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
            {/* <div>
              - For URL buttons that use {{ n }} or {{ name }}, fill the values
              above.
            </div> */}
            <div>- If header image is required, choose or upload media.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
