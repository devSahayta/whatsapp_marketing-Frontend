import React from 'react';
import EventForm from '../components/EventForm';
import '../styles/pages.css';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const CreateEvent = () => {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  console.log("Kinde user object:", user);

  if (isLoading) return <p>Loading authentication...</p>;
  if (!isAuthenticated || !user) return <p>Please log in to create an event</p>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create New Event</h1>
        <p className="page-subtitle">Set up your RSVP event and upload guest data</p>
      </div>
      <EventForm user={user} />
    </div>
  );
};


export default CreateEvent;
