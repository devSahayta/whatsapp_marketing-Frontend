import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  PlugZap,
  Trash2,
  RefreshCw,
  Plus,
  X,
  Store,
  Zap,
  FileText,
  Clock,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  Send,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  connectWooStore,
  getWooConnections,
  disconnectWooStore,
  getWooAutomations,
  createWooAutomation,
  updateWooAutomation,
  deleteWooAutomation,
  getWooLogs,
  getCartRecoveryStats,
  getCartRecoveryLogs,
} from "../api/woocommerce";
import { fetchDbTemplates } from "../api/templates";
import useAuthUser from "../hooks/useAuthUser";
import { showSuccess, showError } from "../utils/toast";
import { useNavigate } from "react-router-dom";

const EVENT_CONFIG = {
  "order.created": { label: "Order placed", emoji: "🛍️", color: "blue" },
  "order.shipped": { label: "Order shipped", emoji: "🚚", color: "teal" },
  "order.completed": { label: "Order delivered", emoji: "✅", color: "amber" },
  "order.cancelled": { label: "Order cancelled", emoji: "❌", color: "red" },
  "order.refunded": { label: "Order refunded", emoji: "💰", color: "gray" },
};

const TAG_STYLES = {
  blue: "bg-blue-50 text-blue-700",
  teal: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
};

const isImageTemplate = (t) => {
  try {
    const comps =
      typeof t.components === "string"
        ? JSON.parse(t.components)
        : t.components || [];
    return comps.some((c) => c.type === "HEADER" && c.format === "IMAGE");
  } catch {
    return false;
  }
};

const DELAY_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
];

export default function WooCommercePage() {
  const { userId } = useAuthUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [includeImage, setIncludeImage] = useState(true);
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  // Cart Recovery
  const [cartStats, setCartStats] = useState(null);
  const [cartLogs, setCartLogs] = useState([]);
  const [cartAutomation, setCartAutomation] = useState(null);
  const [showCartSetup, setShowCartSetup] = useState(false);
  const [savingCart, setSavingCart] = useState(false);
  const [cartForm, setCartForm] = useState({
    wt_id: "",
    delay_minutes: 60,
    include_product_image: true,
  });

  const [connectForm, setConnectForm] = useState({
    store_url: "",
    consumer_key: "",
    consumer_secret: "",
  });
  const [autoForm, setAutoForm] = useState({
    trigger_event: "order.created",
    wt_id: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [connRes, autoRes, logsRes, tplRes, cartStatsRes, cartLogsRes] =
        await Promise.allSettled([
          getWooConnections(),
          getWooAutomations(activeConnection?.id),
          getWooLogs(activeConnection?.id),
          fetchDbTemplates(userId),
          getCartRecoveryStats(),
          getCartRecoveryLogs(),
        ]);

      if (connRes.status === "fulfilled") {
        const conns = connRes.value.data?.connections || [];
        setConnections(conns);
        setActiveConnection((prev) =>
          prev
            ? conns.find((c) => c.id === prev.id) || conns[0] || null
            : conns[0] || null,
        );
      }
      if (autoRes.status === "fulfilled") {
        const autos = autoRes.value.data?.automations || [];
        setAutomations(autos);
        setCartAutomation(
          autos.find((a) => a.trigger_event === "cart.abandoned") || null,
        );
      }
      if (logsRes.status === "fulfilled")
        setLogs(logsRes.value.data?.logs || []);
      if (tplRes.status === "fulfilled") setTemplates(tplRes.value.data || []);
      if (cartStatsRes.status === "fulfilled")
        setCartStats(cartStatsRes.value.data?.stats || null);
      if (cartLogsRes.status === "fulfilled")
        setCartLogs(cartLogsRes.value.data?.logs || []);
    } catch {
      showError("Failed to load WooCommerce data");
    } finally {
      setLoading(false);
    }
  }, [userId, activeConnection?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSwitchStore = (conn) => {
    setActiveConnection(conn);
    setAutomations([]);
    setLogs([]);
    setCartAutomation(null);
    setShowStoreDetails(false);
  };

  const handleConnect = async () => {
    if (
      !connectForm.store_url ||
      !connectForm.consumer_key ||
      !connectForm.consumer_secret
    ) {
      showError("Please fill in all fields");
      return;
    }
    try {
      setConnecting(true);
      await connectWooStore(connectForm);
      showSuccess("Store connected successfully!");
      setShowConnectModal(false);
      setConnectForm({ store_url: "", consumer_key: "", consumer_secret: "" });
      load();
    } catch (e) {
      showError(
        e?.response?.data?.message ||
          "Connection failed. Check your URL and API keys.",
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Disconnect this store? All automations will stop firing.",
      )
    )
      return;
    try {
      await disconnectWooStore(activeConnection.id);
      showSuccess("Store disconnected");
      setConnections((prev) =>
        prev.filter((c) => c.id !== activeConnection.id),
      );
      setActiveConnection(null);
      setAutomations([]);
      load();
    } catch {
      showError("Failed to disconnect");
    }
  };

  const handleAddAutomation = async () => {
    if (!autoForm.wt_id) {
      showError("Please select a template");
      return;
    }
    const exists = automations.find(
      (a) => a.trigger_event === autoForm.trigger_event,
    );
    if (exists) {
      showError("An automation for this event already exists");
      return;
    }

    const selectedTemplate = templates.find((t) => t.wt_id === autoForm.wt_id);
    const VARIABLE_FIELDS = [
      "billing_full_name",
      "order_number",
      "total",
      "item_names",
      "payment_method",
      "order_date",
      "shipping_address",
    ];
    let variableCount = 4;
    if (selectedTemplate?.components) {
      const comps =
        typeof selectedTemplate.components === "string"
          ? JSON.parse(selectedTemplate.components)
          : selectedTemplate.components;
      const bodyComp = comps.find((c) => c.type === "BODY");
      if (bodyComp?.text) {
        const matches = bodyComp.text.match(/\{\{\d+\}\}/g) || [];
        const positions = matches.map((m) => parseInt(m.replace(/[{}]/g, "")));
        variableCount = positions.length > 0 ? Math.max(...positions) : 4;
      }
    }
    const template_variable_map = {};
    for (let i = 1; i <= variableCount; i++)
      template_variable_map[String(i)] = VARIABLE_FIELDS[i - 1] || `field_${i}`;

    try {
      await createWooAutomation({
        connection_id: activeConnection.id,
        wt_id: autoForm.wt_id,
        trigger_event: autoForm.trigger_event,
        delay_minutes: 0,
        template_variable_map,
        include_product_image: includeImage,
      });
      showSuccess("Automation rule added!");
      setShowAutoModal(false);
      setIncludeImage(true);
      load();
    } catch {
      showError("Failed to create automation");
    }
  };

  const handleToggle = async (automation) => {
    try {
      await updateWooAutomation(automation.id, {
        is_active: !automation.is_active,
      });
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automation.id ? { ...a, is_active: !a.is_active } : a,
        ),
      );
    } catch {
      showError("Failed to update automation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this automation rule?")) return;
    try {
      await deleteWooAutomation(id);
      showSuccess("Automation deleted");
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      if (cartAutomation?.id === id) setCartAutomation(null);
    } catch {
      showError("Failed to delete automation");
    }
  };

  const handleEnableCartRecovery = async () => {
    if (!cartForm.wt_id) {
      showError("Please select a recovery template");
      return;
    }
    try {
      setSavingCart(true);
      await createWooAutomation({
        connection_id: activeConnection.id,
        wt_id: cartForm.wt_id,
        trigger_event: "cart.abandoned",
        delay_minutes: cartForm.delay_minutes,
        include_product_image: cartForm.include_product_image,
        template_variable_map: {
          1: "billing_full_name",
          2: "item_names",
          3: "cart_total",
        },
      });
      showSuccess("Cart recovery enabled!");
      setShowCartSetup(false);
      load();
    } catch {
      showError("Failed to enable cart recovery");
    } finally {
      setSavingCart(false);
    }
  };

  const handleToggleCartRecovery = async () => {
    if (!cartAutomation) return;
    try {
      await updateWooAutomation(cartAutomation.id, {
        is_active: !cartAutomation.is_active,
      });
      setCartAutomation((p) => ({ ...p, is_active: !p.is_active }));
      showSuccess(
        cartAutomation.is_active
          ? "Cart recovery paused"
          : "Cart recovery resumed",
      );
    } catch {
      showError("Failed to update cart recovery");
    }
  };

  const approvedTemplates = templates.filter(
    (t) => t.status === "APPROVED" || t.status === "approved",
  );
  const filteredTemplates = approvedTemplates.filter((t) =>
    includeImage ? isImageTemplate(t) : !isImageTemplate(t),
  );
  const cartTemplates = approvedTemplates.filter((t) => isImageTemplate(t));
  const activeAutomations = automations.filter(
    (a) => a.is_active && a.trigger_event !== "cart.abandoned",
  );
  const sentLogs = logs.filter((l) => l.status === "sent").length;
  const connection = activeConnection; // alias

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-amber-600" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ── Header ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 sm:mb-2">
                Integrations / WooCommerce
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">
                WooCommerce
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed hidden sm:block">
                Automatically send WhatsApp messages when orders are placed,
                shipped, delivered, cancelled, or refunded.
              </p>
            </div>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 flex-shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {[
            {
              label: "Stores",
              value:
                connections.length > 0
                  ? `${connections.length} connected`
                  : "Not connected",
              sub: activeConnection?.store_name || "No store linked",
              icon: Store,
            },
            {
              label: "Active automations",
              value: activeAutomations.length,
              sub: "Order event triggers",
              icon: Zap,
            },
            {
              label: "Messages sent",
              value: sentLogs,
              sub: "Via WooCommerce",
              icon: FileText,
            },
            {
              label: "Last activity",
              value: logs[0]
                ? logs[0].trigger_event?.replace("order.", "")
                : "—",
              sub: logs[0]
                ? new Date(logs[0].triggered_at).toLocaleString("en-IN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "No activity yet",
              icon: Clock,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl sm:rounded-3xl border bg-white p-3 sm:p-4 lg:p-5 shadow-sm ${connections.length > 0 && s.label === "Stores" ? "border-amber-300" : "border-slate-200"}`}
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 sm:mb-2 truncate">
                {s.label}
              </p>
              <p className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate">
                {s.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Store Connection Card ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-50 flex items-center justify-center text-base sm:text-lg">
                🛒
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Your Stores
                </p>
                <p className="text-xs text-slate-400 hidden sm:block">
                  WooCommerce connections
                </p>
              </div>
            </div>
            {connections.length > 0 && (
              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add store</span>
                <span className="inline sm:hidden">Add</span>
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {connections.length === 0 ? (
              /* No stores */
              <div>
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {[
                    {
                      n: 1,
                      title: "Go to your WooCommerce admin",
                      desc: "Navigate to WooCommerce → Settings → Advanced → REST API",
                    },
                    {
                      n: 2,
                      title: "Generate API keys",
                      desc: 'Click "Add Key", set permissions to Read/Write, and generate.',
                    },
                    {
                      n: 3,
                      title: "Paste your credentials below",
                      desc: "We'll verify and register webhooks automatically.",
                    },
                  ].map((s) => (
                    <div key={s.n} className="flex gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 text-amber-700 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                        {s.n}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {s.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl hover:bg-slate-800 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <PlugZap className="h-4 w-4" /> Connect WooCommerce store
                </button>
              </div>
            ) : (
              /* Has stores */
              <div className="space-y-2 sm:space-y-3">
                {connections.map((conn) => {
                  const isActive = activeConnection?.id === conn.id;
                  return (
                    <div
                      key={conn.id}
                      onClick={() => !isActive && handleSwitchStore(conn)}
                      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                        isActive
                          ? "border-amber-300 bg-amber-50 cursor-default"
                          : "border-slate-200 bg-slate-50 cursor-pointer hover:border-amber-200 hover:bg-amber-50/50"
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">
                        🛒
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {conn.store_name || conn.store_url}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="hidden sm:inline">Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {conn.store_url}
                        </p>
                      </div>
                      {isActive ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
                          Switch
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Active store details — collapsible on mobile */}
                {activeConnection && (
                  <div className="mt-2 pt-3 sm:pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowStoreDetails((p) => !p)}
                      className="flex items-center justify-between w-full text-xs font-medium text-slate-500 sm:hidden mb-2"
                    >
                      Store details
                      {showStoreDetails ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <div
                      className={`space-y-2 ${showStoreDetails ? "block" : "hidden sm:block"}`}
                    >
                      {[
                        {
                          label: "Currency",
                          value: activeConnection.store_currency || "INR",
                        },
                        {
                          label: "Connected",
                          value: new Date(
                            activeConnection.connected_at,
                          ).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        },
                        { label: "Webhooks", value: "3 registered" },
                      ].map((r) => (
                        <div
                          key={r.label}
                          className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-50"
                        >
                          <span className="text-xs text-slate-500">
                            {r.label}
                          </span>
                          <span className="text-xs font-medium text-slate-900 text-right truncate ml-4 max-w-[180px] sm:max-w-xs">
                            {r.value}
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={handleDisconnect}
                        className="mt-1 sm:mt-2 inline-flex items-center gap-1.5 text-red-600 text-xs font-medium border border-red-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Disconnect{" "}
                        {activeConnection.store_name || "store"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Automations Card ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  Automations
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate hidden sm:block">
                  {activeConnection
                    ? `${activeConnection.store_name || activeConnection.store_url} — WhatsApp messages on order events`
                    : "Send WhatsApp messages when orders change status"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() =>
                    navigate("/integrations/woocommerce/templates")
                  }
                  className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:from-violet-600 hover:to-indigo-600"
                >
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Template guide</span>
                  <span className="inline sm:hidden">Guide</span>
                </button>
                <button
                  onClick={() => setShowAutoModal(true)}
                  disabled={!activeConnection}
                  className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Add rule</span>
                  <span className="inline sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {[
              { key: "all", label: "All rules", short: "All" },
              {
                key: "active",
                label: `Active (${activeAutomations.length})`,
                short: `Active`,
              },
              { key: "logs", label: "Send logs", short: "Logs" },
              {
                key: "cart-recovery",
                label: "🛒 Cart recovery",
                short: "🛒 Cart",
              },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-medium border-b-2 -mb-px flex-shrink-0 transition-colors ${
                  activeTab === t.key
                    ? "border-amber-500 text-amber-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <span className="hidden sm:inline">{t.label}</span>
                <span className="inline sm:hidden">{t.short}</span>
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6">
            {/* All rules */}
            {activeTab === "all" &&
              (automations.filter((a) => a.trigger_event !== "cart.abandoned")
                .length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                  <div className="text-3xl mb-3">⚡</div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    No automations yet
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    {activeConnection
                      ? "Add your first rule to automatically message customers when orders change status."
                      : "Connect your store first, then add automation rules."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {automations
                    .filter((a) => a.trigger_event !== "cart.abandoned")
                    .map((a) => {
                      const cfg = EVENT_CONFIG[a.trigger_event] || {
                        label: a.trigger_event,
                        emoji: "📦",
                        color: "gray",
                      };
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-slate-100 rounded-xl sm:rounded-2xl bg-slate-50"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm sm:text-base flex-shrink-0">
                            {cfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {cfg.label}
                            </p>
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap mt-0.5">
                              <span className="text-xs text-slate-400 truncate max-w-[80px] sm:max-w-[120px]">
                                {a.whatsapp_templates?.name || "Template"}
                              </span>
                              <span
                                className={`inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${TAG_STYLES[cfg.color]} hidden sm:inline-flex`}
                              >
                                {a.trigger_event}
                              </span>
                              {a.include_product_image && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                  🖼️{" "}
                                  <span className="hidden sm:inline">
                                    With image
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggle(a)}
                            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${a.is_active ? "bg-amber-500" : "bg-slate-200"}`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${a.is_active ? "left-4" : "left-0.5"}`}
                            ></span>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                </div>
              ))}

            {/* Active */}
            {activeTab === "active" &&
              (activeAutomations.length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                  <p className="text-sm text-slate-500">
                    No active automations
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {activeAutomations.map((a) => {
                    const cfg = EVENT_CONFIG[a.trigger_event] || {
                      label: a.trigger_event,
                      emoji: "📦",
                      color: "gray",
                    };
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-emerald-100 rounded-xl sm:rounded-2xl bg-emerald-50"
                      >
                        <div className="text-base">{cfg.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {cfg.label}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <p className="text-xs text-slate-400 truncate">
                              {a.whatsapp_templates?.name}
                            </p>
                            {a.include_product_image && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                🖼️
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 sm:px-2.5 py-1 rounded-full flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="hidden sm:inline">Active</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* Logs */}
            {activeTab === "logs" &&
              (logs.length === 0 ? (
                <div className="text-center py-8 sm:py-10">
                  <div className="text-3xl mb-3">📋</div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    No logs yet
                  </p>
                  <p className="text-xs text-slate-400">
                    Send logs appear here once automations start firing.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {logs.map((l) => {
                    const cfg = EVENT_CONFIG[l.trigger_event] || {
                      label: l.trigger_event,
                      emoji: "📦",
                      color: "gray",
                    };
                    return (
                      <div
                        key={l.id}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border border-slate-100 rounded-xl sm:rounded-2xl bg-slate-50"
                      >
                        <div className="text-base flex-shrink-0">
                          {cfg.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {cfg.label} · #{l.wc_order_id}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {l.phone_number} ·{" "}
                            {new Date(l.triggered_at).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full flex-shrink-0 ${l.status === "sent" ? "bg-emerald-50 text-emerald-700" : l.status === "failed" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {l.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* Cart Recovery */}
            {activeTab === "cart-recovery" && (
              <div className="space-y-4 sm:space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    {
                      label: "Detected",
                      value: cartStats?.total ?? 0,
                      icon: ShoppingCart,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                    },
                    {
                      label: "Sent",
                      value: cartStats?.sent ?? 0,
                      icon: Send,
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                    },
                    {
                      label: "Recovered",
                      value: cartStats?.recovered ?? 0,
                      icon: RotateCcw,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Recovery rate",
                      value: `${cartStats?.recovery_rate ?? 0}%`,
                      icon: TrendingUp,
                      color: "text-violet-600",
                      bg: "bg-violet-50",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4"
                    >
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl ${s.bg} flex items-center justify-center mb-1.5 sm:mb-2`}
                      >
                        <s.icon
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${s.color}`}
                        />
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        {s.value}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Setup / active card */}
                {!cartAutomation ? (
                  <div className="rounded-xl sm:rounded-2xl border border-dashed border-slate-300 p-4 sm:p-6 text-center">
                    <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🛒</div>
                    <p className="text-sm font-semibold text-slate-800 mb-1">
                      Set up abandoned cart recovery
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-3 sm:mb-4">
                      Automatically message customers who add items to cart but
                      don't complete checkout.
                    </p>
                    <button
                      onClick={() => setShowCartSetup(true)}
                      disabled={!activeConnection}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3.5 w-3.5" /> Enable cart recovery
                    </button>
                    {!activeConnection && (
                      <p className="text-xs text-slate-400 mt-2">
                        Connect your store first
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-base flex-shrink-0">
                          🛒
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            Cart recovery{" "}
                            {cartAutomation.is_active ? "active" : "paused"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <p className="text-xs text-slate-500 truncate max-w-[100px] sm:max-w-none">
                              {cartAutomation.whatsapp_templates?.name ||
                                "Template"}
                            </p>
                            <span className="text-xs text-slate-400 hidden sm:inline">
                              ·
                            </span>
                            <p className="text-xs text-slate-500 hidden sm:block">
                              {DELAY_OPTIONS.find(
                                (d) => d.value === cartAutomation.delay_minutes,
                              )?.label ||
                                `${cartAutomation.delay_minutes} min`}{" "}
                              delay
                            </p>
                            {cartAutomation.include_product_image && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                🖼️
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={handleToggleCartRecovery}
                          className={`relative w-9 h-5 rounded-full transition-colors ${cartAutomation.is_active ? "bg-emerald-500" : "bg-slate-200"}`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cartAutomation.is_active ? "left-4" : "left-0.5"}`}
                          ></span>
                        </button>
                        <button
                          onClick={() => handleDelete(cartAutomation.id)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery logs */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2 sm:mb-3">
                    Recovery log
                  </p>
                  {cartLogs.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50">
                      <div className="text-2xl mb-2">📋</div>
                      <p className="text-xs text-slate-400">
                        No recovery attempts yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartLogs.map((l) => {
                        const statusStyle =
                          l.status === "recovered"
                            ? "bg-emerald-50 text-emerald-700"
                            : l.status === "sent"
                              ? "bg-blue-50 text-blue-700"
                              : l.status === "failed"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-600";
                        const statusLabel =
                          l.status === "recovered"
                            ? "🎉 Recovered"
                            : l.status === "sent"
                              ? "📤 Sent"
                              : l.status === "failed"
                                ? "❌ Failed"
                                : l.status;
                        const cartItems = Array.isArray(l.cart_items)
                          ? l.cart_items
                          : [];
                        const firstItem = cartItems[0];
                        return (
                          <div
                            key={l.id}
                            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 border border-slate-100 rounded-xl sm:rounded-2xl bg-slate-50"
                          >
                            {firstItem?.image ? (
                              <img
                                src={firstItem.image}
                                alt={firstItem.name}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl object-cover flex-shrink-0 border border-slate-200"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-200 flex items-center justify-center text-sm flex-shrink-0">
                                🛒
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {l.customer_name || "Customer"}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5 truncate">
                                {firstItem?.name || "Item"} · ₹{l.cart_total}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full ${statusStyle}`}
                              >
                                {statusLabel}
                              </span>
                              <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                                {new Date(l.created_at).toLocaleString(
                                  "en-IN",
                                  { dateStyle: "short", timeStyle: "short" },
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Connect Modal ── */}
      {showConnectModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <p className="text-base font-semibold">
                Connect WooCommerce store
              </p>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 leading-relaxed">
                We'll verify your credentials and automatically register
                webhooks on your store.
              </div>
              {[
                {
                  label: "Store URL",
                  key: "store_url",
                  placeholder: "https://your-store.com",
                  type: "url",
                  hint: "Your WooCommerce store root URL — no trailing slash",
                },
                {
                  label: "Consumer Key",
                  key: "consumer_key",
                  placeholder: "ck_xxxxxxxxxxxxxxxxxxxx",
                  type: "text",
                  hint: "WooCommerce → Settings → Advanced → REST API → Add Key",
                },
                {
                  label: "Consumer Secret",
                  key: "consumer_secret",
                  placeholder: "cs_xxxxxxxxxxxxxxxxxxxx",
                  type: "password",
                  hint: "Shown only once — save it before pasting here",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={connectForm[f.key]}
                    onChange={(e) =>
                      setConnectForm((p) => ({ ...p, [f.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">{f.hint}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowConnectModal(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-2xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex-1 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {connecting && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                )}
                {connecting ? "Connecting..." : "Connect store"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Automation Modal ── */}
      {showAutoModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => {
            setShowAutoModal(false);
            setIncludeImage(true);
          }}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <p className="text-base font-semibold">Add automation rule</p>
              <button
                onClick={() => {
                  setShowAutoModal(false);
                  setIncludeImage(true);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 leading-relaxed">
                Choose which order event triggers a WhatsApp message and which
                approved template to send.
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Trigger event
                </label>
                <select
                  value={autoForm.trigger_event}
                  onChange={(e) =>
                    setAutoForm((p) => ({
                      ...p,
                      trigger_event: e.target.value,
                      wt_id: "",
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                >
                  {Object.entries(EVENT_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>
                      {cfg.emoji} {cfg.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Fires when an order reaches this status
                </p>
              </div>
              <div
                className={`rounded-xl p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer transition-all ${includeImage ? "bg-blue-50 border border-blue-200" : "bg-slate-50 border border-slate-200"}`}
                onClick={() => {
                  setIncludeImage((p) => !p);
                  setAutoForm((p) => ({ ...p, wt_id: "" }));
                }}
              >
                <div className="text-xl flex-shrink-0">🖼️</div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-medium ${includeImage ? "text-blue-800" : "text-slate-700"}`}
                  >
                    Include product image
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-relaxed ${includeImage ? "text-blue-600" : "text-slate-400"}`}
                  >
                    {includeImage
                      ? "Product photo attached automatically. Requires IMAGE header template."
                      : "Text-only message. Works with any TEXT header template."}
                  </p>
                </div>
                <button
                  className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors"
                  style={{ background: includeImage ? "#185FA5" : "#CBD5E1" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIncludeImage((p) => !p);
                    setAutoForm((p) => ({ ...p, wt_id: "" }));
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{ left: includeImage ? "17px" : "2px" }}
                  />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  WhatsApp template
                </label>
                <select
                  value={autoForm.wt_id}
                  onChange={(e) =>
                    setAutoForm((p) => ({ ...p, wt_id: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Select a template...</option>
                  {filteredTemplates.map((t) => (
                    <option key={t.wt_id} value={t.wt_id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {approvedTemplates.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    No approved templates yet.{" "}
                    <button
                      onClick={() =>
                        navigate("/integrations/woocommerce/templates")
                      }
                      className="underline font-medium"
                    >
                      Use template guide
                    </button>
                    .
                  </p>
                )}
                {approvedTemplates.length > 0 &&
                  filteredTemplates.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      No {includeImage ? "IMAGE" : "TEXT"} templates found.{" "}
                      <button
                        onClick={() =>
                          navigate("/integrations/woocommerce/templates")
                        }
                        className="underline font-medium"
                      >
                        Create one
                      </button>{" "}
                      or toggle image {includeImage ? "off" : "on"}.
                    </p>
                  )}
                {filteredTemplates.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    {filteredTemplates.length} template(s) available
                  </p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl sm:rounded-2xl text-xs text-slate-500 leading-relaxed space-y-1">
                <p className="font-medium text-slate-700 mb-1">
                  Variables auto-filled from order:
                </p>
                <p>
                  <code className="bg-white px-1 rounded">{"{{1}}"}</code> Name
                  &nbsp;<code className="bg-white px-1 rounded">{"{{2}}"}</code>{" "}
                  Order# &nbsp;
                  <code className="bg-white px-1 rounded">{"{{3}}"}</code> Total
                  &nbsp;<code className="bg-white px-1 rounded">{"{{4}}"}</code>{" "}
                  Items
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowAutoModal(false);
                  setIncludeImage(true);
                }}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-2xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAutomation}
                className="flex-1 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-2xl hover:bg-slate-800"
              >
                Save rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Recovery Setup Modal ── */}
      {showCartSetup && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={() => setShowCartSetup(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-base font-semibold">Enable cart recovery</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Message customers who abandon their cart
                </p>
              </div>
              <button
                onClick={() => setShowCartSetup(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 leading-relaxed">
                Our system checks for abandoned checkouts every 30 minutes and
                sends a recovery WhatsApp message automatically.
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Send recovery message after
                </label>
                <select
                  value={cartForm.delay_minutes}
                  onChange={(e) =>
                    setCartForm((p) => ({
                      ...p,
                      delay_minutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                >
                  {DELAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Time after cart abandonment before sending the message
                </p>
              </div>
              <div
                className={`rounded-xl p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer transition-all ${cartForm.include_product_image ? "bg-blue-50 border border-blue-200" : "bg-slate-50 border border-slate-200"}`}
                onClick={() =>
                  setCartForm((p) => ({
                    ...p,
                    include_product_image: !p.include_product_image,
                    wt_id: "",
                  }))
                }
              >
                <div className="text-xl flex-shrink-0">🖼️</div>
                <div className="flex-1">
                  <p
                    className={`text-xs font-medium ${cartForm.include_product_image ? "text-blue-800" : "text-slate-700"}`}
                  >
                    Include product image
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${cartForm.include_product_image ? "text-blue-600" : "text-slate-400"}`}
                  >
                    {cartForm.include_product_image
                      ? "Show the abandoned product photo in the recovery message."
                      : "Send a text-only recovery message."}
                  </p>
                </div>
                <button
                  className="relative flex-shrink-0 w-9 h-5 rounded-full transition-colors"
                  style={{
                    background: cartForm.include_product_image
                      ? "#185FA5"
                      : "#CBD5E1",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCartForm((p) => ({
                      ...p,
                      include_product_image: !p.include_product_image,
                      wt_id: "",
                    }));
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                    style={{
                      left: cartForm.include_product_image ? "17px" : "2px",
                    }}
                  />
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Recovery template
                </label>
                <select
                  value={cartForm.wt_id}
                  onChange={(e) =>
                    setCartForm((p) => ({ ...p, wt_id: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400 bg-white"
                >
                  <option value="">Select a template...</option>
                  {(cartForm.include_product_image
                    ? cartTemplates
                    : approvedTemplates.filter((t) => !isImageTemplate(t))
                  ).map((t) => (
                    <option key={t.wt_id} value={t.wt_id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Variables:{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{1}}"}</code>{" "}
                  name,{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{2}}"}</code>{" "}
                  items,{" "}
                  <code className="bg-slate-100 px-1 rounded">{"{{3}}"}</code>{" "}
                  total
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-5 sm:px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowCartSetup(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 rounded-2xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEnableCartRecovery}
                disabled={savingCart || !cartForm.wt_id}
                className="flex-1 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingCart && (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                )}
                {savingCart ? "Enabling..." : "Enable cart recovery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
