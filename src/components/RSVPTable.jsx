import React, { useState, useEffect, useRef } from "react";
import { Users, Phone, Calendar, Search, Trash2, MessageCircle, Plus, X, MoreVertical } from "lucide-react";
import "../styles/table.css";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const RSVPTable = ({ eventId: propEventId }) => {
  const { eventId: paramEventId } = useParams();
  const eventId = propEventId || paramEventId;
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Checkbox selection
  const [selected, setSelected] = useState([]);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({
  full_name: "",
  phone_number: "91",
  email: "",
});


  // Popover menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ===============================
  // Fetch Contacts
  // ===============================
  useEffect(() => {
    if (!eventId) return;
    fetchContacts();
  }, [eventId]);

  useEffect(() => {
    filterData();
  }, [contacts, searchTerm]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${eventId}/participants`
      );
      const result = await res.json();

      const participants = Array.isArray(result?.participants)
        ? result.participants.map((p) => ({
            id: p.contact_id,
            fullName: p.full_name,
            phoneNumber: p.phone_number,
            email: p.email || "",
            timestamp: p.uploaded_at,
          }))
        : [];

      setContacts(participants);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      toast.error("Failed to load contacts");
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // Filter Logic
  // ===============================
  const filterData = () => {
    let filtered = contacts;

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
    setSelected([]); // Clear selection when filtering
  };

  // ===============================
  // Pagination (Must be before checkbox logic)
  // ===============================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setSelected([]); // Clear selection when changing page
  };

  // ===============================
  // Checkbox Selection
  // ===============================
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all on current page
      const currentPageIds = paginatedData.map((c) => c.id);
      setSelected(currentPageIds);
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every((contact) => selected.includes(contact.id));

  // ===============================
  // Bulk Delete
  // ===============================
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    const confirmMsg = `Are you sure you want to delete ${selected.length} contact(s)? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/contacts/bulk-delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selected }),
        }
      );

      if (res.ok) {
        toast.success(`${selected.length} contact(s) deleted successfully`);
        setSelected([]);
        fetchContacts(); // Refresh list
      } else {
        throw new Error("Failed to delete contacts");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete contacts");
    }
  };

  // ===============================
  // Single Delete
  // ===============================
  const handleDeleteOne = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;

    setOpenMenuId(null); // Close menu

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/contacts/${id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success("Contact deleted");
        fetchContacts();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete contact");
    }
  };

  // ===============================
  // Add Contact
  // ===============================
  const handleAddContact = async (e) => {
    e.preventDefault();

    if (!newContact.full_name || !newContact.phone_number) {
      toast.error("Name and phone are required");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/groups/${eventId}/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  ...newContact,
  phone_number: newContact.phone_number.replace(/\D/g, ""),
}),
        })
      if (res.ok) {
        toast.success("Contact added successfully");
        setShowAddModal(false);
        setNewContact({ full_name: "", phone_number: "", email: "" });
        fetchContacts();
      } else {
        throw new Error("Failed to add contact");
      }
    } catch (err) {
      console.error("Add contact error:", err);
      toast.error("Failed to add contact");
    }
  };

  // ===============================
  // Open Chat
  // ===============================
  const handleOpenChat = (contact) => {
    navigate(`/chatbot?group=${eventId}&contact=${contact.id}`);
    setOpenMenuId(null); // Close menu after action
  };

  // ===============================
  // Toggle Menu
  // ===============================
  const toggleMenu = (contactId) => {
    setOpenMenuId(openMenuId === contactId ? null : contactId);
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
      timeZone: "Asia/Kolkata",
    });
  };

  // ===============================
  // Loading State
  // ===============================
  if (isLoading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  // ===============================
  // UI
  // ===============================
  return (
    <div className="table-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="dashboard-title">
            <Users size={24} />
            Contacts ({filteredData.length})
          </h2>
        </div>
        <button className="add-contact-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      {/* Search & Bulk Actions */}
      <div className="dashboard-controls">
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

        {selected.length > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">
              {selected.length} selected
            </span>
            <button className="bulk-delete-btn" onClick={handleBulkDelete}>
              <Trash2 size={18} />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="rsvp-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="checkbox-input"
                />
              </th>
              <th>Name</th>
              <th>Phone Number</th>
              <th className="date-column">Added On</th>
              <th className="menu-column"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-data">
                  No contacts found
                </td>
              </tr>
            ) : (
              paginatedData.map((contact) => (
                <tr key={contact.id} className={selected.includes(contact.id) ? "selected-row" : ""}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selected.includes(contact.id)}
                      onChange={() => handleSelectOne(contact.id)}
                      className="checkbox-input"
                    />
                  </td>
                  <td>
                    <div className="name-cell">
                      <Users size={16} />
                      <span className="contact-name">{contact.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="phone-cell">
                      <Phone size={14} />
                      {contact.phoneNumber}
                    </div>
                  </td>
                 <td>
  <div className="date-cell">
    <Calendar size={14} />
    <span>{formatDate(contact.timestamp)}</span>
  </div>
</td>

                  <td className="menu-column">
                    <div className="popover-wrapper" ref={openMenuId === contact.id ? menuRef : null}>
                      <button
                        className="popover-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(contact.id);
                        }}
                        aria-label="More actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === contact.id && (
                        <div className="popover">
                          <button
                            className="popover-item"
                            onClick={() => handleOpenChat(contact)}
                          >
                            <MessageCircle size={16} />
                            Open Chat
                          </button>

                          <button
                            className="popover-item danger"
                            onClick={() => handleDeleteOne(contact.id, contact.fullName)}
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
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
                className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
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

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Contact</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="modal-form">
              <div className="form-group">
                <label htmlFor="full_name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={newContact.full_name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, full_name: e.target.value })
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">
                  Phone Number <span className="required">*</span>
                </label>
                <input
  id="phone_number"
  type="tel"
  value={newContact.phone_number}
  onChange={(e) => {
    let value = e.target.value.replace(/\D/g, "");

    // Always force prefix 91
    if (!value.startsWith("91")) {
      value = "91" + value.replace(/^91/, "");
    }

    // Max length: 12 (91 + 10 digits)
    if (value.length > 12) return;

    setNewContact({ ...newContact, phone_number: value });
  }}
  placeholder="91XXXXXXXXXX"
  required
/>

              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Optional)</label>
                <input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSVPTable;