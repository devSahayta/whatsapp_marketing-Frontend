import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import WhatsaapForm from "../components/WhatsaapForm";
import WebhookHelp from "../components/WebhookHelp";

const WAccountPage = () => {
  const backendURL = import.meta.env.VITE_BACKEND_URL;
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  const [mode, setMode] = useState("create"); // create | update
  const [existingData, setExistingData] = useState(null);

  // -----------------------------
  // 1️⃣ Fetch WhatsApp Account
  // -----------------------------
  const fetchAccount = async (uid) => {
    try {
      const res = await fetch(
        `${backendURL}/api/waccount/get-waccount?user_id=${uid}`,
      );
      const data = await res.json();

      if (data.success && data.data) {
        setMode("update");
        setExistingData(data.data);
      } else {
        setMode("create");
        setExistingData(null);
      }
    } catch (err) {
      console.error("❌ Fetch Error:", err);
    }
  };

  // Fetch when user loads
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      fetchAccount(user.id);
    }
  }, [isLoading, isAuthenticated, user]);

  // -----------------------------
  // 2️⃣ Handle Submit (Create/Update)
  // -----------------------------
  const handleFormSubmit = async (formData) => {
    const url =
      mode === "create"
        ? `${backendURL}/api/waccount/create-waccount`
        : `${backendURL}/api/waccount/update-waccount`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      if (data.success) {
        alert(
          `WhatsApp account ${
            mode === "create" ? "created" : "updated"
          } successfully!`,
        );
        fetchAccount(formData.user_id); // refresh after update
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <WhatsaapForm
        mode={mode}
        existingData={existingData}
        onSubmit={handleFormSubmit}
      />

      <WebhookHelp />
    </div>
  );
};

export default WAccountPage;
