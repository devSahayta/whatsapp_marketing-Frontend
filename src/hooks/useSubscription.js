import { useCallback, useEffect, useState } from "react";
import { getSubscriptionStatus } from "../api/payment";

const normalizeIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizePlan = (plan) => {
  if (!plan || typeof plan !== "object") return null;

  return {
    ...plan,
    plan_id: plan.plan_id ?? plan.planId ?? null,
    name: plan.name ?? plan.plan_name ?? "",
    duration_months: plan.duration_months ?? plan.durationMonths ?? null,
    features: plan.features ?? {},
  };
};

const normalizeSubscriptionPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;

  return {
    ...payload,
    active: Boolean(payload.active),
    expiresAt: normalizeIsoDate(payload.expiresAt ?? payload.expires_at),
    plan: normalizePlan(payload.plan),
  };
};

const useSubscription = (userId, options = {}) => {
  const { enabled = true } = options;
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) {
      setActive(false);
      setSubscription(null);
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await getSubscriptionStatus(userId);
      const payload = normalizeSubscriptionPayload(res?.data ?? res);

      setActive(Boolean(payload?.active));
      setSubscription(payload);
      return payload;
    } catch (err) {
      setActive(false);
      setSubscription(null);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    active,
    subscription,
    expiresAt:
      normalizeIsoDate(subscription?.expiresAt ?? subscription?.expires_at) ??
      null,
    plan: subscription?.plan ?? null,
    isExpired: Boolean(
      !active &&
        normalizeIsoDate(subscription?.expiresAt ?? subscription?.expires_at) &&
        new Date(subscription?.expiresAt ?? subscription?.expires_at).getTime() <=
          Date.now(),
    ),
    error,
    refresh,
  };
};

export default useSubscription;
