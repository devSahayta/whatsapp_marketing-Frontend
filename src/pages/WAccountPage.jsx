// import React from "react";
// import WhatsaapForm from "../components/WhatsaapForm";

// const WAccountPage = () => {
//   const handleFormSubmit = async (data) => {
//     console.log("Frontend sending:", data);

//     try {
//       const response = await fetch(
//         "http://localhost:5000/api/waccount/create-waccount",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(data),
//         }
//       );

//       const resData = await response.json();
//       console.log("Backend Response:", resData);
//       alert("WhatsApp account created successfully!");
//     } catch (error) {
//       console.error("Error:", error);
//       alert("Something went wrong!");
//     }
//   };

//   return (
//     <div style={{ padding: "30px" }}>
//       <WhatsaapForm onSubmit={handleFormSubmit} />
//     </div>
//   );
// };

// export default WAccountPage;

// ----------------------------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import WhatsaapForm from "../components/WhatsaapForm";

const WAccountPage = () => {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  const [mode, setMode] = useState("create"); // create | update
  const [existingData, setExistingData] = useState(null);

  // -----------------------------
  // 1️⃣ Fetch WhatsApp Account
  // -----------------------------
  const fetchAccount = async (uid) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/waccount/get-waccount?user_id=${uid}`
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
        ? "http://localhost:5000/api/waccount/create-waccount"
        : "http://localhost:5000/api/waccount/update-waccount";

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
          } successfully!`
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
    </div>
  );
};

export default WAccountPage;
