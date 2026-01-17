  import React from 'react';
  import RSVPTable from '../components/RSVPTable';
  import '../styles/pages.css';

  const Dashboard = () => {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Group Members Dashboard</h1>
          <p className="page-subtitle">Monitor your group members and their data</p>
        </div>
        <RSVPTable />
      </div>
    );
  };

  export default Dashboard;