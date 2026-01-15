// pages/EventsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Users, ArrowRight, MoreVertical } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "../styles/pages.css";
import "../styles/events.css";

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
        `${import.meta.env.VITE_BACKEND_URL}/api/events?user_id=${userId}`
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
      "Are you sure you want to delete this event and all related data?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete event");
        return;
      }

      // Remove event from UI
      setEvents(events.filter((event) => event.event_id !== eventId));

      alert("Event deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting the event.");
    }
  };
  // -------------------------------------------------------

  const handleEventClick = (eventId) => {
    navigate(`/call-batch/${eventId}`);
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
          <p>Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Events</h1>
        <p className="page-subtitle">Manage and view all your RSVP events</p>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <Calendar size={48} />
          <h3>No Events Found</h3>
          <p>You haven’t created any events yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/createEvent")}
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => {
            const { date } = formatDate(event.event_date);

            return (
              <div
                key={event.event_id}
                className="event-card"
                onClick={() => handleEventClick(event.event_id)}
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
                        openMenu === event.event_id ? null : event.event_id
                      )
                    }
                  />

                  {/* DROPDOWN */}
                  {openMenu === event.event_id && (
                    <div className="event-menu-dropdown show-menu">
                      <div
                        className="event-menu-item delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEvent(event.event_id); // ⬅️ connected to backend
                        }}
                      >
                        Delete
                      </div>
                    </div>
                  )}
                </div>

                <div className="event-card-header">
                  <h3 className="event-name">{event.event_name}</h3>
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
                    <span>View RSVPs</span>
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
