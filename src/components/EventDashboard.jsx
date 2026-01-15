import RSVPTable from "../components/RSVPTable";
import { useParams, useNavigate } from "react-router-dom";

const EventDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/events/${eventId}`
        );
        if (!response.ok) throw new Error("Failed to fetch event");
        const data = await response.json();
        setEvent(data.event);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetchEventData();
  }, [eventId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>No event found</p>;

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigate("/events")}>
        Back to Events
      </button>

      <h1>{event.name}</h1>
      <p>
        {event.date} at {event.time}
      </p>
      <p>{event.description}</p>

      {/* 👇 insert table here */}
      <RSVPTable eventId={eventId} />
    </div>
  );
};

export default EventDashboard;
