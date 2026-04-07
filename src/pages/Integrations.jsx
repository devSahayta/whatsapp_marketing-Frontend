import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Link2,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { connectGoogle } from "../api/googleSheets";
import { fetchIntegrationStatus } from "../api/integrations";
import { showError, showSuccess } from "../utils/toast";

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const IntegrationCard = ({
  title,
  subtitle,
  connected,
  details,
  action,
  accent = "emerald",
}) => {
  const accentStyles = {
    emerald: {
      ring: "border-emerald-200",
      badge: connected
        ? "bg-emerald-100 text-emerald-700"
        : "bg-red-100 text-red-700",
      iconWrap: connected ? "bg-emerald-100" : "bg-red-100",
      iconColor: connected ? "text-emerald-600" : "text-red-600",
    },
    amber: {
      ring: "border-amber-200",
      badge: connected
        ? "bg-amber-100 text-amber-700"
        : "bg-gray-100 text-gray-700",
      iconWrap: connected ? "bg-amber-100" : "bg-gray-100",
      iconColor: connected ? "text-amber-600" : "text-gray-500",
    },
  };

  const styles = accentStyles[accent] || accentStyles.emerald;

  return (
    <article
      className={`rounded-3xl border bg-white p-6 shadow-sm ${styles.ring}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.iconWrap}`}
          >
            {connected ? (
              <CheckCircle2 className={`h-6 w-6 ${styles.iconColor}`} />
            ) : (
              <ShieldAlert className={`h-6 w-6 ${styles.iconColor}`} />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3"
          >
            <span className="text-sm text-gray-500">{detail.label}</span>
            <span className="text-right text-sm font-medium text-gray-900">
              {detail.value}
            </span>
          </div>
        ))}
      </div>

      {action ? <div className="mt-5">{action}</div> : null}
    </article>
  );
};

const Integrations = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState({});
  const navigate = useNavigate();

  const loadIntegrationStatus = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetchIntegrationStatus();
      setIntegrationStatus(response?.data || {});
    } catch (error) {
      showError(
        error?.response?.data?.error || "Failed to load integration status",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleStatus = params.get("google");

    if (googleStatus === "connected") {
      showSuccess("Google account connected successfully.");
      loadIntegrationStatus({ silent: true });
    }

    if (googleStatus === "error") {
      showError("Google connection failed. Please try again.");
    }
  }, [location.search]);

  const handleConnectGoogle = async () => {
    try {
      setConnectingGoogle(true);
      const response = await connectGoogle();
      const url = response?.data?.url;

      if (!url) {
        throw new Error("Google connect URL not found");
      }

      window.location.href = url;
    } catch (error) {
      showError(
        error?.response?.data?.error || "Failed to start Google connection",
      );
      setConnectingGoogle(false);
    }
  };

  const googleDetails = useMemo(() => {
    const google = integrationStatus?.google || {};

    return [
      {
        label: "Connected account",
        value: google.connected
          ? google.email || "Email not available"
          : "No Google account linked",
      },
      {
        label: "Connected at",
        value: google.connected
          ? formatDateTime(google.connected_at)
          : "Not connected yet",
      },
      {
        label: "Last updated",
        value: google.connected
          ? formatDateTime(google.updated_at)
          : "Not connected yet",
      },
    ];
  }, [integrationStatus]);

  const wooDetails = useMemo(() => {
    const woo = integrationStatus?.woocommerce || {};

    return [
      {
        label: "Status",
        value: woo.connected ? "Connected" : "Not connected",
      },
      {
        label: "Connected at",
        value: woo.connected
          ? formatDateTime(woo.connected_at)
          : "Not connected yet",
      },
      {
        label: "Last updated",
        value: woo.connected
          ? formatDateTime(woo.updated_at)
          : "Not connected yet",
      },
    ];
  }, [integrationStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center rounded-3xl border border-gray-200 bg-white p-12 shadow-sm">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-3 text-sm font-medium text-gray-600">
            Loading integrations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
                Connections
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                Integrations
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                See which external tools are connected to your workspace and
                refresh their status anytime.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadIntegrationStatus({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh status"}
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <IntegrationCard
            title="Google Sheets"
            subtitle="Import contacts from spreadsheets and keep your workflow connected."
            connected={Boolean(integrationStatus?.google?.connected)}
            details={googleDetails}
            action={
              integrationStatus?.google?.connected ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready for sheet import and export.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Link2 className="h-4 w-4" />
                  {connectingGoogle ? "Connecting..." : "Connect Google"}
                </button>
              )
            }
          />

          <IntegrationCard
            title="WooCommerce"
            subtitle="View whether your commerce integration is active for this workspace."
            connected={Boolean(integrationStatus?.woocommerce?.connected)}
            details={wooDetails}
            accent="amber"
            action={
              integrationStatus?.woocommerce?.connected ? (
                <button
                  onClick={() => navigate("/integrations/woocommerce")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlugZap className="h-4 w-4" />
                  Manage WooCommerce
                </button>
              ) : (
                <button
                  onClick={() => navigate("/integrations/woocommerce")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Connect WooCommerce
                </button>
              )
            }
          />
        </section>
      </div>
    </div>
  );
};

export default Integrations;
