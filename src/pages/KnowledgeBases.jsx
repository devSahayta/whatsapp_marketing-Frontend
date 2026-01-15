import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchKnowledgeBases } from "../api/knowledgeBases";
import useAuthUser from "../hooks/useAuthUser";

export default function KnowledgeBases() {
  const { userId } = useAuthUser();
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    fetchKnowledgeBases(userId)
      .then((res) => setKnowledgeBases(res.data))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Knowledge Bases
        </h1>

        <button
          onClick={() => navigate("/knowledge-bases/create")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Create Knowledge Base
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : knowledgeBases.length === 0 ? (
        <div className="text-gray-500 bg-gray-50 p-6 rounded-lg">
          No knowledge bases created yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
              className="cursor-pointer border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-medium text-gray-800 mb-1">
                {kb.name}
              </h3>

              <p className="text-xs text-gray-400 break-all">
                Created At: {kb.created_at.slice(0, 10)}
              </p>

              <div className="mt-3 text-sm text-indigo-600">View content →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
