import React, { useState, useEffect } from "react";
import { Users, Phone, Calendar, Search } from "lucide-react";
import "../styles/table.css";
import { useParams } from "react-router-dom";

const RSVPTable = ({ eventId: propEventId }) => {
  const { eventId: paramEventId } = useParams();
  const eventId = propEventId || paramEventId;

  const [rsvpData, setRsvpData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!eventId) return;
    fetchRSVPData();
  }, [eventId]);

  useEffect(() => {
    filterData();
  }, [rsvpData, searchTerm]);

  // ===============================
  // Fetch Participants
  // ===============================
  const fetchRSVPData = async () => {
    try {
      setIsLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${eventId}/participants`
      );

      const result = await res.json();
      console.log("Participants API response:", result);

      // ✅ Always normalize backend → frontend shape
      const participants = Array.isArray(result?.participants)
        ? result.participants.map((p) => ({
            id: p.contact_id,
            fullName: p.full_name,
            phoneNumber: p.phone_number,
            timestamp: p.uploaded_at,
          }))
        : [];

      setRsvpData(participants);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setRsvpData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // Filter Logic
  // ===============================
  const filterData = () => {
    let filtered = rsvpData;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.fullName?.toLowerCase().includes(lower) ||
          item.phoneNumber?.toLowerCase().includes(lower)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // ===============================
  // Date Formatter
  // ===============================
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  };

  // ===============================
  // Pagination
  // ===============================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ===============================
  // Loading State
  // ===============================
  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading Groups member data...</p>
        </div>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="table-container">
      {/* Search */}
      <div className="table-filters">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="rsvp-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={3} className="no-data">
                  No Groups member data found
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="name-cell">
                      <Users size={16} />
                      {item.fullName}
                    </div>
                  </td>
                  <td>
                    <div className="phone-cell">
                      <Phone size={14} />
                      {item.phoneNumber}
                    </div>
                  </td>
                  <td className="date-cell">
                    <Calendar size={14} />
                    {formatDate(item.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>

          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`page-number ${
                  currentPage === i + 1 ? "active" : ""
                }`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RSVPTable;
