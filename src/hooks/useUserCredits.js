// src/hooks/useUserCredits.js
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

// Fired whenever something spends or grants credits outside this hook's own
// control (right now: the Samvaadik AI Assistant, after every chat turn).
// Every mounted useUserCredits instance — navbar, pricing page, wherever —
// listens and refetches, so balances stay in sync without a shared store.
export const CREDITS_CHANGED_EVENT = "samvaadik:credits-changed";

export const useUserCredits = (userId, isAuthenticated) => {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 500)); // small delay for sync
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/credits`,
      );

      console.log("✅ Credits fetched:", res.data.credits);
      setCredits(res.data.credits);
    } catch (err) {
      console.error("❌ Error fetching credits:", err);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  useEffect(() => {
    window.addEventListener(CREDITS_CHANGED_EVENT, fetchCredits);
    return () =>
      window.removeEventListener(CREDITS_CHANGED_EVENT, fetchCredits);
  }, [fetchCredits]);

  return { credits, loading, refetchCredits: fetchCredits };
};
