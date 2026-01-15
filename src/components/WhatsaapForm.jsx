// "use client";

// import React, { useState, useEffect } from "react";
// import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
// import "../styles/document-form.css";

// const WhatsaapForm = ({ onSubmit }) => {
//   const { user, isAuthenticated, isLoading } = useKindeAuth();

//   const [form, setForm] = useState({
//     user_id: "", // will be auto-filled from Kinde
//     app_id: "",
//     waba_id: "",
//     phone_number_id: "",
//     business_phone_number: "",
//     system_user_access_token: "",
//   });

//   // ✔ Auto-fill user_id from frontend authentication
//   useEffect(() => {
//     if (!isLoading && isAuthenticated && user) {
//       setForm((prev) => ({
//         ...prev,
//         user_id: user.id, // ⬅ KINDE USER ID FROM FRONTEND
//       }));
//     }
//   }, [isLoading, isAuthenticated, user]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (onSubmit) onSubmit(form);
//   };

//   return (
//     <div className="form-card">
//       <h2 className="form-title">Connect WhatsApp Account</h2>

//       <form onSubmit={handleSubmit}>
//         <label className="form-label">App ID</label>
//         <input
//           type="text"
//           name="app_id"
//           className="form-input"
//           value={form.app_id}
//           onChange={handleChange}
//         />

//         <label className="form-label">WhatsApp Business Account ID</label>
//         <input
//           type="text"
//           name="waba_id"
//           className="form-input"
//           value={form.waba_id}
//           onChange={handleChange}
//         />

//         <label className="form-label">Phone Number ID</label>
//         <input
//           type="text"
//           name="phone_number_id"
//           className="form-input"
//           value={form.phone_number_id}
//           onChange={handleChange}
//         />

//         <label className="form-label">Business Phone Number</label>
//         <input
//           type="text"
//           name="business_phone_number"
//           className="form-input"
//           value={form.business_phone_number}
//           onChange={handleChange}
//         />

//         <label className="form-label">System User Access Token</label>
//         <input
//           type="text"
//           name="system_user_access_token"
//           className="form-input"
//           value={form.system_user_access_token}
//           onChange={handleChange}
//         />

//         {/* ❌ No visible label or input for user_id */}
//         <input type="hidden" name="user_id" value={form.user_id} />

//         <button className="submit-btn" type="submit">
//           Submit
//         </button>
//       </form>
//     </div>
//   );
// };

// export default WhatsaapForm;

// -------------------------------------------------------------------------------------------------------------------

"use client";

import React, { useState, useEffect } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "../styles/document-form.css";

const WhatsaapForm = ({ mode, existingData, onSubmit }) => {
  const { user } = useKindeAuth();

  const [form, setForm] = useState({
    user_id: "",
    app_id: "",
    waba_id: "",
    phone_number_id: "",
    business_phone_number: "",
    system_user_access_token: "",
  });

  // Fill form with existing data for UPDATE mode
  useEffect(() => {
    if (existingData) {
      setForm(existingData);
    }
  }, [existingData]);

  // Auto set user_id in CREATE mode
  useEffect(() => {
    if (user && mode === "create") {
      setForm((prev) => ({ ...prev, user_id: user.id }));
    }
  }, [user, mode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="form-card">
      {/* Meta Logo */}
      <img src="/images/meta.png" alt="Meta" className="meta-logo" />

      <h2 className="form-title">
        {mode === "create"
          ? "Connect WhatsApp Account"
          : "Update WhatsApp Account"}
      </h2>

      <form onSubmit={handleSubmit}>
        <label className="form-label">App ID</label>
        <input
          type="text"
          name="app_id"
          className="form-input"
          value={form.app_id}
          onChange={handleChange}
        />

        <label className="form-label">WhatsApp Business Account ID</label>
        <input
          type="text"
          name="waba_id"
          className="form-input"
          value={form.waba_id}
          onChange={handleChange}
        />

        <label className="form-label">Phone Number ID</label>
        <input
          type="text"
          name="phone_number_id"
          className="form-input"
          value={form.phone_number_id}
          onChange={handleChange}
        />

        <label className="form-label">Business Phone Number</label>
        <input
          type="text"
          name="business_phone_number"
          className="form-input"
          value={form.business_phone_number}
          onChange={handleChange}
        />

        <label className="form-label">System User Access Token</label>
        <input
          type="text"
          name="system_user_access_token"
          className="form-input"
          value={form.system_user_access_token}
          onChange={handleChange}
        />

        {/* Hidden user_id field */}
        <input type="hidden" name="user_id" value={form.user_id} />

        <button className="submit-btn" type="submit">
          {mode === "create" ? "Create" : "Update"}
        </button>
      </form>
    </div>
  );
};

export default WhatsaapForm;
