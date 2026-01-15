import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Users, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import RSVPTable from '../components/RSVPTable';
import { motion, AnimatePresence } from "framer-motion";
import { useUserCredits } from "../hooks/useUserCredits";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";



const CallBatchPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callInProgress, setCallInProgress] = useState(false);
  const [callResult, setCallResult] = useState(null);
  const [hasConversations, setHasConversations] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false); // For WhatsApp
  const [popupMessage, setPopupMessage] = useState(""); // ✅ Add this
const { user, isAuthenticated } = useKindeAuth();
const { refetchCredits } = useUserCredits(user?.id, isAuthenticated);
 const [batchId, setBatchId] = useState(null); // ✅ NEW: Store batch_id
 

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

useEffect(() => {
  if (hasConversations) {
    navigate(`/dashboard/${eventId}`);
  }
}, [hasConversations, navigate, eventId]);


//  const API_URL = "https://rsvp-aiagent-backend.onrender.com";

  const fetchEventData = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/events/${eventId}`);
    if (!res.ok) throw new Error("Failed to fetch event");
    const data = await res.json();

    const participants = data.participants || [];
    setEvent({
      id: data.event_id,
      name: data.event_name,
      participants
    });

    // ✅ Ask backend if conversations exist
    const res2 = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/events/${eventId}/dashboard`);
    const dashboard = await res2.json();
    setHasConversations((dashboard.conversations || []).length > 0);

  } catch (error) {
    console.error("Error fetching event data:", error);
  } finally {
    setLoading(false);
  }
};




  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          color: '#6b7280'
        }}>
          <div className="loading-spinner"></div>
          <p>Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <button 
          onClick={() => navigate('/events')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '0.5rem 0',
            marginBottom: '1rem',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#000000'}
          onMouseLeave={(e) => e.target.style.color = '#6b7280'}
        >
          <ArrowLeft size={20} />
          Back to Events
        </button>
        
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Event Not Found</h2>
          <p style={{ marginBottom: '2rem' }}>The requested event could not be found.</p>
        </div>
      </div>
    );
  }
if (hasConversations) {
  navigate(`/dashboard/${eventId}`, { replace: true });
  return null;
}

 const pollBatchStatusWithElevenLabs = async (userId, batchId, attemptCount = 0) => {
    const MAX_ATTEMPTS = 15; // Increased to 7.5 minutes
    
    try {
      console.log(`🔄 ElevenLabs API Poll attempt ${attemptCount + 1}/${MAX_ATTEMPTS}`);
      console.log(`📤 user_id: ${userId}, batch_id: ${batchId}`);

      // ✅ Call backend endpoint that uses ElevenLabs API
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/credits/reduce-batch-elevenlabs`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          user_id: userId,
          batch_id: batchId, // Use batch_id instead of event_id
        }),
      });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Credits deducted successfully:", result);
        
        // Refresh credits in navbar
        if (refetchCredits) {
          await refetchCredits();
        }
        
        // Show success alert
        alert(`✅ Batch Complete!\n\n` +
              `Total Calls: ${result.total_calls}\n` +
              `Credits Used: ${result.total_deducted}\n` +
              `New Balance: ${result.new_balance}`);
              
        console.log(`💰 ${result.total_deducted} credits deducted. New balance: ${result.new_balance}`);
        
        // Stop polling - success!
        return;
        
      } else if (response.status === 400) {
        const error = await response.json();
        
        // Check if batch is not completed yet
        if (error.error === "Batch not completed yet") {
          if (attemptCount < MAX_ATTEMPTS) {
            console.log(`⏳ ${error.message || 'Batch not ready'}. Checking again in 30s...`);
            setTimeout(() => pollBatchStatusWithElevenLabs(userId, batchId, attemptCount + 1), 30000);
          } else {
            console.log("⚠️ Max polling attempts reached");
            alert("Call processing is taking longer than expected. Please check the dashboard in a few minutes.");
          }
        } else {
          // Other error
          console.error("❌ Error:", error);
          alert(`Error: ${error.error}`);
        }
      } else if (response.status === 404) {
        const error = await response.json();
        console.error("❌ Not found:", error);
        alert(`Error: ${error.error}`);
      } else {
        const error = await response.json();
        console.error("❌ Unexpected error:", error);
        alert(`Error: ${error.error}`);
      }
      
    } catch (err) {
      console.error("❌ Polling error:", err);
      if (attemptCount < MAX_ATTEMPTS) {
        console.log("⏳ Retrying in 30s...");
        setTimeout(() => pollBatchStatusWithElevenLabs(userId, batchId, attemptCount + 1), 30000);
      }
    }
  };

  const handleStartCallBatch = async () => {
    if (!event || !event.participants?.length) return;
    
    // ✅ Check if user is available
    if (!user || !user.id) {
      console.error("❌ User not authenticated");
      alert("Please log in to start calls");
      return;
    }

    console.log("🚀 Starting batch call for user:", user.id);

    setCallInProgress(true);
    setCallResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/events/${event.id}/call-batch`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        setCallResult({
          success: false,
          message: data.error || 'Failed to start batch call',
          participantCount: 0
        });
        setCallInProgress(false);
        return;
      }

      if (res.ok) {
        // ✅ Extract batch_id from response
      const returnedBatchId = data.batch_id || data.batch?.id || event.batch_id;
        
        console.log("📦 Batch ID:", returnedBatchId);
        
        if (returnedBatchId) {
          setBatchId(returnedBatchId);
        }

        setCallResult({
          success: true,
          message: `Batch call started successfully. Calls are in progress...`,
          participantCount: event.participants.length
        });

        setShowPopup(true);
        
        setTimeout(() => {
          setShowPopup(false);
          navigate(`/dashboard/${event.id}`, { 
            state: { 
              message: 'Calls in progress. Credits will be deducted automatically when calls complete.' 
            }
          });
        }, 3000);

        // ✅ Start polling with ElevenLabs API after 2 minutes
        setTimeout(() => {
          const finalBatchId = returnedBatchId || event.batch_id;
          
          if (!finalBatchId) {
            console.error("❌ No batch_id available for polling");
            alert("Error: Could not start credit monitoring. Please contact support.");
            return;
          }
          
          console.log("⏳ Starting ElevenLabs API polling...");
          console.log("📦 Using batch_id:", finalBatchId);
          console.log("👤 Using user_id:", user.id);
          
          pollBatchStatusWithElevenLabs(user.id, finalBatchId);
        }, 180000); // 2 minutes delay
      }

    } catch (error) {
      console.error('Error starting batch call:', error);
      setCallResult({
        success: false,
        message: 'Failed to start batch call. Please try again.',
        participantCount: 0
      });
    } finally {
      setCallInProgress(false);
    }
  };

  // // ✅ Redirect to dashboard when conversations exist
  // useEffect(() => {
  //   if (hasConversations) {
  //     navigate(`/dashboard/${eventId}`);
  //   }
  // }, [hasConversations, navigate, eventId]);

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          color: '#6b7280'
        }}>
          <div className="loading-spinner"></div>
          <p>Loading event data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <button 
          onClick={() => navigate('/events')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            padding: '0.5rem 0',
            marginBottom: '1rem',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.color = '#000000'}
          onMouseLeave={(e) => e.target.style.color = '#6b7280'}
        >
          <ArrowLeft size={20} />
          Back to Events
        </button>
        
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Event Not Found</h2>
          <p style={{ marginBottom: '2rem' }}>The requested event could not be found.</p>
        </div>
      </div>
    );
  }
  

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem 1rem',
      minHeight: 'calc(100vh - 64px)'
    }}>
      <button 
        onClick={() => navigate('/events')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'none',
          border: 'none',
          color: '#6b7280',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          padding: '0.5rem 0',
          marginBottom: '2rem',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = '#000000'}
        onMouseLeave={(e) => e.target.style.color = '#6b7280'}
      >
        <ArrowLeft size={20} />
        Back to Events
      </button>

      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '3rem 2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#000000',
            marginBottom: '1rem'
          }}>
            {event.name}
          </h1>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '1.5rem'
          }}>
            Trigger AI Calls to Participants
          </h2>

          <p style={{
            fontSize: '1rem',
            color: '#6b7280',
            lineHeight: '1.6',
            marginBottom: '2.5rem',
            maxWidth: '400px',
            margin: '0 auto 2.5rem auto'
          }}>
            Click below to start an AI-powered call batch to notify your participants.
          </p>

          {event.participants && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <Users size={16} />
              <span>{event.participants.length} participants will be called</span>
            </div>
          )}

          {callResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              backgroundColor: callResult.success ? '#dcfce7' : '#fef2f2',
              color: callResult.success ? '#166534' : '#dc2626',
              border: `1px solid ${callResult.success ? '#bbf7d0' : '#fecaca'}`,
              fontWeight: '500'
            }}>
              {callResult.success && <CheckCircle size={20} />}
              <span>{callResult.message}</span>
            </div>
          )}

<button
  onClick={async () => {
      setPopupMessage("Sending WhatsApp Messages...");
  setShowWhatsAppPopup(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/whatsapp/start-initial-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId })
      });

      const data = await res.json();

      if (!res.ok) {
      setShowWhatsAppPopup(false);
      alert(data.error || "Failed to send WhatsApp messages");
      return;
    }

    setPopupMessage("✅ WhatsApp invites sent!");
    setTimeout(() => {
      setShowWhatsAppPopup(false);
    }, 3000); // ✅ Hide popup after 3 seconds

  } catch (err) {
    console.error("WhatsApp send error:", err);
    setPopupMessage("❌ Send failed. Try again.");
    setTimeout(() => {
      setShowWhatsAppPopup(false);
    }, 3000);
  }
  }}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 2.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: 'translateY(0)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.2rem'
  }}
  onMouseEnter={(e) => {
    e.target.style.background = 'linear-gradient(135deg, #333333 0%, #000000 100%)';
    e.target.style.transform = 'translateY(-1px)';
    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  }}
  onMouseLeave={(e) => {
    e.target.style.background = 'linear-gradient(135deg, #000000 0%, #333333 100%)';
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  }}
>
  <Phone size={20} />
  Send WhatsApp RSVP Message
</button>





          

          <button
            onClick={handleStartCallBatch}
            disabled={callInProgress || !event.participants?.length}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: callInProgress ? '#9ca3af' : 'linear-gradient(135deg, #000000 0%, #333333 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: callInProgress ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              transform: callInProgress ? 'none' : 'translateY(0)',
              boxShadow: callInProgress ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              if (!callInProgress) {
                e.target.style.background = 'linear-gradient(135deg, #333333 0%, #000000 100%)';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!callInProgress) {
                e.target.style.background = 'linear-gradient(135deg, #000000 0%, #333333 100%)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            {callInProgress ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Starting Call Batch...
              </>
            ) : (
              <>
                <Phone size={20} />
                Start Call Batch
              </>
            )}
          </button>

          {!event.participants?.length && (
            <p style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              marginTop: '1rem',
              fontStyle: 'italic'
            }}>
              No participants found for this event
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
  {showPopup && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(6px)'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem 3rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          maxWidth: '400px',
        }}
      >
        <Loader2
          size={40}
          style={{
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto',
            color: '#000'
          }}
        />
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Starting AI Calls...
        </h3>
        <p style={{
          color: '#6b7280',
          fontSize: '0.95rem',
          lineHeight: 1.5
        }}>
          Please wait while your event participants are being connected.
        </p>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

{showWhatsAppPopup && (
  <div style={{
    position: "fixed",
    top: "20px",
    right: "20px",
    background: "#000",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    zIndex: 9999,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  }}>
    {popupMessage}
  </div>
)}



      
{/* 
      <div style={{ marginTop: "3rem" }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          marginBottom: "1rem",
          color: "#374151"
        }}>
          RSVP Dashboard
        </h2>
        <RSVPTable eventId={eventId} />
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style> */}
    </div>
  );
};

export default CallBatchPage;