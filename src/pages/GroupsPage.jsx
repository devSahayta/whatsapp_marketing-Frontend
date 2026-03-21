import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  ArrowRight,
  Calendar,
  FileSpreadsheet,
  FolderPlus,
  MoreVertical,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { fetchGroups } from "../api/groups";
import api from "../api/apiClient";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const formatCreatedDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusTone = (status) => {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useKindeAuth();

  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id) {
      loadGroups(user.id);
    }
  }, [authLoading, isAuthenticated, user?.id]);

  const loadGroups = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetchGroups(userId);
      setGroups(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      showError("Failed to load groups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupClick = (groupId) => {
    navigate(`/dashboard/${groupId}`);
  };

  const handleDeleteClick = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
    setOpenMenu(null);
  };

  const handleCloseModal = () => {
    if (isDeleting) return;

    setShowDeleteModal(false);
    setGroupToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    let toastId;

    try {
      setIsDeleting(true);
      toastId = showLoading("Deleting group...");

      await api.delete(`/api/groups/${groupToDelete.group_id}`);

      setGroups((currentGroups) =>
        currentGroups.filter((group) => group.group_id !== groupToDelete.group_id),
      );

      dismissToast(toastId);
      showSuccess("Group deleted successfully");
      setShowDeleteModal(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
      dismissToast(toastId);
      showError(
        error?.response?.data?.error || "Something went wrong while deleting the group.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const total = groups.length;
    const active = groups.filter((group) => group.status === "active").length;
    const withCsv = groups.filter((group) => group.uploaded_csv).length;
    const latest =
      total > 0
        ? [...groups].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0]
        : null;

    return { total, active, withCsv, latest };
  }, [groups]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/60 bg-white/70 p-12 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Loading your groups
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pulling the latest group list from your workspace.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/75 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                <Users className="h-4 w-4" />
                Groups Workspace
              </div>

              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  Organize your contact groups with a cleaner working view.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  See every group, check upload readiness, and jump straight into
                  the dashboard from one page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate("/createGroup")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create Group
                </button>

                <button
                  onClick={() => loadGroups(user?.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Refresh List
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard
                icon={Users}
                label="Total Groups"
                value={stats.total}
                accent="from-sky-500/15 to-cyan-500/10"
              />
              <MetricCard
                icon={ShieldCheck}
                label="Active Groups"
                value={stats.active}
                accent="from-emerald-500/15 to-lime-500/10"
              />
              <MetricCard
                icon={FileSpreadsheet}
                label="CSV Uploaded"
                value={stats.withCsv}
                accent="from-violet-500/15 to-fuchsia-500/10"
                helper={
                  stats.latest
                    ? `Latest: ${stats.latest.group_name}`
                    : "No groups created yet"
                }
              />
            </div>
          </div>
        </section>

        {groups.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <FolderPlus className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-slate-900">
              No groups created yet
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Create your first group to upload contacts, organize campaigns, and
              start sending from a structured list.
            </p>
            <button
              onClick={() => navigate("/createGroup")}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <FolderPlus className="h-4 w-4" />
              Create Your First Group
            </button>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Your Groups
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a group to open its dashboard or manage it from the menu.
                </p>
              </div>

              <p className="text-sm text-slate-500">
                {groups.length} group{groups.length === 1 ? "" : "s"} available
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <article
                  key={group.group_id}
                  className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(15,23,42,0.12)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500" />

                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="cursor-pointer"
                      onClick={() => handleGroupClick(group.group_id)}
                    >
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusTone(group.status)}`}
                      >
                        {group.status || "Unknown"}
                      </span>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                        {group.group_name}
                      </h3>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === group.group_id ? null : group.group_id,
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenu === group.group_id && (
                        <div className="absolute right-0 top-12 z-10 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(group)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="mt-5 cursor-pointer space-y-4"
                    onClick={() => handleGroupClick(group.group_id)}
                  >
                    <p className="min-h-[48px] text-sm leading-6 text-slate-600">
                      {group.description || "No description added for this group yet."}
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoPill
                        icon={Calendar}
                        label="Created"
                        value={formatCreatedDate(group.created_at)}
                      />
                      <InfoPill
                        icon={FileSpreadsheet}
                        label="CSV File"
                        value={group.uploaded_csv ? "Uploaded" : "Missing"}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                          Open dashboard
                        </p>
                        <p className="mt-1 text-sm text-slate-100">
                          Manage contacts and activity
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        itemName={groupToDelete?.group_name}
        warningMessage="Are you sure you want to delete this group? All related data will be permanently removed."
        confirmText="Yes, Delete Group"
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, helper, accent }) => (
  <div
    className={`rounded-[24px] border border-white/80 bg-gradient-to-br ${accent} bg-white/80 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]`}
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {helper && <p className="mt-3 text-xs text-slate-500">{helper}</p>}
  </div>
);

const InfoPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

export default GroupsPage;
