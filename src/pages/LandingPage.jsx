// Pages/LandingPage.jsx

import React, { useEffect, useState } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { fetchMessageAnalytics, fetchDashboardAnalytics } from "../api/analytics";
import MessageStatusCards from "../components/analytics/MessageStatusCards";
import MessageDailyChart from "../components/analytics/MessageDailyChart";
import OverviewCards from "../components/analytics/OverviewCards";
import GroupsPerformanceTable from "../components/analytics/GroupsPerformanceTable";
import { Calendar, Filter, RefreshCw, BarChart3 } from "lucide-react";
import "../styles/animations.css";

const LandingPage = () => {
  const { login, register, isAuthenticated, user, getToken } = useKindeAuth();

  // Date filter state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // Analytics data
  const [messageAnalytics, setMessageAnalytics] = useState(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);

  // Load message analytics (your colleague's feature)
  const loadMessageAnalytics = async (applyFilter = false) => {
    try {
      let res;
      if (applyFilter && from && to) {
        res = await fetchMessageAnalytics(user.id, from, to);
      } else {
        res = await fetchMessageAnalytics(user.id);
      }

      setMessageAnalytics(res.data);
    } catch (err) {
      console.error("Message analytics load failed", err);
    }
  };

  // Load dashboard analytics (your feature - Overview + Groups)
  const loadDashboardAnalytics = async (applyFilter = false) => {
    try {
      let res;
      if (applyFilter && from && to) {
        res = await fetchDashboardAnalytics(user.id, from, to);
      } else {
        res = await fetchDashboardAnalytics(user.id);
      }

      setDashboardAnalytics(res.data);
      console.log("Dashboard API response:", res.data);
      console.log("Overview data:", res.data.overview);
    } catch (err) {
      console.error("Dashboard analytics load failed", err);
    }
  };

  // Load all analytics in parallel (both at the same time)
  const loadAllAnalytics = async (applyFilter = false) => {
    try {
      setLoading(true);

      // Call both APIs in parallel using Promise.all
      // This ensures both finish before setting loading to false
      await Promise.all([
        loadMessageAnalytics(applyFilter),
        loadDashboardAnalytics(applyFilter)
      ]);
    } catch (err) {
      console.error("Analytics load failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      await getToken();
      loadAllAnalytics(false); // load ALL data
    };

    if (isAuthenticated) init();
  }, [isAuthenticated]);

  // Reset filters
  const handleReset = () => {
    setFrom("");
    setTo("");
    loadAllAnalytics(false);
  };

  // Helper function to get user's display name
  const getDisplayName = (user) => {
    if (!user) return "User";
    if (user.given_name) return user.given_name;
    if (user.full_name) return user.full_name.split(" ")[0];
    if (user.email) return user.email.split("@")[0];
    return "User";
  };

  /* ---------------- NOT LOGGED IN ---------------- */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-2xl">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-lg">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4">
            WhatsApp Marketing Tool
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8">
            Manage groups, track messages, and analyze performance — all in one place.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
              <p className="text-sm text-gray-600">Real-time insights</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Date Filters</h3>
              <p className="text-sm text-gray-600">Custom date ranges</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Performance</h3>
              <p className="text-sm text-gray-600">Track engagement</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => login()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Login
            </button>
            <button
              onClick={() => register()}
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- LOGGED IN (ANALYTICS DASHBOARD) ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            Analytics Dashboard
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {getDisplayName(user)}!
          </h1>
          <p className="text-gray-600 text-lg">
            Track your WhatsApp marketing performance
          </p>
        </div>

        {/* Date Filter Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fadeIn animation-delay-100">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Label */}
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Filter by Date:</span>
            </div>

            {/* Date Inputs */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  From
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  To
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => loadAllAnalytics(true)}
                disabled={loading || !from || !to}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                Apply Filter
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Date Range Display */}
          {dashboardAnalytics?.date_range && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center">
                Showing data:{" "}
                <span className="font-semibold text-gray-900">
                  {dashboardAnalytics.date_range.from}
                </span>
                {" to "}
                <span className="font-semibold text-gray-900">
                  {dashboardAnalytics.date_range.to}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="inline-flex flex-col items-center gap-4 bg-white px-8 py-6 rounded-2xl shadow-md border border-gray-100">
              <div className="relative">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-700 font-semibold text-lg block">
                  Loading analytics...
                </span>
                <span className="text-gray-500 text-sm block">
                  Fetching your dashboard data
                </span>
              </div>
              {/* Progress dots */}
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Sections */}
        {!loading && (
          <>
            {/* Section 1: Overview Cards (Your Feature) */}
            {dashboardAnalytics?.overview && (
              <div className="space-y-3 animate-fadeIn">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  Overview
                </h2>
                <OverviewCards data={dashboardAnalytics.overview} />
              </div>
            )}

            {/* Section 2: Groups Performance Table (Your Feature) */}
            {dashboardAnalytics?.groups_performance && (
              <div className="space-y-3 animate-fadeIn animation-delay-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  Groups Performance
                </h2>
                <GroupsPerformanceTable
                  data={dashboardAnalytics.groups_performance}
                />
              </div>
            )}

            {/* Section 3: Message Status Cards (Your Colleague's Feature) */}
            {messageAnalytics?.success && messageAnalytics?.overview && (
              <div className="space-y-3 animate-fadeIn animation-delay-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-teal-600 rounded-full"></div>
                  Message Status
                </h2>
                <MessageStatusCards data={messageAnalytics.overview} />
              </div>
            )}

            {/* Section 4: Message Daily Chart (Your Colleague's Feature) */}
            {messageAnalytics?.success && messageAnalytics?.daily_chart && (
              <div className="space-y-3 animate-fadeIn animation-delay-300">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-teal-600 rounded-full"></div>
                  Daily Activity
                </h2>
                <MessageDailyChart data={messageAnalytics.daily_chart} />
              </div>
            )}

            {/* Empty State */}
            {!dashboardAnalytics && !messageAnalytics && (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    No analytics data available
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Try adjusting your date range or check back later
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage;