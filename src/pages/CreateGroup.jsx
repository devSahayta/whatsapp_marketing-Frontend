import React from 'react';
import EventForm from '../components/GroupForm';
import '../styles/pages.css';
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

const CreateEvent = () => {
  const { user, isAuthenticated, isLoading } = useKindeAuth();

  console.log("Kinde user object:", user);

  if (isLoading) return <p>Loading authentication...</p>;
  if (!isAuthenticated || !user) return <p>Please log in to create an group</p>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create New Group</h1>
        <p className="page-subtitle">Set up your group and upload guest data</p>
      </div>
      <EventForm user={user} />
    </div>
  );
};


export default CreateEvent;
