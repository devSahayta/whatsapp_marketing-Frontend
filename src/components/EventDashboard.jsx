import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EventDashboard = () => {
  const { eventId } = useParams(); // this is groupId
  const navigate = useNavigate();

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/groups/${eventId}/participants`
        );

        if (!res.ok) throw new Error("Failed to fetch participants");

        const data = await res.json();
        setParticipants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="page-container">
      <button onClick={() => navigate("/events")}>← Back</button>

      <h1>Participants</h1>

      <table className="rsvp-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.contact_id}>
              <td>{p.full_name || "-"}</td>
              <td>{p.phone_number}</td>
              <td>
                {new Date(p.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventDashboard;
