import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  BadgeCheck,
  CalendarClock,
  FilePlus2,
  FilePenLine,
  Flame,
  Gauge,
  HelpCircle,
  Signal,
  X,
  Activity
  
} from "lucide-react";
import WhatsaapForm from "../components/WhatsaapForm";
import WebhookHelp from "../components/WebhookHelp";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";
import "../styles/waccount-page.css";
import WarmupGuideSection from "../components/warm-up/WarmupGuideSection";

const formatLabel = (value) => {
  if (!value) return "--";

  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTier = (tier) => {
  if (!tier) return "--";
  return tier.replace("TIER_", "Tier ");
};

const formatNumber = (value) => {
  if (typeof value !== "number") return "--";
  return new Intl.NumberFormat("en-IN").format(value);
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const WAccountPage = () => {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  const [mode, setMode] = useState("create");
  const [existingData, setExistingData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  const warmupLimits = Array.isArray(existingData?.warmup_limits)
    ? existingData.warmup_limits
    : [];
  const warmupStage = existingData?.warmup_stage ?? 0;
  const warmupCompleted = Boolean(existingData?.warmup_completed);
  const currentWarmupLimit =
    warmupLimits[warmupStage - 1] ??
    existingData?.messaging_limit_per_day ??
    null;
  const warmupProgressCount = Number(existingData?.warmup_stage_progress ?? 0);
  const warmupProgress = Math.min(
    100,
    Math.max(
      0,
      currentWarmupLimit && currentWarmupLimit > 0
        ? (warmupProgressCount / currentWarmupLimit) * 100
        : 0,
    ),
  );
  const qualityClass = existingData?.quality_rating
    ? `quality-${existingData.quality_rating.toLowerCase()}`
    : "quality-default";

  const fetchAccount = async (uid) => {
    try {
      const res = await fetch(
        `${backendURL}/api/waccount/get-waccount?user_id=${uid}`,
      );
      const data = await res.json();

      if (data.success && data.data) {
        setMode("update");
        setExistingData(data.data);
        setIsEditingAccount(false);
      } else {
        setMode("create");
        setExistingData(null);
        setIsEditingAccount(false);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      fetchAccount(user.id);
    }
  }, [isLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!isEditingAccount) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditingAccount]);

  const handleFormSubmit = async (formData) => {
    const url =
      mode === "create"
        ? `${backendURL}/api/waccount/create-waccount`
        : `${backendURL}/api/waccount/update-waccount`;
    const loadingToastId = showLoading(
      mode === "create"
        ? "Creating WhatsApp account..."
        : "Updating WhatsApp account...",
    );

    try {
      setIsSubmitting(true);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      if (data.success) {
        dismissToast(loadingToastId);
        showSuccess(
          `WhatsApp account ${
            mode === "create" ? "created" : "updated"
          } successfully!`,
        );
        await fetchAccount(formData.user_id);
      } else {
        dismissToast(loadingToastId);
        showError(data.message || "Unable to save WhatsApp account.");
      }
    } catch (error) {
      console.error("Error:", error);
      dismissToast(loadingToastId);
      showError("Something went wrong while saving the WhatsApp account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="waccount-page">
      <div className="waccount-page__header">
        <img
          src="/images/meta.png"
          alt="Meta"
          className="waccount-page__meta-logo"
        />
        <p className="waccount-page__eyebrow">WhatsApp Business</p>
        <h1 className="waccount-page__title">WhatsApp Account</h1>
        <p className="waccount-page__subtitle">
          Manage your connected account and monitor current messaging capacity.
        </p>
      </div>

      {mode === "create" && (
        <section className="wa-onboarding-panel">
          <div className="wa-onboarding-panel__intro">
            <div className="wa-onboarding-panel__intro-main">
              <p className="wa-status-panel__label">First-time setup</p>
              <h2 className="wa-status-panel__title">
                Connect your WhatsApp Business account
              </h2>
              <p className="wa-onboarding-panel__text">
                Add your Meta credentials below. Once saved, this page will show
                account status, quality rating, tier, and warmup progress.
              </p>
            </div>

            <div className="wa-onboarding-panel__badge">
              <FilePlus2 size={16} />
              <span>Setup required</span>
            </div>
          </div>

          <div className="wa-status-panel__actions">
            <button
              type="button"
              className="wa-primary-action"
              onClick={() => setIsEditingAccount(true)}
            >
              <FilePlus2 size={16} />
              <span>Connect WhatsApp account</span>
            </button>
          </div>

          {/* <div className="wa-helper-note wa-helper-note--soft">
            <p className="wa-helper-note__title">
              <HelpCircle size={16} />
              <span>Need webhook setup help?</span>
            </p>
            <p className="wa-helper-note__text">
              Open the setup form to enter account details and view the webhook
              guide in the same place.
            </p>
          </div> */}
        </section>
      )}

      {existingData && (
        <>
          <section className="wa-status-panel">
            <div className="wa-status-panel__top">
              <div>
                <p className="wa-status-panel__label">Account status</p>
                <h2 className="wa-status-panel__title">
                  {existingData.status === "active"
                    ? "Connected and active"
                    : formatLabel(existingData.status)}
                </h2>
              </div>

              <div className={`wa-status-pill ${qualityClass}`}>
                <Signal size={16} />
                <span>{formatLabel(existingData.quality_rating)} Quality</span>
              </div>
            </div>

            <div className="wa-status-panel__actions">
              <button
                type="button"
                className="wa-primary-action"
                onClick={() => setIsEditingAccount((current) => !current)}
              >
                <FilePenLine size={16} />
                <span>
                  {isEditingAccount
                    ? "Hide account form"
                    : "Update WhatsApp account"}
                </span>
              </button>
            </div>

            <div className="wa-status-grid">
              <article className="wa-status-card">
                <div className="wa-status-card__icon tier">
                  <BadgeCheck size={18} />
                </div>
                <p className="wa-status-card__label">Current tier</p>
                <h3 className="wa-status-card__value">
                  {formatTier(existingData.messaging_limit_tier)}
                </h3>
                <p className="wa-status-card__meta">
                  Last updated {formatDate(existingData.last_tier_updated_at)}
                </p>
              </article>

              <article className="wa-status-card">
                <div className="wa-status-card__icon limit">
                  <Gauge size={18} />
                </div>
                <p className="wa-status-card__label">Messaging limit</p>
                <h3 className="wa-status-card__value">
                  {formatNumber(existingData.messaging_limit_per_day)}/day
                </h3>
                <p className="wa-status-card__meta">
                  Current capacity available from meta
                </p>
              </article>

              <article className="wa-status-card wa-status-card--warmup">
                <div className="wa-status-card__icon warmup">
                  <Flame size={18} />
                </div>
                <p className="wa-status-card__label">Warmup</p>
                <h3 className="wa-status-card__value">
                  {warmupCompleted ? "Completed" : `Stage ${warmupStage}`}
                </h3>
                <p className="wa-status-card__meta">
                  {warmupCompleted
                    ? "Account warmup is complete."
                    : `Current stage cap ${formatNumber(currentWarmupLimit)}/day`}
                </p>

                {!warmupCompleted && (
                  <>
                    <div className="wa-progress">
                    <div
                      className="wa-progress__fill"
                      style={{ width: `${warmupProgress}%` }}
                    />
                  </div>
                    <p className="wa-progress__text">
                      {formatNumber(warmupProgressCount)} of{" "}
                      {formatNumber(currentWarmupLimit)} messages used (
                      {Math.round(warmupProgress)}% complete)
                    </p>
                  </>
                )}
              </article>
              <article className="wa-status-card wa-status-card--tier-usage">
    <div className="wa-status-card__icon tier-usage">
      <Activity size={18} />
    </div>
    <p className="wa-status-card__label">Today's Tier Usage</p>
    <h3 className="wa-status-card__value">
      {formatNumber(existingData.tier_daily_sent || 0)}/
      {formatNumber(existingData.messaging_limit_per_day)}
    </h3>
    <p className="wa-status-card__meta">
      {formatNumber(
        Math.max(
          0, 
          (existingData.messaging_limit_per_day || 0) - 
          (existingData.tier_daily_sent || 0)
        )
      )} messages remaining today
    </p>

    {/* Progress Bar */}
    <div className="wa-progress">
      <div
        className="wa-progress__fill"
        style={{ 
          width: `${Math.min(
            100, 
            ((existingData.tier_daily_sent || 0) / 
              (existingData.messaging_limit_per_day || 0) * 100
            )
          )}%` 
        }}
      />
    </div>
    <p className="wa-progress__text">
      {Math.round(
        ((existingData.tier_daily_sent || 0) / 
          (existingData.messaging_limit_per_day || 0) * 100
        )
      )}% used • Resets at midnight UTC (5:30 AM IST)
    </p>
  </article>

              <article className="wa-status-card">
                <div className="wa-status-card__icon sync">
                  <CalendarClock size={18} />
                </div>
                <p className="wa-status-card__label">Warmup last updated</p>
                <h3 className="wa-status-card__value wa-status-card__value--small">
                  {formatDate(existingData.warmup_last_updated_at)}
                </h3>
                <p className="wa-status-card__meta">
                  {existingData.warmup_enabled
                    ? "Warmup automation is enabled."
                    : "Warmup automation is disabled."}
                </p>
              </article>
            </div>

            {!warmupCompleted && warmupLimits.length > 0 && (
              <div className="wa-warmup-steps">
                <p className="wa-warmup-steps__title">Warmup stages</p>
                <div className="wa-warmup-steps__list">
                  {warmupLimits.map((limit, index) => {
                    const stageNumber = index + 1;
                    const state =
                      stageNumber < warmupStage
                        ? "done"
                        : stageNumber === warmupStage
                          ? "active"
                          : "upcoming";

                    return (
                      <div
                        key={`${stageNumber}-${limit}`}
                        className={`wa-stage-chip wa-stage-chip--${state}`}
                      >
                        <span className="wa-stage-chip__stage">
                          Stage {stageNumber}
                        </span>
                        <span className="wa-stage-chip__limit">
                          {formatNumber(limit)}/day
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {existingData && !isEditingAccount && (
  <WarmupGuideSection 
    currentStage={existingData.warmup_stage}
    warmupCompleted={existingData.warmup_completed}
    tier={existingData.messaging_limit_tier}
  />
)}

      {existingData && !isEditingAccount && (
        <section className="wa-helper-note">
          <p className="wa-helper-note__title">
            <HelpCircle size={16} />
            <span>Need webhook setup help?</span>
          </p>
          <p className="wa-helper-note__text">
            Click update to review the webhook setup guide or change account
            credentials.
          </p>
        </section>
      )}

      {isEditingAccount && (
        <div
          className="wa-modal-backdrop"
          onClick={() => !isSubmitting && setIsEditingAccount(false)}
        >
          <div
            className="wa-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="wa-modal-card__header">
              <div>
                <p className="wa-status-panel__label">
                  {mode === "create" ? "Account setup" : "Account editor"}
                </p>
                <h2 className="wa-status-panel__title">
                  {mode === "create"
                    ? "Connect WhatsApp account"
                    : "Update WhatsApp account"}
                </h2>
              </div>

              <button
                type="button"
                className="wa-modal-close"
                onClick={() => setIsEditingAccount(false)}
                disabled={isSubmitting}
                aria-label="Close update form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="wa-modal-card__content">
              <WhatsaapForm
                mode={mode}
                existingData={existingData}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsEditingAccount(false)}
                isSubmitting={isSubmitting}
              />

              <div className="wa-modal-card__helper">
                <WebhookHelp />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WAccountPage;
