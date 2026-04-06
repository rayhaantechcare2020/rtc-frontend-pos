import React, { useState, useEffect } from 'react';

const SimpleConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [message, setMessage] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('testing');
    setMessage('Testing connection...');
    
    try {
      console.log('Testing connection to:', apiUrl);
      const response = await fetch(`${apiUrl}/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      const data = await response.json();
      console.log('Connection test response:', data);
      
      setStatus('connected');
      setMessage(`✅ Connected to ${apiUrl}`);
    } catch (error) {
      console.error('Connection test failed:', error);
      setStatus('failed');
      setMessage(`❌ Cannot connect to ${apiUrl}\nError: ${error.message}`);
    }
  };

  const changeUrl = () => {
    const newUrl = prompt('Enter API URL (e.g., http://localhost:8000/api):', apiUrl);
    if (newUrl) {
      setApiUrl(newUrl);
      setTimeout(() => testConnection(), 100);
    }
  };

  if (status === 'connected') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: '#48bb78',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999,
        cursor: 'pointer'
      }}
      onClick={changeUrl}
      title="Click to change API URL">
        ✅ Connected: {apiUrl}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#f56565',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      cursor: 'pointer'
    }}
    onClick={testConnection}
    title="Click to retry">
      {message}
    </div>
  );
};

export default SimpleConnectionTest;