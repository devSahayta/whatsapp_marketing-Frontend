// import React, { useEffect } from "react";
// import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
// import { useNavigate } from "react-router-dom";

// const LandingPage = () => {
//   const { login, register, isAuthenticated, user, logout, getToken } =
//     useKindeAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchToken = async () => {
//       try {
//         const token = await getToken();
//         // console.log("🔥 Kinde Access Token:", token);
//       } catch (err) {
//         console.error("Failed to get token:", err);
//       }
//     };

//     if (isAuthenticated) {
//       fetchToken();
//     }
//   }, [isAuthenticated, getToken]);

//   return (
//     <div className="flex flex-col items-center justify-center h-[80vh] text-center">
//       <h1 className="text-4xl font-bold mb-4">
//         Welcome to Whatsapp Marketing Tool 🎉
//       </h1>
//       <p className="mb-6 text-gray-600">Manage groups and track messages.</p>

//       {!isAuthenticated ? (
//         <div className="space-x-4">
//           <button onClick={() => login()} className="auth-button">
//             Login
//           </button>
//           <button onClick={() => register()} className="auth-button">
//             Sign Up
//           </button>
//         </div>
//       ) : (
//         <div className="space-x-4">
//           <button
//             onClick={() => navigate("/createGroup")}
//             className="auth-button"
//           >
//             Create Groups
//           </button>
//           <button onClick={() => logout()} className="auth-button bg-red-500">
//             Logout
//           </button>
//         </div>
//       )}

//       {isAuthenticated && (
//         <p className="mt-4 text-gray-500">
//           Logged in as <span className="font-medium">{user?.email}</span>
//         </p>
//       )}
//     </div>
//   );
// };

// export default LandingPage;

//---------------------------------Revised version-----------------

import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { fetchMessageAnalytics } from "../api/analytics";
import MessageStatusCards from "../components/analytics/MessageStatusCards";
import MessageDailyChart from "../components/analytics/MessageDailyChart";

const LandingPage = () => {
  const { login, register, isAuthenticated, user, getToken } = useKindeAuth();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = async (applyFilter = false) => {
    try {
      setLoading(true);

      let res;
      if (applyFilter && from && to) {
        res = await fetchMessageAnalytics(user.id, from, to);
      } else {
        res = await fetchMessageAnalytics(user.id);
      }

      setAnalytics(res.data);
    } catch (err) {
      console.error("Analytics load failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await getToken();
      loadAnalytics(false); // load ALL data
    };

    if (isAuthenticated) init();
  }, [isAuthenticated]);

  /* ---------------- NOT LOGGED IN ---------------- */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Whatsapp Marketing Tool 🎉
        </h1>
        <p className="mb-6 text-gray-600">Manage groups and track messages.</p>

        <div className="space-x-4">
          <button onClick={() => login()} className="auth-button">
            Login
          </button>
          <button onClick={() => register()} className="auth-button">
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- LOGGED IN (ANALYTICS) ---------------- */
  return (
    <div className="min-h-screen px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Analytics Dashboard
        </h2>
        <p className="text-gray-600 mt-1">
          Message delivery & engagement overview
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl px-4 py-2 text-gray-800 shadow-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-white/80 backdrop-blur border border-gray-200 rounded-xl px-4 py-2 text-gray-800 shadow-sm"
        />
        <button
          onClick={() => loadAnalytics(true)}
          className="bg-black text-white px-6 py-2 rounded-xl shadow hover:opacity-90"
        >
          Apply Filter
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-500">Loading analytics…</div>
      )}

      {analytics?.success && (
        <>
          <MessageStatusCards data={analytics.overview} />
          <MessageDailyChart data={analytics.daily_chart} />
        </>
      )}
    </div>
  );
};

export default LandingPage;
