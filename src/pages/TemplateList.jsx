// // src/pages/TemplateList.jsx

// import React, { useEffect, useState } from "react";
// import useAuthUser from "../hooks/useAuthUser";
// import { fetchMetaTemplates } from "../api/templates";
// import { deleteMetaTemplate } from "../api/templates";
// import { useNavigate } from "react-router-dom";

// // WhatsApp-style Preview Component
// function TemplatePreview({ template, userId }) {
//   const header = template.components.find((c) => c.type === "HEADER");
//   const body = template.components.find((c) => c.type === "BODY");
//   const buttons = template.components.find((c) => c.type === "BUTTONS");

//   console.log({ hookUserId: userId, template });

//   // Build proxy URL for header_handle media
//   const mediaUrl = header?.example?.header_handle?.[0]
//     ? `${
//         import.meta.env.VITE_BACKEND_URL
//       }/api/watemplates/media-proxy-url?url=${encodeURIComponent(
//         header.example.header_handle[0],
//       )}&user_id=${userId}`
//     : null;

//   const [isMediaLoading, setIsMediaLoading] = useState(true);
//   const [mediaError, setMediaError] = useState(false);

//   const mediaType = header?.format?.toLowerCase();

//   return (
//     <div className="bg-gray-50 rounded-xl p-4 border shadow-sm w-full max-w-2xl mx-auto mt-4">
//       <h3 className="font-semibold text-lg mb-2">Your template</h3>

//       <div className="bg-[url('/wa-bg.png')] bg-cover bg-center rounded-xl p-4">
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//           {/* HEADER (IMG / VIDEO) */}
//           {mediaUrl && (
//             <div className="w-full max-h-80 bg-gray-100 flex items-center justify-center relative">
//               {isMediaLoading && (
//                 <div className="absolute inset-0 animate-pulse bg-gray-200 flex items-center justify-center">
//                   <span className="text-gray-500 text-sm">Loading media…</span>
//                 </div>
//               )}

//               {mediaError ? (
//                 <div className="p-6 text-gray-400 text-sm">
//                   Failed to load media
//                 </div>
//               ) : mediaType === "image" ? (
//                 <img
//                   src={mediaUrl}
//                   alt="header"
//                   className="max-w-96 max-h-64 object-contain"
//                   onLoad={() => setIsMediaLoading(false)}
//                   onError={() => setMediaError(true)}
//                 />
//               ) : mediaType === "video" ? (
//                 <video
//                   src={mediaUrl}
//                   controls
//                   className="w-full"
//                   onLoadedData={() => setIsMediaLoading(false)}
//                   onError={() => setMediaError(true)}
//                 />
//               ) : (
//                 <div className="p-6 text-gray-500">Unsupported header type</div>
//               )}
//             </div>
//           )}

//           {/* BODY */}
//           <div className="p-4 whitespace-pre-wrap leading-relaxed text-gray-800">
//             {(() => {
//               const templateText = body?.text || "";
//               const exampleValues = body?.example?.body_text?.[0] || [];

//               let parts = [];

//               // Handle positional variables like {{1}}
//               let filled = templateText.replace(
//                 /\{\{(\d+)\}\}/g,
//                 (match, index) => {
//                   const value = exampleValues[index - 1] || match;
//                   return `%%${value}%%`; // mark for bold
//                 },
//               );

//               // Handle named variables like {{guest}}
//               filled = filled.replace(/\{\{(\w+)\}\}/g, (match, name) => {
//                 const idx = exampleValues.findIndex(
//                   (v) => v.toLowerCase() === name.toLowerCase(),
//                 );
//                 const value = idx !== -1 ? exampleValues[idx] : match;
//                 return `%%${value}%%`;
//               });

//               // Split bold markers into parts
//               filled.split(/(%%.*?%%)/).forEach((chunk, i) => {
//                 if (chunk.startsWith("%%") && chunk.endsWith("%%")) {
//                   const text = chunk.replace(/%%/g, "");
//                   parts.push(
//                     <strong key={i} className="font-semibold">
//                       {text}
//                     </strong>,
//                   );
//                 } else {
//                   parts.push(<span key={i}>{chunk}</span>);
//                 }
//               });

//               return parts;
//             })()}
//           </div>

//           {/* BUTTONS */}
//           {buttons?.buttons && (
//             <div className="border-t">
//               {buttons.buttons.map((btn, i) => (
//                 <button
//                   key={i}
//                   className="w-full text-blue-600 py-3 flex items-center justify-center hover:bg-blue-50 transition"
//                 >
//                   ➜ {btn.text}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function TemplateList() {
//   const { userId } = useAuthUser();
//   const navigate = useNavigate();
//   const [templates, setTemplates] = useState([]);
//   const [expanded, setExpanded] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch templates from backend
//   const loadTemplates = async () => {
//     try {
//       setLoading(true);
//       const res = await fetchMetaTemplates(userId);
//       setTemplates(res.data.templates || []);

//       console.log({ templateData: res.data.templates });
//     } catch (err) {
//       console.error("Error loading templates:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (userId) loadTemplates();
//   }, [userId]);

//   // Delete handler for template
//   const handleDelete = async (tpl) => {
//     if (!confirm(`Are you sure you want to delete template "${tpl.name}"?`))
//       return;

//     try {
//       await deleteMetaTemplate(tpl.id, tpl.name, userId);
//       alert("Template deleted");
//       loadTemplates();
//     } catch (err) {
//       alert("Delete failed: " + (err.response?.data?.error || err.message));
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl sm:text-3xl uppercase font-inter text-center font-bold mt-4 mb-8">
//         WhatsApp Templates
//       </h2>

//       {/* Loading State */}
//       {loading && (
//         <div className="text-center text-gray-600 py-10">
//           <div className="animate-pulse text-lg">Loading templates…</div>
//         </div>
//       )}

//       {/* Empty State */}
//       {!loading && templates.length === 0 && (
//         <div className="text-center text-gray-500 py-10">
//           No templates found.
//         </div>
//       )}

//       {/* Template Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse min-w-[600px]">
//           <thead>
//             <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
//               <th className="p-3">Template Name</th>
//               <th className="p-3">Category</th>
//               <th className="p-3">Language</th>
//               <th className="p-3">Status</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {templates.map((tpl) => (
//               <React.Fragment key={tpl.id}>
//                 <tr className="border-b hover:bg-gray-50">
//                   <td className="p-3">{tpl.name}</td>
//                   <td className="p-3">{tpl.category}</td>
//                   <td className="p-3">{tpl.language}</td>

//                   <td className="p-3">
//                     <span
//                       className={`px-3 py-1 text-xs rounded-full ${
//                         tpl.status === "APPROVED"
//                           ? "bg-green-100 text-green-600"
//                           : "bg-yellow-100 text-yellow-700"
//                       }`}
//                     >
//                       {tpl.status}
//                     </span>
//                   </td>

//                   {/* ACTION BUTTONS */}
//                   <td className="p-3 text-center flex gap-2 justify-center">
//                     <button
//                       className="px-3 py-1 text-sm bg-blue-400 text-white rounded hover:bg-blue-500"
//                       onClick={() =>
//                         setExpanded(expanded === tpl.id ? null : tpl.id)
//                       }
//                     >
//                       {expanded === tpl.id ? "Hide" : "View"}
//                     </button>

//                     <button
//                       className={`px-3 py-1 text-sm bg-green-400 text-white rounded hover:bg-green-500 ${
//                         tpl.status === "APPROVED" ? "inline-block" : "hidden"
//                       } `}
//                       onClick={() => navigate(`/templates/send/${tpl.id}`)}
//                       disabled={tpl.status === "APPROVED" ? false : true}
//                     >
//                       Send
//                     </button>

//                     <button
//                       className="px-3 py-1 text-sm bg-red-400 text-white rounded hover:bg-red-500"
//                       // onClick={() => deleteTemplate(tpl.id)}
//                       onClick={() => handleDelete(tpl)}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>

//                 {/* Expanded Preview Row */}
//                 {expanded === tpl.id && (
//                   <tr>
//                     <td colSpan="5">
//                       <TemplatePreview template={tpl} userId={userId} />
//                     </td>
//                   </tr>
//                 )}
//               </React.Fragment>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { fetchMetaTemplates, deleteMetaTemplate } from "../api/templates";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Eye, Send, Trash2 } from "lucide-react";
import { dismissToast, showLoading, showSuccess } from "../utils/toast";

/* ================================
   WhatsApp-style Preview Component
================================ */
function TemplatePreview({ template, userId }) {
  const header = template.components.find((c) => c.type === "HEADER");
  const body = template.components.find((c) => c.type === "BODY");
  const buttons = template.components.find((c) => c.type === "BUTTONS");

  const mediaUrl = header?.example?.header_handle?.[0]
    ? `${import.meta.env.VITE_BACKEND_URL}/api/watemplates/media-proxy-url?url=${encodeURIComponent(
        header.example.header_handle[0],
      )}&user_id=${userId}`
    : null;

  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const mediaType = header?.format?.toLowerCase();

  return (
    <div className="w-full max-w-3xl mx-auto my-8 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-xl p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Template Preview
      </h3>

      <div className="bg-[url('/wa-bg.png')] bg-cover bg-center rounded-2xl p-5">
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* HEADER */}
          {mediaUrl && (
            <div className="relative bg-gray-100 flex justify-center items-center max-h-72">
              {isMediaLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center text-sm text-gray-500">
                  Loading media…
                </div>
              )}

              {mediaError ? (
                <div className="p-6 text-gray-400 text-sm">
                  Failed to load media
                </div>
              ) : mediaType === "image" ? (
                <img
                  src={mediaUrl}
                  alt="header"
                  className="max-h-64 object-contain"
                  onLoad={() => setIsMediaLoading(false)}
                  onError={() => setMediaError(true)}
                />
              ) : mediaType === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full"
                  onLoadedData={() => setIsMediaLoading(false)}
                  onError={() => setMediaError(true)}
                />
              ) : null}
            </div>
          )}

          {/* BODY */}
          <div className="p-4 text-gray-800 leading-relaxed whitespace-pre-wrap">
            {(() => {
              const templateText = body?.text || "";
              const exampleValues = body?.example?.body_text?.[0] || [];

              let filled = templateText.replace(
                /\{\{(\d+)\}\}/g,
                (match, index) => `%%${exampleValues[index - 1] || match}%%`,
              );

              filled = filled.replace(/\{\{(\w+)\}\}/g, (match, name) => {
                const value =
                  exampleValues.find(
                    (v) => v.toLowerCase() === name.toLowerCase(),
                  ) || match;
                return `%%${value}%%`;
              });

              return filled.split(/(%%.*?%%)/).map((chunk, i) =>
                chunk.startsWith("%%") ? (
                  <strong key={i} className="font-semibold">
                    {chunk.replace(/%%/g, "")}
                  </strong>
                ) : (
                  <span key={i}>{chunk}</span>
                ),
              );
            })()}
          </div>

          {/* BUTTONS */}
          {buttons?.buttons && (
            <div className="border-t">
              {buttons.buttons.map((btn, i) => (
                <button
                  key={i}
                  className="w-full py-3 text-indigo-600 font-medium hover:bg-indigo-50 transition"
                >
                  ➜ {btn.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================
   Template List Page
================================ */
export default function TemplateList() {
  const { userId } = useAuthUser();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  // Popover menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetchMetaTemplates(userId);
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadTemplates();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleDelete = async (tpl) => {
    if (!confirm(`Delete template "${tpl.name}"?`)) return;
    const toastId = showLoading("Deleting template...");

    await deleteMetaTemplate(tpl.id, tpl.name, userId);

    dismissToast(toastId);
    showSuccess("Template deleted");
    loadTemplates();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-semibold tracking-wider uppercase text-center mb-10">
        WhatsApp Templates
      </h2>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16 text-gray-600 animate-pulse">
          Loading templates…
        </div>
      )}

      {/* Empty */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No templates found
        </div>
      )}

      {/* Table */}
      {!loading && templates.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="bg-white text-xs uppercase tracking-wide text-gray-600">
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Language</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {templates.map((tpl) => (
                <React.Fragment key={tpl.id}>
                  <tr className="border-t text-center hover:bg-white/60 transition">
                    <td className="p-4 font-medium">{tpl.name}</td>
                    <td className="p-4 text-sm">{tpl.category}</td>
                    <td className="p-4 text-sm">{tpl.language}</td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          tpl.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {tpl.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div
                        className="relative inline-block"
                        ref={openMenuId === tpl.id ? menuRef : null}
                      >
                        {/* Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === tpl.id ? null : tpl.id,
                            );
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition"
                          aria-label="More actions"
                        >
                          <MoreVertical size={18} />
                        </button>

                        {/* Popover */}
                        {openMenuId === tpl.id && (
                          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                            {/* Preview */}
                            <button
                              onClick={() => {
                                setExpanded(
                                  expanded === tpl.id ? null : tpl.id,
                                );
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={16} />
                              {expanded === tpl.id ? "Hide Preview" : "Preview"}
                            </button>

                            {/* Send (Approved only) */}
                            {tpl.status === "APPROVED" && (
                              <button
                                onClick={() => {
                                  navigate(`/templates/send/${tpl.id}`);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50"
                              >
                                <Send size={16} />
                                Send
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => {
                                handleDelete(tpl);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500 text-white hover:bg-indigo-600"
                          onClick={() =>
                            setExpanded(expanded === tpl.id ? null : tpl.id)
                          }
                        >
                          {expanded === tpl.id ? "Hide" : "Preview"}
                        </button>

                        {tpl.status === "APPROVED" && (
                          <button
                            className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                            onClick={() =>
                              navigate(`/templates/send/${tpl.id}`)
                            }
                          >
                            Send
                          </button>
                        )}

                        <button
                          className="px-3 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleDelete(tpl)}
                        >
                          Delete
                        </button>
                      </div>
                    </td> */}
                  </tr>

                  {expanded === tpl.id && (
                    <tr>
                      <td
                        colSpan="5"
                        className="bg-gradient-to-r from-pink-50 to-violet-50"
                      >
                        <TemplatePreview template={tpl} userId={userId} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
