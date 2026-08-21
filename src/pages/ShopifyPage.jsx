import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  PlugZap,
  Trash2,
  RefreshCw,
  Plus,
  X,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  connectShopifyStore,
  getShopifyConnections,
  disconnectShopifyStore,
} from "../api/shopify";
import { showSuccess, showError } from "../utils/toast";

export default function ShopifyPage() {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [showStoreDetails, setShowStoreDetails] = useState(false);
  const [connectForm, setConnectForm] = useState({
    shop_domain: "",
    client_id: "",
    client_secret: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getShopifyConnections();
      const conns = res?.data?.connections || [];
      setConnections(conns);
      setActiveConnection((prev) =>
        conns.find((c) => c.id === prev?.id) || conns[0] || null,
      );
    } catch (e) {
      showError(
        e?.response?.data?.message || "Failed to load Shopify connections",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSwitchStore = (conn) => {
    setActiveConnection(conn);
    setShowStoreDetails(false);
  };

  const handleConnect = async () => {
    if (
      !connectForm.shop_domain ||
      !connectForm.client_id ||
      !connectForm.client_secret
    ) {
      showError("Please fill in all fields");
      return;
    }
    try {
      setConnecting(true);
      await connectShopifyStore(connectForm);
      showSuccess("Store connected successfully!");
      setShowConnectModal(false);
      setConnectForm({ shop_domain: "", client_id: "", client_secret: "" });
      load();
    } catch (e) {
      showError(
        e?.response?.data?.message ||
          "Connection failed. Check your shop domain, Client ID, and Client Secret.",
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        "Disconnect this store? You can reconnect it any time.",
      )
    )
      return;
    try {
      await disconnectShopifyStore(activeConnection.id);
      showSuccess("Store disconnected");
      setConnections((prev) =>
        prev.filter((c) => c.id !== activeConnection.id),
      );
      setActiveConnection(null);
    } catch {
      showError("Failed to disconnect");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <RefreshCw className="h-5 w-5 animate-spin text-green-600" />
        <span className="ml-2 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5 lg:space-y-6">
        {/* ── Header ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-1 sm:mb-2">
                Integrations / Shopify
              </p>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">
                Shopify
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed hidden sm:block">
                Connect your Shopify store to Samvaadik. Order automations,
                cart recovery, and message triggers are coming soon.
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

        {/* ── Store Connection Card ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-green-50 flex items-center justify-center text-base sm:text-lg">
                🛍️
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Your Stores
                </p>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Shopify connections
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
                      title: "Open the Dev Dashboard",
                      desc: "In your Shopify admin, go to Settings → Apps and sales channels → Develop apps → Build apps in Dev Dashboard.",
                    },
                    {
                      n: 2,
                      title: "Create a custom-distribution app",
                      desc: "Create the app, set Distribution to \"Custom distribution (this store only)\", add the Admin API scopes you need, then install it.",
                    },
                    {
                      n: 3,
                      title: "Copy the Client ID and Secret",
                      desc: "In the app's Settings tab, copy the Client ID and Client Secret and paste them below along with your store domain.",
                    },
                  ].map((s) => (
                    <div key={s.n} className="flex gap-2 sm:gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-50 text-green-700 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
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
                  <PlugZap className="h-4 w-4" /> Connect Shopify store
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
                          ? "border-green-300 bg-green-50 cursor-default"
                          : "border-slate-200 bg-slate-50 cursor-pointer hover:border-green-200 hover:bg-green-50/50"
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">
                        🛍️
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {conn.store_name || conn.shop_domain}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <span className="hidden sm:inline">Active</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {conn.shop_domain}
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
                          value: activeConnection.store_currency || "USD",
                        },
                        {
                          label: "Connected",
                          value: activeConnection.connected_at
                            ? new Date(
                                activeConnection.connected_at,
                              ).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—",
                        },
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

        {/* ── What's next ── */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Store className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">
              Coming soon
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Order-triggered WhatsApp automations, delivery logs, and cart
            recovery for Shopify are on the roadmap — the same way they work
            for WooCommerce today. Your store connection will carry over once
            they ship.
          </p>
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
              <p className="text-base font-semibold">Connect Shopify store</p>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-700 leading-relaxed">
                We'll exchange these for an access token and verify your
                store before saving the connection. Shopify tokens for
                Dev Dashboard apps expire periodically — we refresh yours
                automatically behind the scenes.
              </div>
              {[
                {
                  label: "Shop domain",
                  key: "shop_domain",
                  placeholder: "your-store.myshopify.com",
                  type: "text",
                  hint: "Your Shopify store's .myshopify.com domain",
                },
                {
                  label: "Client ID",
                  key: "client_id",
                  placeholder: "c10a477d94a2b0c92256d87a5fe8eebb",
                  type: "text",
                  hint: "Dev Dashboard → your app → Settings → Client ID",
                },
                {
                  label: "Client secret",
                  key: "client_secret",
                  placeholder: "shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  type: "password",
                  hint: "Dev Dashboard → your app → Settings → Client secret",
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
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-green-400 bg-white"
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
    </div>
  );
}
