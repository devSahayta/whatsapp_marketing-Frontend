// Pages/Campaigns.jsx — campaign list (premium redesign)

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  Plus,
  Search,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Ban,
  Eye,
  RefreshCw,
  Send,
  Megaphone,
  LayoutGrid,
  List,
  Copy,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getCampaigns, deleteCampaign, cancelCampaign } from "../api/campaigns";
import CampaignCancelModal from "../components/CampaignCancelModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import "../styles/campaigns.css";

const STATUS = {
  scheduled: { label: "Scheduled", icon: Clock },
  processing: { label: "Sending", icon: Loader2 },
  completed: { label: "Completed", icon: CheckCircle2 },
  failed: { label: "Failed", icon: XCircle },
  cancelled: { label: "Cancelled", icon: Ban },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "processing", label: "Sending" },
  { key: "completed", label: "Completed" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];

const SORTS = [
  { key: "created", label: "Recently created" },
  { key: "soonest", label: "Scheduled: soonest first" },
  { key: "latest", label: "Scheduled: latest first" },
  { key: "name", label: "Name A to Z" },
];

const PER_PAGE_OPTIONS = { grid: [12, 24, 48], table: [10, 25, 50] };

const num = (v) => Number(v) || 0;

// "in 3 days" / "2 hours ago"
const relativeTime = (date) => {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const min = 60 * 1000;
  if (abs < 60 * min) return rtf.format(Math.round(diffMs / min), "minute");
  if (abs < 24 * 60 * min)
    return rtf.format(Math.round(diffMs / (60 * min)), "hour");
  if (abs < 60 * 24 * 60 * min)
    return rtf.format(Math.round(diffMs / (24 * 60 * min)), "day");
  return rtf.format(Math.round(diffMs / (30 * 24 * 60 * min)), "month");
};

const formatWhen = (date) =>
  `${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} · ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

// 1 … 4 5 [6] 7 8 … 20
const pageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("gap-l");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("gap-r");
  out.push(total);
  return out;
};

const Pagination = ({
  page,
  totalPages,
  total,
  perPage,
  perPageOptions,
  onPage,
  onPerPage,
}) => {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  return (
    <nav className="cp-pager" aria-label="Pagination">
      <div className="cp-pager-info">
        Showing{" "}
        <strong>
          {from}-{to}
        </strong>{" "}
        of <strong>{total}</strong>
      </div>

      <div className="cp-pager-pages">
        <button
          className="cp-page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pageList(page, totalPages).map((p) =>
          typeof p === "number" ? (
            <button
              key={p}
              className={`cp-page-btn${p === page ? " is-active" : ""}`}
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </button>
          ) : (
            <span key={p} className="cp-page-gap" aria-hidden="true">
              …
            </span>
          ),
        )}
        <button
          className="cp-page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <label className="cp-pager-size">
        <span>Per page</span>
        <select
          className="cp-select"
          value={perPage}
          onChange={(e) => onPerPage(Number(e.target.value))}
        >
          {perPageOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </nav>
  );
};

const StatusPill = ({ status }) => {
  const cfg = STATUS[status] || STATUS.scheduled;
  return (
    <span
      className={`cp-pill cp-s-${STATUS[status] ? status : "scheduled"}${
        status === "processing" ? " is-processing" : ""
      }`}
    >
      <span className="cp-pill-dot" />
      {cfg.label}
    </span>
  );
};

// Sent / failed progress for a campaign
const DeliveryBar = ({ campaign, thin = false }) => {
  const sent = num(campaign.messages_sent);
  const failed = num(campaign.messages_failed);
  const total = num(campaign.total_recipients) || sent + failed;
  const sentPct = total ? Math.min(100, (sent / total) * 100) : 0;
  const failedPct = total ? Math.min(100 - sentPct, (failed / total) * 100) : 0;
  return (
    <div
      className={`cp-bar${thin ? " cp-bar--thin" : ""}${
        campaign.status === "processing" ? " is-processing" : ""
      }`}
      role="progressbar"
      aria-valuenow={Math.round(sentPct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="cp-bar-sent" style={{ width: `${sentPct}%` }} />
      <div className="cp-bar-failed" style={{ width: `${failedPct}%` }} />
    </div>
  );
};

const CampaignActions = ({ campaign, handlers, compact = false }) => {
  const { onView, onEdit, onCancel, onDelete, onDuplicate } = handlers;
  const s = campaign.status;
  return (
    <>
      {!compact && (
        <button className="cp-view-link" onClick={() => onView(campaign)}>
          <Eye size={16} />
          View details
        </button>
      )}
      {compact && (
        <button
          className="cp-icon-btn"
          title="View details"
          aria-label="View details"
          onClick={() => onView(campaign)}
        >
          <Eye size={16} />
        </button>
      )}
      {s === "scheduled" && (
        <>
          <button
            className="cp-icon-btn"
            title="Edit"
            aria-label="Edit campaign"
            onClick={() => onEdit(campaign)}
          >
            <Pencil size={16} />
          </button>
          <button
            className="cp-icon-btn is-warn"
            title="Cancel"
            aria-label="Cancel campaign"
            onClick={() => onCancel(campaign, false)}
          >
            <Ban size={16} />
          </button>
        </>
      )}
      {s === "processing" && (
        <button
          className="cp-icon-btn is-warn"
          title="Stop campaign"
          aria-label="Stop campaign"
          onClick={() => onCancel(campaign, true)}
        >
          <Ban size={16} />
        </button>
      )}
      {["completed", "failed", "cancelled"].includes(s) && (
        <>
          <button
            className="cp-icon-btn"
            title="Duplicate"
            aria-label="Duplicate campaign"
            onClick={() => onDuplicate(campaign)}
          >
            <Copy size={16} />
          </button>
          <button
            className="cp-icon-btn is-danger"
            title="Delete"
            aria-label="Delete campaign"
            onClick={() => onDelete(campaign)}
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </>
  );
};

const CampaignCard = ({ campaign, handlers }) => {
  const when = new Date(campaign.scheduled_at);
  const Icon = (STATUS[campaign.status] || STATUS.scheduled).icon;
  const sent = num(campaign.messages_sent);
  const failed = num(campaign.messages_failed);
  const total = num(campaign.total_recipients) || sent + failed;
  const showDelivery = ["completed", "processing", "failed"].includes(
    campaign.status,
  );
  const pct = total ? Math.round((sent / total) * 100) : 0;

  return (
    <article
      className="cp-card is-clickable"
      onClick={() => handlers.onView(campaign)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && e.key === "Enter")
          handlers.onView(campaign);
      }}
      tabIndex={0}
      aria-label={`Open ${campaign.campaign_name}`}
    >
      <div className={`cp-card-head cp-s-${campaign.status}`}>
        <span className="cp-card-icon">
          <Icon
            size={19}
            className={campaign.status === "processing" ? "animate-spin" : ""}
          />
        </span>
        <div className="cp-card-titles">
          <h3 className="cp-card-name" title={campaign.campaign_name}>
            {campaign.campaign_name}
          </h3>
          <p className="cp-card-desc">
            {campaign.description || "No description"}
          </p>
        </div>
        <StatusPill status={campaign.status} />
      </div>

      <div className="cp-card-when">
        <Calendar size={16} />
        <span>{formatWhen(when)}</span>
        <span className="cp-rel">{relativeTime(when)}</span>
      </div>

      <div className="cp-meta">
        <div className="cp-meta-item">
          <div className="cp-meta-label">
            <Users size={13} /> Group
          </div>
          <div
            className="cp-meta-value"
            title={campaign.groups?.group_name || ""}
          >
            {campaign.groups?.group_name || "Unknown"}
          </div>
        </div>
        <div className="cp-meta-item">
          <div className="cp-meta-label">
            <MessageSquare size={13} /> Template
          </div>
          <div
            className="cp-meta-value"
            title={campaign.whatsapp_templates?.name || ""}
          >
            {campaign.whatsapp_templates?.name || "Unknown"}
          </div>
        </div>
      </div>

      {showDelivery ? (
        <div className="cp-delivery">
          <div className="cp-delivery-row">
            <span>
              <strong>{sent.toLocaleString()}</strong> of{" "}
              {total.toLocaleString()} sent
              {failed > 0 && ` · ${failed.toLocaleString()} failed`}
            </span>
            <strong>{pct}%</strong>
          </div>
          <DeliveryBar campaign={campaign} />
        </div>
      ) : (
        <div className="cp-recipients">
          <span>Recipients</span>
          <strong>
            {num(campaign.total_recipients) > 0
              ? num(campaign.total_recipients).toLocaleString()
              : "Calculated at send time"}
          </strong>
        </div>
      )}

      <div className="cp-card-foot" onClick={(e) => e.stopPropagation()}>
        <CampaignActions campaign={campaign} handlers={handlers} />
      </div>
    </article>
  );
};

const CampaignTable = ({ items, handlers }) => (
  <div className="cp-table-wrap">
    <table className="cp-table">
      <thead>
        <tr>
          <th>Campaign</th>
          <th>Status</th>
          <th>Group</th>
          <th>Template</th>
          <th>Scheduled</th>
          <th>Delivery</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {items.map((c) => {
          const when = new Date(c.scheduled_at);
          const sent = num(c.messages_sent);
          const failed = num(c.messages_failed);
          const total = num(c.total_recipients) || sent + failed;
          const showDelivery = ["completed", "processing", "failed"].includes(
            c.status,
          );
          return (
            <tr
              key={c.campaign_id}
              className="is-clickable"
              onClick={() => handlers.onView(c)}
              onKeyDown={(e) => {
                if (e.target === e.currentTarget && e.key === "Enter")
                  handlers.onView(c);
              }}
              tabIndex={0}
              aria-label={`Open ${c.campaign_name}`}
            >
              <td>
                <div className="cp-row-name" title={c.campaign_name}>
                  {c.campaign_name}
                </div>
                {c.description && (
                  <div className="cp-row-sub cp-cell-trunc">
                    {c.description}
                  </div>
                )}
              </td>
              <td>
                <StatusPill status={c.status} />
              </td>
              <td className="cp-cell-trunc">
                {c.groups?.group_name || "Unknown"}
              </td>
              <td className="cp-cell-trunc">
                {c.whatsapp_templates?.name || "Unknown"}
              </td>
              <td className="cp-nowrap">
                <div>{formatWhen(when)}</div>
                <div className="cp-row-sub">{relativeTime(when)}</div>
              </td>
              <td>
                {showDelivery ? (
                  <>
                    <DeliveryBar campaign={c} thin />
                    <div className="cp-row-sub">
                      {sent.toLocaleString()} / {total.toLocaleString()} sent
                    </div>
                  </>
                ) : (
                  <span className="cp-row-sub">
                    {num(c.total_recipients) > 0
                      ? `${num(c.total_recipients).toLocaleString()} recipient${
                          num(c.total_recipients) === 1 ? "" : "s"
                        }`
                      : "-"}
                  </span>
                )}
              </td>
              <td>
                <div
                  className="cp-row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CampaignActions campaign={c} handlers={handlers} compact />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Campaigns = () => {
  const navigate = useNavigate();
  const { user } = useKindeAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("created");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const listTopRef = useRef(null);
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem("samvaadik_campaign_view") === "table"
        ? "table"
        : "grid";
    } catch {
      return "grid";
    }
  });

  // The table needs ~860px, so phones always get the card layout (the layout
  // switch is hidden there too, see campaigns.css).
  const [isPhone, setIsPhone] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(max-width: 640px)").matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = (e) => setIsPhone(e.matches);
    setIsPhone(mq.matches);
    mq.addEventListener
      ? mq.addEventListener("change", onChange)
      : mq.addListener(onChange);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener("change", onChange)
        : mq.removeListener(onChange);
  }, []);
  const activeView = isPhone ? "grid" : view;

  const changeView = (v) => {
    setView(v);
    setPage(1);
    setPerPage(PER_PAGE_OPTIONS[v][0]);
    try {
      window.localStorage.setItem("samvaadik_campaign_view", v);
    } catch {
      /* ignore */
    }
  };

  // table view starts with its own default page size
  useEffect(() => {
    setPerPage(PER_PAGE_OPTIONS[activeView][0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // any filter / search / sort change starts again from the first page
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortKey]);

  // Cancel-campaign modal state
  const [cancelTarget, setCancelTarget] = useState(null); // { campaign_id, campaign_name, isProcessing }
  const [isCancelling, setIsCancelling] = useState(false);

  // Delete-campaign modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { campaign_id, campaign_name }
  const [isDeleting, setIsDeleting] = useState(false);

  // Load campaigns
  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  // Filter campaigns
  useEffect(() => {
    filterCampaigns();
  }, [searchTerm, statusFilter, campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCampaigns(user.id);
      setCampaigns(res.data.data || []);
    } catch (err) {
      setError("Failed to load campaigns");
      console.error("Load campaigns error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = [...campaigns];

    if (searchTerm) {
      filtered = filtered.filter((campaign) =>
        campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (campaign) => campaign.status === statusFilter,
      );
    }

    setFilteredCampaigns(filtered);
  };

  // Opens the modal instead of a browser confirm() — actual delete happens
  // in confirmDelete once the user confirms inside it.
  const handleDelete = (campaign) => {
    setDeleteTarget({
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
    });
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await deleteCampaign(deleteTarget.campaign_id, user.id);
      setDeleteTarget(null);
      loadCampaigns();
    } catch (err) {
      alert("Failed to delete campaign");
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Opens the modal instead of a browser confirm() — actual cancel happens
  // in confirmCancel once the user confirms inside it.
  const handleCancel = (campaign, isProcessing = false) => {
    setCancelTarget({
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      isProcessing,
    });
  };

  const closeCancelModal = () => {
    if (isCancelling) return; // don't let the backdrop/X close it mid-request
    setCancelTarget(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;

    try {
      setIsCancelling(true);
      await cancelCampaign(cancelTarget.campaign_id, user.id);
      setCancelTarget(null);
      loadCampaigns();
    } catch (err) {
      alert("Failed to cancel campaign");
      console.error("Cancel error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  // ---- Derived data ----------------------------------------------------
  const stats = useMemo(() => {
    const by = (st) => campaigns.filter((c) => c.status === st).length;
    return {
      total: campaigns.length,
      scheduled: by("scheduled"),
      processing: by("processing"),
      completed: by("completed"),
      failed: by("failed"),
      cancelled: by("cancelled"),
    };
  }, [campaigns]);

  const totalSent = campaigns.reduce((n, c) => n + num(c.messages_sent), 0);
  const totalFailedMsgs = campaigns.reduce(
    (n, c) => n + num(c.messages_failed),
    0,
  );
  const deliveryRate =
    totalSent + totalFailedMsgs > 0
      ? Math.round((totalSent / (totalSent + totalFailedMsgs)) * 100)
      : null;

  const sorted = useMemo(() => {
    const list = [...filteredCampaigns];
    const t = (c) => new Date(c.scheduled_at).getTime() || 0;
    if (sortKey === "soonest") list.sort((a, b) => t(a) - t(b));
    else if (sortKey === "latest") list.sort((a, b) => t(b) - t(a));
    else if (sortKey === "name")
      list.sort((a, b) =>
        (a.campaign_name || "").localeCompare(b.campaign_name || ""),
      );
    return list;
  }, [filteredCampaigns, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const currentPage = Math.min(page, totalPages); // e.g. after deleting the last item on a page
  const visible = sorted.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const goToPage = (n) => {
    setPage(Math.min(Math.max(1, n), totalPages));
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlers = {
    onView: (c) => navigate(`/campaigns/${c.campaign_id}`),
    onEdit: (c) => navigate(`/campaigns/edit/${c.campaign_id}`),
    onCancel: handleCancel,
    onDelete: handleDelete,
    onDuplicate: (c) =>
      navigate("/campaigns/create", {
        state: {
          prefill: {
            campaignName: `${c.campaign_name} (copy)`,
            wtId: c.wt_id,
          },
        },
      }),
  };

  const filtersActive = !!searchTerm || statusFilter !== "all";

  const kpis = [
    {
      key: "all",
      label: "Total campaigns",
      value: stats.total,
      sub: `${totalSent.toLocaleString()} messages sent`,
      icon: Megaphone,
      tone: "#4f4f93",
      soft: "#eeeefa",
    },
    {
      key: "scheduled",
      label: "Scheduled",
      value: stats.scheduled,
      sub:
        stats.processing > 0
          ? `${stats.processing} sending now`
          : "Waiting to go out",
      icon: Clock,
      tone: "#2f6fb3",
      soft: "#e8f1fb",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      sub:
        deliveryRate !== null
          ? `${deliveryRate}% sent successfully`
          : "None yet",
      icon: CheckCircle2,
      tone: "#0f8a5f",
      soft: "#e6f6ef",
    },
    {
      key: "failed",
      label: "Failed",
      value: stats.failed,
      sub: stats.failed > 0 ? "Needs attention" : "All clear",
      icon: XCircle,
      tone: "#c4456b",
      soft: "#fdecf2",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: stats.cancelled,
      sub: stats.cancelled > 0 ? "Stopped before finishing" : "None cancelled",
      icon: Ban,
      tone: "#64748b",
      soft: "#f1f5f9",
    },
  ];

  return (
    <div className="cp-page">
      {/* Header */}
      <div className="cp-head">
        <div>
          <h1 className="cp-title">Campaigns</h1>
          <p className="cp-subtitle">
            Schedule, send and track your WhatsApp campaigns in one place.
          </p>
        </div>
        <button
          className="cp-btn-new"
          onClick={() => navigate("/campaigns/create")}
        >
          <Plus size={18} strokeWidth={2.5} />
          New campaign
        </button>
      </div>

      {/* KPI strip: each tile also filters the list */}
      <div className="cp-kpis">
        {kpis.map((k) => {
          const Icon = k.icon;
          const active =
            statusFilter === k.key ||
            (k.key === "scheduled" && statusFilter === "processing");
          return (
            <button
              key={k.key}
              type="button"
              className={`cp-kpi${active ? " is-active" : ""}`}
              style={{ "--tone": k.tone, "--tone-soft": k.soft }}
              onClick={() => setStatusFilter(k.key)}
              aria-pressed={active}
            >
              <span className="cp-kpi-top">
                <span className="cp-kpi-icon">
                  <Icon size={17} />
                </span>
                <span className="cp-kpi-label">{k.label}</span>
              </span>
              <span className="cp-kpi-value">{loading ? "-" : k.value}</span>
              <span className="cp-kpi-sub">{loading ? "Loading" : k.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={statusFilter === t.key}
              className={`cp-tab${statusFilter === t.key ? " is-active" : ""}`}
              onClick={() => setStatusFilter(t.key)}
            >
              {t.label}
              <span className="cp-tab-count">
                {t.key === "all" ? stats.total : stats[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="cp-controls">
          <div className="cp-search">
            <Search size={17} />
            <input
              type="text"
              className="cp-input"
              placeholder="Search by campaign name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search campaigns"
            />
          </div>

          <select
            className="cp-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort campaigns"
          >
            {SORTS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="cp-view" role="group" aria-label="Layout">
            <button
              className={`cp-view-btn${view === "grid" ? " is-active" : ""}`}
              onClick={() => changeView("grid")}
              title="Card view"
              aria-label="Card view"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid size={17} />
            </button>
            <button
              className={`cp-view-btn${view === "table" ? " is-active" : ""}`}
              onClick={() => changeView("table")}
              title="Table view"
              aria-label="Table view"
              aria-pressed={view === "table"}
            >
              <List size={18} />
            </button>
          </div>

          <button
            className="cp-refresh"
            onClick={loadCampaigns}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="cp-error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="cp-grid" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cp-skel" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="cp-empty">
          <div className="cp-empty-icon">
            {filtersActive ? <Search size={28} /> : <Send size={28} />}
          </div>
          <h3>{filtersActive ? "No campaigns match" : "No campaigns yet"}</h3>
          <p>
            {filtersActive
              ? "Try a different status or clear your search."
              : "Create your first campaign to start reaching customers on WhatsApp."}
          </p>
          {filtersActive ? (
            <button
              className="cp-more-btn"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          ) : (
            <button
              className="cp-btn-new"
              style={{ margin: "0 auto" }}
              onClick={() => navigate("/campaigns/create")}
            >
              <Plus size={18} strokeWidth={2.5} />
              Create campaign
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="cp-count" ref={listTopRef}>
            {sorted.length} campaign{sorted.length !== 1 ? "s" : ""}
            {filtersActive ? " match your filters" : ""}
          </p>

          {activeView === "grid" ? (
            <div className="cp-grid">
              {visible.map((c) => (
                <CampaignCard
                  key={c.campaign_id}
                  campaign={c}
                  handlers={handlers}
                />
              ))}
            </div>
          ) : (
            <CampaignTable items={visible} handlers={handlers} />
          )}

          {sorted.length > Math.min(...PER_PAGE_OPTIONS[activeView]) && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={sorted.length}
              perPage={perPage}
              perPageOptions={PER_PAGE_OPTIONS[activeView]}
              onPage={goToPage}
              onPerPage={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      <CampaignCancelModal
        isOpen={!!cancelTarget}
        onClose={closeCancelModal}
        onConfirm={confirmCancel}
        campaignName={cancelTarget?.campaign_name}
        isProcessing={!!cancelTarget?.isProcessing}
        isCancelling={isCancelling}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Campaign"
        itemName={deleteTarget?.campaign_name}
        warningMessage="Are you sure you want to delete this campaign? Its message records and delivery history will be permanently removed."
        confirmText="Yes, Delete Campaign"
        cancelText="Cancel"
        isDeleting={isDeleting}
        infoItems={[]}
      />
    </div>
  );
};

export default Campaigns;
