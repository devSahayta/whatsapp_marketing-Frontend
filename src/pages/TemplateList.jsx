// src/pages/TemplateList.jsx

import React, { useEffect, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { fetchMetaTemplates } from "../api/templates";
import { deleteMetaTemplate } from "../api/templates";
import { useNavigate } from "react-router-dom";

// WhatsApp-style Preview Component
function TemplatePreview({ template, userId }) {
  const header = template.components.find((c) => c.type === "HEADER");
  const body = template.components.find((c) => c.type === "BODY");
  const buttons = template.components.find((c) => c.type === "BUTTONS");

  console.log({ hookUserId: userId, template });

  // Build proxy URL for header_handle media
  const mediaUrl = header?.example?.header_handle?.[0]
    ? `${
        import.meta.env.VITE_BACKEND_URL
      }/api/watemplates/media-proxy-url?url=${encodeURIComponent(
        header.example.header_handle[0]
      )}&user_id=${userId}`
    : null;

  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [mediaError, setMediaError] = useState(false);

  const mediaType = header?.format?.toLowerCase();

  return (
    <div className="bg-gray-50 rounded-xl p-4 border shadow-sm w-full max-w-2xl mx-auto mt-4">
      <h3 className="font-semibold text-lg mb-2">Your template</h3>

      <div className="bg-[url('/wa-bg.png')] bg-cover bg-center rounded-xl p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* HEADER (IMG / VIDEO) */}
          {mediaUrl && (
            <div className="w-full max-h-80 bg-gray-100 flex items-center justify-center relative">
              {isMediaLoading && (
                <div className="absolute inset-0 animate-pulse bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Loading media…</span>
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
                  className="max-w-96 max-h-64 object-contain"
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
              ) : (
                <div className="p-6 text-gray-500">Unsupported header type</div>
              )}
            </div>
          )}

          {/* BODY */}
          <div className="p-4 whitespace-pre-wrap leading-relaxed text-gray-800">
            {(() => {
              const templateText = body?.text || "";
              const exampleValues = body?.example?.body_text?.[0] || [];

              let parts = [];

              // Handle positional variables like {{1}}
              let filled = templateText.replace(
                /\{\{(\d+)\}\}/g,
                (match, index) => {
                  const value = exampleValues[index - 1] || match;
                  return `%%${value}%%`; // mark for bold
                }
              );

              // Handle named variables like {{guest}}
              filled = filled.replace(/\{\{(\w+)\}\}/g, (match, name) => {
                const idx = exampleValues.findIndex(
                  (v) => v.toLowerCase() === name.toLowerCase()
                );
                const value = idx !== -1 ? exampleValues[idx] : match;
                return `%%${value}%%`;
              });

              // Split bold markers into parts
              filled.split(/(%%.*?%%)/).forEach((chunk, i) => {
                if (chunk.startsWith("%%") && chunk.endsWith("%%")) {
                  const text = chunk.replace(/%%/g, "");
                  parts.push(
                    <strong key={i} className="font-semibold">
                      {text}
                    </strong>
                  );
                } else {
                  parts.push(<span key={i}>{chunk}</span>);
                }
              });

              return parts;
            })()}
          </div>

          {/* BUTTONS */}
          {buttons?.buttons && (
            <div className="border-t">
              {buttons.buttons.map((btn, i) => (
                <button
                  key={i}
                  className="w-full text-blue-600 py-3 flex items-center justify-center hover:bg-blue-50 transition"
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

export default function TemplateList() {
  const { userId } = useAuthUser();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch templates from backend
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetchMetaTemplates(userId);
      setTemplates(res.data.templates || []);

      console.log({ templateData: res.data.templates });
    } catch (err) {
      console.error("Error loading templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadTemplates();
  }, [userId]);

  // Delete handler for template
  const handleDelete = async (tpl) => {
    if (!confirm(`Are you sure you want to delete template "${tpl.name}"?`))
      return;

    try {
      await deleteMetaTemplate(tpl.id, tpl.name, userId);
      alert("Template deleted");
      loadTemplates();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">WhatsApp Templates</h2>

      {/* Loading State */}
      {loading && (
        <div className="text-center text-gray-600 py-10">
          <div className="animate-pulse text-lg">Loading templates…</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && templates.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No templates found.
        </div>
      )}

      {/* Template Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
              <th className="p-3">Template Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Language</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((tpl) => (
              <React.Fragment key={tpl.id}>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">{tpl.name}</td>
                  <td className="p-3">{tpl.category}</td>
                  <td className="p-3">{tpl.language}</td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        tpl.status === "APPROVED"
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {tpl.status}
                    </span>
                  </td>

                  {/* ACTION BUTTONS */}
                  <td className="p-3 text-center flex gap-2 justify-center">
                    <button
                      className="px-3 py-1 text-sm bg-blue-400 text-white rounded hover:bg-blue-500"
                      onClick={() =>
                        setExpanded(expanded === tpl.id ? null : tpl.id)
                      }
                    >
                      {expanded === tpl.id ? "Hide" : "View"}
                    </button>

                    <button
                      className={`px-3 py-1 text-sm bg-green-400 text-white rounded hover:bg-green-500 ${
                        tpl.status === "APPROVED" ? "inline-block" : "hidden"
                      } `}
                      onClick={() => navigate(`/templates/send/${tpl.id}`)}
                      disabled={tpl.status === "APPROVED" ? false : true}
                    >
                      Send
                    </button>

                    <button
                      className="px-3 py-1 text-sm bg-red-400 text-white rounded hover:bg-red-500"
                      // onClick={() => deleteTemplate(tpl.id)}
                      onClick={() => handleDelete(tpl)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Expanded Preview Row */}
                {expanded === tpl.id && (
                  <tr>
                    <td colSpan="5">
                      <TemplatePreview template={tpl} userId={userId} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
