import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import {
  CalimeroProvider,
  useCalimero,
  CalimeroConnectButton,
  CalimeroLogo,
  Context,
  ExecutionResponse,
  AppMode,
  BlobInfo,
  NodeEvent,
} from '@calimero-network/calimero-client';
import ExecutionModal from './ExecutionModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, app } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [blobs, setBlobs] = useState<BlobInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<NodeEvent[]>([]);

  useEffect(() => {
    if (app) {
      const handleEvent = (event: NodeEvent) => {
        setEvents((prevEvents) => [...prevEvents, event]);
      };

      app.addCallback(handleEvent);
      app.connect();

      return () => {
        app.removeCallback(handleEvent);
        app.disconnect();
      };
    }
  }, [app]);

  useEffect(() => {
    if (app && contexts.length > 0) {
      app.subscribe(contexts);
    }
  }, [app, contexts]);

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

  const fetchBlobs = useCallback(async () => {
    if (app) {
      try {
        const blobList = await app.listBlobs();
        setBlobs(blobList.blobs);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch blobs.');
      }
    }
  }, [app]);

  useEffect(() => {
    fetchContexts();
    fetchBlobs();
  }, [fetchContexts, fetchBlobs]);

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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && app) {
      try {
        setUploading(true);
        setError(null);
        await app.uploadBlob(file);
        fetchBlobs(); // Refresh blob list
      } catch (err: any) {
        setError(err.message || 'Failed to upload file.');
      } finally {
        setUploading(false);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: 'white',
              padding: '0.5rem',
              borderRadius: '8px',
            }}
          >
            <CalimeroLogo
              style={{ color: 'black', width: '32px', height: '32px' }}
            />
          </div>
          <h1>My dApp</h1>
        </div>
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
        {isAuthenticated && (
          <div>
            <h2>Blob Storage</h2>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            {blobs.length > 0 ? (
              <ul>
                {blobs.map((blob) => (
                  <li key={blob.blobId}>{blob.blobId}</li>
                ))}
              </ul>
            ) : (
              <p>No blobs found.</p>
            )}
          </div>
        )}
        {isAuthenticated && (
          <div>
            <h2>Real-time Events</h2>
            {events.length > 0 ? (
              <ul>
                {events.map((event, index) => (
                  <li key={index}>{JSON.stringify(event)}</li>
                ))}
              </ul>
            ) : (
              <p>No events received yet.</p>
            )}
          </div>
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
