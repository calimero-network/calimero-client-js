import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalimeroProvider,
  useCalimero,
} from '../../src/experimental/CalimeroProvider';
import CalimeroConnectButton from '../../src/experimental/CalimeroConnectButton';
import '../../src/experimental/CalimeroLoginModal.css';
import '../../src/styles/palette.css';
import { InstalledApplication } from '../../src/api/nodeApi';

const AppContent: React.FC = () => {
  const { isAuthenticated, client } = useCalimero();
  const [applications, setApplications] = useState<InstalledApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      const fetchApps = async () => {
        try {
          setLoading(true);
          const response = await client.node().getInstalledApplications();
          if (response.error) {
            setError(response.error.message);
          } else {
            setApplications(response.data.apps);
          }
        } catch (err) {
          setError('Failed to fetch applications.');
        } finally {
          setLoading(false);
        }
      };
      fetchApps();
    }
  }, [client]);

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
        }}
      >
        <h1>My dApp</h1>
        <CalimeroConnectButton />
      </header>
      <main>
        {isAuthenticated ? (
          <div>
            <h2>Installed Applications:</h2>
            {loading && <p>Loading applications...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {applications.length > 0 ? (
              <ul>
                {applications.map((app) => (
                  <li key={app.id}>{app.id}</li>
                ))}
              </ul>
            ) : (
              !loading && <p>No applications installed.</p>
            )}
          </div>
        ) : (
          <p>Please connect to see your applications.</p>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <CalimeroProvider
      clientApplicationId="4E2WejHpXRY1EMhvfiaCthZrAfzszv7HmEQ8Sugrr3XH"
      permissions={['context:execute', 'application']}
      applicationPath="https://calimero-only-peers-dev.s3.amazonaws.com/uploads/a02e562d4e7916570ddf2244d43b284e.wasm"
    >
      <AppContent />
    </CalimeroProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
