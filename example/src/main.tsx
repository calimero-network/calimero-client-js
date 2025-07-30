import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalimeroProvider,
  useCalimero,
} from '../../src/experimental/CalimeroProvider';
import CalimeroConnectButton from '../../src/experimental/CalimeroConnectButton';
import '../../src/experimental/CalimeroLoginModal.css';
import '../../src/styles/palette.css';
import { Context } from '../../src/experimental/app';

const AppContent: React.FC = () => {
  const { isAuthenticated, app } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContexts = useCallback(async () => {
    if (app) {
      try {
        setLoading(true);
        const contexts = await app.fetchContexts();
        setContexts(contexts);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch contexts.');
      } finally {
        setLoading(false);
      }
    }
  }, [app]);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  const handleCreateContext = async () => {
    if (app) {
      try {
        setCreating(true);
        setError(null);
        const newContext = await app.createContext();
        setContexts((prevContexts) => [...prevContexts, newContext]);
      } catch (err: any) {
        setError(err.message || 'Failed to create context.');
      } finally {
        setCreating(false);
      }
    }
  };

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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2>Available Contexts:</h2>
              <button onClick={handleCreateContext} disabled={creating}>
                {creating ? 'Creating...' : 'Create New Context'}
              </button>
            </div>
            {loading && <p>Loading contexts...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {contexts.length > 0 ? (
              <ul>
                {contexts.map((ctx) => (
                  <li key={ctx.contextId}>
                    Context ID: {ctx.contextId}, Executor ID: {ctx.executorId}
                  </li>
                ))}
              </ul>
            ) : (
              !loading && <p>No contexts found.</p>
            )}
          </div>
        ) : (
          <p>Please connect to see your contexts.</p>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <CalimeroProvider
      clientApplicationId="2ZVJfjnXzB2bQjUz6hTejA4fE2YbxoEPGUPEG9o8DgMR"
      permissions={['context:execute', 'application']}
      applicationPath="https://calimero-only-peers-dev.s3.amazonaws.com/uploads/053680f6954d2f6c3f5491a7aae5bc41.wasm"
    >
      <AppContent />
    </CalimeroProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
