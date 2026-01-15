import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventFlights, refreshEventFlights } from "../api/flightTracking";
import useAuthUser from "../hooks/useAuthUser";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const statusColorMap = {
  LANDED: "bg-emerald-500",
  IN_AIR: "bg-blue-500",
  DELAYED: "bg-amber-500",
  NOT_FOUND: "bg-gray-400",
};

const FlightStatus = () => {
  const { eventId } = useParams();
  const { userId } = useAuthUser();
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFlights = async () => {
    try {
      setLoading(true);
      const toastId = showLoading("Loading Flight Data...");
      const res = await fetchEventFlights(eventId, userId);
      dismissToast(toastId);
      showSuccess("Flight Data Loaded");
      setFlights(res.data.flights || []);
    } catch (err) {
      // console.error("Failed to load flight status", err);
      showError("Failed to load flight status", err);
    } finally {
      setLoading(false);
    }
  };

  // const refreshFlights = async () => {
  //   try {
  //     setRefreshing(true);
  //     const toastId = showLoading("Refreshing Flight Data...");
  //     await refreshEventFlights(eventId, userId);
  //     dismissToast(toastId);
  //     showSuccess("Flight Data get Updated");
  //     await loadFlights();
  //   } catch (err) {
  //     // alert(err?.response?.data?.error || "Refresh failed");
  //     showError(err?.response?.data?.error || "Refresh failed");
  //   } finally {
  //     setRefreshing(false);
  //   }
  // };

  const refreshFlights = async () => {
    try {
      setRefreshing(true);

      const toastId = showLoading("Refreshing Flight Data...");

      const res = await refreshEventFlights(eventId, userId);
      const { refreshed, skipped_due_to_cooldown, message } = res.data;

      dismissToast(toastId);

      // ✅ Success messaging
      if (refreshed > 0 && skipped_due_to_cooldown > 0) {
        showSuccess(
          ` ${refreshed} refreshed • ⚠️ ${skipped_due_to_cooldown} skipped (cooldown)`
        );
      } else if (refreshed > 0) {
        showSuccess(` ${refreshed} flight(s) refreshed successfully`);
      } else if (skipped_due_to_cooldown > 0) {
        showError(
          ` All flights are under cooldown (${skipped_due_to_cooldown} skipped)`
        );
      } else {
        showSuccess(message || "Flight refresh completed");
      }

      await loadFlights();
    } catch (err) {
      dismissToast?.();

      showError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Refresh failed"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (eventId && userId) loadFlights();
  }, [eventId, userId]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 space-y-4 ">
        <h1 className=" text-2xl md:text-4xl text-center font-bold text-gray-900">
          Flight Status Tracking
        </h1>
        <p className="text-sm text-center text-gray-500 mt-1">
          Track arrival flights for all event participants
        </p>
      </div>

      {/* Actions */}
      <div className="mb-4 flex items-start justify-between">
        <button
          onClick={() => navigate(`/dashboard/${eventId}`)}
          className="px-3 py-1.5 text-sm rounded-lg border text-gray-600 hover:bg-gray-50"
        >
          ← Back to Event
        </button>

        <button
          onClick={refreshFlights}
          disabled={refreshing}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition
            ${
              refreshing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-black hover:bg-gray-800"
            }`}
        >
          🔄 Refresh Flight Status
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-10 text-gray-500">
          Loading flight data...
        </div>
      ) : flights.length === 0 ? (
        <div className="flex justify-center py-10 text-gray-500">
          No flight data available for this event.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Flight
                </th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700 ">
                  From → To
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Arrival
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Delay
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Terminal
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flights.map((f) => (
                <tr key={f.participant_id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {f.full_name || "—"}
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-900">
                    {f.phone_number || "—"}
                  </td>

                  <td className="px-4 py-3">{f.flight_iata}</td>

                  <td className="px-4 py-2 text-sm">
                    <div>
                      {f.departure_airport_name || "—"} (
                      {f.departure_airport_iata})
                    </div>
                    <div className="text-gray-500">
                      → {f.arrival_airport_name || "—"} (
                      {f.arrival_airport_iata})
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${
                        statusColorMap[f.flight_status] || "bg-gray-400"
                      }`}
                    >
                      {f.flight_status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {f.estimated_arrival || f.scheduled_arrival || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {f.arrival_delay_minutes
                      ? `${f.arrival_delay_minutes} min`
                      : "—"}
                  </td>

                  <td className="px-4 py-3">{f.arrival_terminal || "—"}</td>

                  <td className="px-4 py-3 text-gray-500">
                    {f.last_api_checked_at
                      ? new Date(f.last_api_checked_at).toLocaleString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FlightStatus;
