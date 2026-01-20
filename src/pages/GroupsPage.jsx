// pages/EventsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight, MoreVertical } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "../styles/pages.css";
import "../styles/events.css";
import {
  dismissToast,
  showError,
  showLoading,
  showSuccess,
} from "../utils/toast";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useKindeAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      fetchEvents(user.id);
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchEvents = async (userId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups?user_id=${userId}`,
      );

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------
  // ✅ DELETE EVENT FUNCTION (BACKEND CONNECTED)
  // -------------------------------------------------------
  const deleteEvent = async (eventId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this event and all related data?",
    );

    if (!confirmDelete) return;

    try {
      const toastId = showLoading("Deleting group...");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${eventId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || "Failed to delete event");
        // alert(data.error || "Failed to delete event");
        return;
      }

      // Remove event from UI
      setEvents(events.filter((event) => event.group_id !== eventId));

      dismissToast(toastId);
      showSuccess("Group deleted successfully");
      // alert("Event deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      showError("Something went wrong while deleting the event.");
      // alert("Something went wrong while deleting the event.");
    }
  };
  // -------------------------------------------------------

  const handleEventClick = (groupId) => {
    navigate(`/dashboard/${groupId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  };

  if (authLoading || isLoading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header mb-16">
        <h1 className="page-title font-inter uppercase">Groups</h1>
        <p className="page-subtitle font-inter">
          Manage and view all your groups
        </p>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <Calendar size={48} />
          <h3>No Groups Found</h3>
          <p>You haven’t created any groups yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/createGroup")}
          >
            Create Your First Group
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => {
            const { date } = formatDate(event.created_at);

            return (
              <div
                key={event.group_id}
                className="event-card"
                onClick={() => handleEventClick(event.group_id)}
              >
                {/* ⋮ THREE DOTS MENU */}
                <div
                  className="event-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical
                    size={22}
                    className="event-menu-icon"
                    onClick={() =>
                      setOpenMenu(
                        openMenu === event.group_id ? null : event.group_id,
                      )
                    }
                  />

                  {/* DROPDOWN */}
                  {openMenu === event.group_id && (
                    <div className="event-menu-dropdown show-menu">
                      <div
                        className="event-menu-item delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.group_id); // ⬅️ connected to backend
                        }}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </div>

                <div className="event-card-header">
                  <h3 className="event-name uppercase ">{event.group_name}</h3>
                  <ArrowRight size={20} className="event-arrow" />
                </div>

                <div className="event-details">
                  <div className="event-date">
                    <Calendar size={16} />
                    <span>{date}</span>
                  </div>
                </div>

                <p className="event-description">
                  {event.status || "No status available"}
                </p>

                <div className="event-card-footer">
                  <div className="event-stats">
                    <Users size={16} />
                    <span>View Groups</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
