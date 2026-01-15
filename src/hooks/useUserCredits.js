// src/hooks/useUserCredits.js
import { useEffect, useState, useCallback } from "react";
import axios from "axios";

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
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}/credits`
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

  return { credits, loading, refetchCredits: fetchCredits };
};
