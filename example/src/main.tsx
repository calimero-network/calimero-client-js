import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CalimeroProvider, useCalimero } from '../../src/experimental';
import CalimeroConnectButton from '../../src/experimental/CalimeroConnectButton';
import '../../src/styles/palette.css';
import '../../src/experimental/CalimeroLoginModal.css';
import {
  Context,
  ExecutionResponse,
  AppMode,
} from '../../src/experimental/types';
import ExecutionModal from './ExecutionModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, app } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);

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

  const handleExecute = (response: ExecutionResponse) => {
    console.log('Execution Result:', response);
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
                  <li
                    key={ctx.contextId}
                    onClick={() => setSelectedContext(ctx)}
                    style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
                  >
                    Context ID: {ctx.contextId}
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
      {selectedContext && app && (
        <ExecutionModal
          app={app}
          context={selectedContext}
          onClose={() => setSelectedContext(null)}
          onExecute={handleExecute}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <CalimeroProvider
      clientApplicationId="bk13KY5TSTjmp3cptTcmiv26upEPRnhs28pZMx2aByX"
      mode={AppMode.MultiContext}
      applicationPath="https://calimero-only-peers-dev.s3.amazonaws.com/uploads/b092670d7dacc612ec24701c9bbc8001.wasm"
    >
      <AppContent />
    </CalimeroProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
