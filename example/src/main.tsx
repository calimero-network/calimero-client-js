import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ClientLogin, SetupModal } from '@calimero-network/calimero-client';

function App() {
  const [nodeUrl, setNodeUrl] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  if (showSetup) {
    return (
      <SetupModal
        setNodeServerUrl={(url) => {
          setNodeUrl(url);
          setShowSetup(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ClientLogin
        permissions={[]}
        authMode={true}
        setIsAuthenticated={setIsAuthenticated}
        clientApplicationId="calimero-sdk-example"
        clientApplicationPath="/"
        fetchContextApplication={() => {}}
        onReset={() => {
          setShowSetup(true);
        }}
      />
    );
  }

  return <h1>Logged In!</h1>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
