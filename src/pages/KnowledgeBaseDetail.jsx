// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { fetchKnowledgeBaseById } from "../api/knowledgeBases";

// export default function KnowledgeBaseDetail() {
//   const { id } = useParams();
//   const [kb, setKb] = useState(null);

//   useEffect(() => {
//     fetchKnowledgeBaseById(id).then((res) => {
//       setKb(res.data);
//     });
//   }, [id]);

//   if (!kb) {
//     return <div className="p-6 text-gray-500">Loading...</div>;
//   }

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-semibold text-gray-800 mb-4">{kb.name}</h1>

//       <div className="bg-white rounded-xl shadow-sm p-5">
//         <h3 className="text-sm font-medium text-gray-500 mb-2">
//           Knowledge Content
//         </h3>

//         {kb.knowledge_entries.map((entry, index) => (
//           <pre
//             key={index}
//             className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
//           >
//             {entry.content}
//           </pre>
//         ))}
//       </div>
//     </div>
//   );
// }

//-----------------------------2nd version - with delete function-------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchKnowledgeBaseById,
  deleteKnowledgeBase,
} from "../api/knowledgeBases";
import useAuthUser from "../hooks/useAuthUser";

export default function KnowledgeBaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuthUser();

  const [kb, setKb] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchKnowledgeBaseById(id).then((res) => {
      setKb(res.data);
    });
  }, [id]);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this knowledge base? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await deleteKnowledgeBase(id, userId);

      navigate("/knowledge-bases");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to delete knowledge base. It may be in use by an agent.";

      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  if (!kb) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={() => navigate("/knowledge-bases")}
          className="px-3 py-1.5 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-gray-800">{kb.name}</h1>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Knowledge Content
        </h3>

        {kb.knowledge_entries.map((entry, index) => (
          <pre
            key={index}
            className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
          >
            {entry.content}
          </pre>
        ))}
      </div>
    </div>
  );
}
