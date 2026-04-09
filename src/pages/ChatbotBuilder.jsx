// src/pages/ChatbotBuilder.jsx
// Drag-and-drop chatbot flow builder using @xyflow/react

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Play, Pause, Loader2, Zap } from "lucide-react";

import useAuthUser from "../hooks/useAuthUser";
import { showSuccess, showError } from "../utils/toast";
import { getFlowById, updateFlow, saveFlow } from "../api/chatbot";
import { fetchMetaTemplates, fetchTemplatesForBuilder } from "../api/templates";
import ChatbotNode, { NODE_META } from "../components/chatbot/ChatbotNode";
import NodePalette from "../components/chatbot/NodePalette";
import NodeProperties from "../components/chatbot/NodeProperties";

// Register custom node types
const nodeTypes = Object.fromEntries(
  [
    "keyword_trigger",
    "api_trigger",
    "send_message",
    "send_template",
    "wait_for_input",
    "condition",
    "http_request",
    "delay",
    "ai_fallback",
    "handoff_to_agent",
    "end_flow",
    "trigger_campaign",
  ].map((t) => [t, ChatbotNode]),
);

// Default config for each node type
const DEFAULT_CONFIG = {
  keyword_trigger: { keywords: [], match_type: "contains" },
  api_trigger: {},
  send_message: { text: "" },
  send_template: { template_id: "", template_name: "" },
  wait_for_input: { prompt: "", save_as: "" },
  condition: { variable: "", operator: "==", value: "" },
  http_request: { method: "GET", url: "", save_as: "" },
  delay: { seconds: 5 },
  ai_fallback: { system_prompt: "" },
  handoff_to_agent: { message: "" },
  end_flow: { message: "" },
  trigger_campaign: { campaign_id: "" },
};

// Convert backend node to ReactFlow node
function backendToRF(n) {
  return {
    id: n.node_id,
    type: n.node_type,
    position: { x: n.position_x, y: n.position_y },
    data: { ...(n.config || {}) },
  };
}

// Convert backend edge to ReactFlow edge
function backendEdgeToRF(e) {
  return {
    id: e.edge_id,
    source: e.source_node_id,
    target: e.target_node_id,
    sourceHandle:
      e.condition_label === "yes"
        ? "yes"
        : e.condition_label === "no"
          ? "no"
          : null,
    label: e.condition_label,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: { type: "arrowclosed", color: "#94a3b8" },
  };
}

function BuilderCanvas({ flowId }) {
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const rfWrapper = useRef(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [rfInstance, setRfInstance] = useState(null);

  const [flow, setFlow] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Load flow data
  useEffect(() => {
    if (!flowId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getFlowById(flowId);
        const { flow: f, nodes: ns, edges: es } = res.data;
        setFlow(f);
        setNodes((ns || []).map(backendToRF));
        setEdges(
          (es || []).map((e) => ({
            ...backendEdgeToRF(e),
          })),
        );

        // Load templates: merge Meta live list (for variable info) with DB records (for wt_id)
        if (f?.account_id) {
          try {
            // const metaRes = await fetchMetaTemplates(user.id);
            // const metaTemplates = metaRes.data?.templates || [];
            const metaRes = await fetchTemplatesForBuilder(user.id);
            const metaTemplates = metaRes.data || [];

            console.log("Meta templates:", metaTemplates);

            // // Only APPROVED templates
            // const merged = metaTemplates.filter((t) => t.status === "APPROVED");
            // setTemplates(merged);

            const merged = metaTemplates
              .filter((t) => {
                // only approved
                if (t.status !== "APPROVED") return false;

                // no header → allowed
                if (!t.header_format) return true;

                const isMediaHeader = ["IMAGE", "VIDEO", "DOCUMENT"].includes(
                  t.header_format,
                );

                if (!isMediaHeader) return true;

                // allow only if media_id exists
                return !!t.media_id;
              })
              .map((t) => t.preview);

            setTemplates(merged);

            console.log("Merged templates:", merged);
          } catch {
            // templates are optional
          }
        }
      } catch (err) {
        showError("Failed to load flow");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [flowId]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            label: params.sourceHandle || null,
            style: { stroke: "#94a3b8", strokeWidth: 1.5 },
            markerEnd: { type: "arrowclosed", color: "#94a3b8" },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Drop new node from palette onto canvas
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/chatbot-node-type");
      if (!nodeType || !rfInstance) return;

      const bounds = rfWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const newNode = {
        id: crypto.randomUUID(),
        type: nodeType,
        position,
        data: { ...(DEFAULT_CONFIG[nodeType] || {}) },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [rfInstance, setNodes],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Node click → show properties panel
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  // Pane click → deselect
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node config from properties panel
  const handleNodeConfigChange = useCallback(
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...newConfig } } : n,
        ),
      );
      setSelectedNode((prev) =>
        prev?.id === nodeId ? { ...prev, data: { ...newConfig } } : prev,
      );
    },
    [setNodes],
  );

  // Save canvas to backend
  const handleSave = async () => {
    if (!rfInstance) return;
    setSaving(true);
    try {
      const currentNodes = rfInstance.getNodes();
      const currentEdges = rfInstance.getEdges();

      const backendNodes = currentNodes.map((n) => ({
        node_id: n.id,
        node_type: n.type,
        config: n.data,
        position_x: Math.round(n.position.x),
        position_y: Math.round(n.position.y),
      }));

      const backendEdges = currentEdges.map((e) => ({
        source_node_id: e.source,
        target_node_id: e.target,
        condition_label: e.sourceHandle || e.label || null,
      }));

      await saveFlow(flowId, backendNodes, backendEdges);
      showSuccess("Flow saved!");
    } catch (err) {
      showError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async () => {
    if (!flow) return;
    setToggling(true);
    const newStatus = flow.status === "active" ? "inactive" : "active";
    try {
      const res = await updateFlow(flowId, { status: newStatus });
      setFlow(res.data.flow);
      showSuccess(
        newStatus === "active" ? "Flow is now active!" : "Flow deactivated.",
      );
    } catch (err) {
      showError("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Loader2
          size={28}
          style={{ animation: "spin 1s linear infinite" }}
          color="#0ea5e9"
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isActive = flow?.status === "active";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f8fafc",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/chatbot")}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            padding: "4px 8px",
            borderRadius: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            background: "#334155",
          }}
        />

        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            {flow?.name || "Chatbot Flow"}
          </p>
          {flow?.description && (
            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
              {flow.description}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: isActive ? "#dcfce7" : "#f1f5f9",
            color: isActive ? "#16a34a" : "#64748b",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isActive ? "#22c55e" : "#94a3b8",
              display: "inline-block",
            }}
          />
          {flow?.status
            ? flow.status.charAt(0).toUpperCase() + flow.status.slice(1)
            : "Draft"}
        </div>

        {/* Toggle active */}
        <button
          onClick={handleToggleStatus}
          disabled={toggling}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            background: isActive ? "#fee2e2" : "#dcfce7",
            color: isActive ? "#dc2626" : "#16a34a",
            border: "none",
            borderRadius: 7,
            cursor: toggling ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {toggling ? (
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : isActive ? (
            <Pause size={13} />
          ) : (
            <Play size={13} />
          )}
          {isActive ? "Deactivate" : "Activate"}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            background: "#0ea5e9",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {saving ? (
            <Loader2
              size={13}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Save size={13} />
          )}
          Save
        </button>
      </div>

      {/* Main area: palette | canvas | properties */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <NodePalette />

        {/* ReactFlow canvas */}
        <div
          ref={rfWrapper}
          style={{ flex: 1, height: "100%" }}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{
              style: { stroke: "#94a3b8", strokeWidth: 1.5 },
              markerEnd: { type: "arrowclosed", color: "#94a3b8" },
            }}
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls
              style={{ bottom: 16, left: 16 }}
              showInteractive={false}
            />
            <MiniMap
              style={{ bottom: 16, right: selectedNode ? 276 : 16 }}
              nodeColor={(n) => NODE_META[n.type]?.color || "#94a3b8"}
              maskColor="rgba(241,245,249,0.7)"
            />
          </ReactFlow>
        </div>

        {/* Node properties panel */}
        {selectedNode && (
          <NodeProperties
            node={selectedNode}
            onChange={handleNodeConfigChange}
            onClose={() => setSelectedNode(null)}
            templates={templates}
          />
        )}
      </div>

      {/* Empty state hint */}
      {nodes.length === 0 && !loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <Zap size={40} color="#e2e8f0" style={{ marginBottom: 12 }} />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            Drag nodes from the left panel
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cbd5e1" }}>
            Connect them to build your chatbot flow
          </p>
        </div>
      )}
    </div>
  );
}

export default function ChatbotBuilder() {
  const { flowId } = useParams();
  return (
    <ReactFlowProvider>
      <div style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
        <BuilderCanvas flowId={flowId} />
      </div>
    </ReactFlowProvider>
  );
}
