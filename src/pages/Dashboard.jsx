  import React from 'react';
  import RSVPTable from '../components/RSVPTable';
  import '../styles/pages.css';

  const Dashboard = () => {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">RSVP Dashboard</h1>
          <p className="page-subtitle">Monitor your event responses and guest data</p>
        </div>
        <RSVPTable />
      </div>
    );
  };

  export default Dashboard;