import React from 'react';
import DocumentViewer from '../components/DocumentViewer';
import { useNavigate } from 'react-router-dom';

const DocumentViewerPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Example documents data - replace with actual data from props or API
  const documents = [
    {
      id: 1,
      participant_relatives_name: 'John Doe',
      document_type: 'Passport',
      role: 'Primary Contact',
      document_url: 'https://example.com/passport.pdf'
    },
    {
      id: 2,
      participant_relatives_name: null,
      document_type: 'ID Proof',
      role: 'Self',
      document_url: 'https://example.com/id.pdf'
    }
  ];

  return (
    <DocumentViewer 
      documents={documents}
      onBack={handleBack}
    />
  );
};

export default DocumentViewerPage;