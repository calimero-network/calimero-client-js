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
  JoinContext,
  InviteContext,
} from '@calimero-network/calimero-client';
import ExecutionModal from './ExecutionModal';
import './ContextManagement.css';

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
  const [activeTab, setActiveTab] = useState<'join' | 'invite'>('join');

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
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              backgroundColor: 'white',
              padding: '0.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <CalimeroLogo
              style={{ color: 'black', width: '32px', height: '32px' }}
            />
          </div>
          <h1 style={{ margin: 0, color: '#212529', fontSize: '1.5rem', fontWeight: '600' }}>
            My dApp
          </h1>
        </div>
        <CalimeroConnectButton />
      </header>
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {isAuthenticated ? (
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ margin: 0, color: '#212529', fontSize: '1.25rem', fontWeight: '600' }}>
                Available Contexts
              </h2>
              <button 
                onClick={handleCreateContext} 
                disabled={creating}
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
                }}
              >
                {creating ? 'Creating...' : 'Create New Context'}
              </button>
            </div>
            {loading && (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#6c757d',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Loading contexts...
              </div>
            )}
            {error && (
              <div style={{ 
                padding: '1rem', 
                background: '#f8d7da', 
                color: '#721c24', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                border: '1px solid #f5c6cb'
              }}>
                Error: {error}
              </div>
            )}
            {contexts.length > 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                {contexts.map((ctx) => (
                  <div
                    key={ctx.contextId}
                    onClick={() => setSelectedContext(ctx)}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '1rem 1.5rem',
                      borderBottom: '1px solid #e9ecef',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#007bff'
                    }} />
                    <span style={{ color: '#495057', fontWeight: '500' }}>
                      Context ID: {ctx.contextId}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#6c757d',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  No contexts found.
                </div>
              )
            )}
          </div>
        ) : (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: '#6c757d',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#212529' }}>
              Welcome to My dApp
            </h2>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>
              Please connect to see your contexts and start using the application.
            </p>
          </div>
        )}
        {isAuthenticated && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              color: '#212529', 
              fontSize: '1.25rem', 
              fontWeight: '600' 
            }}>
              Blob Storage
            </h2>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px dashed #dee2e6',
                  borderRadius: '8px',
                  background: '#f8f9fa',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              />
              {uploading && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: '#e3f2fd', 
                  color: '#1976d2', 
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  Uploading...
                </div>
              )}
              {blobs.length > 0 ? (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '1rem' }}>
                    Uploaded Files:
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {blobs.map((blob) => (
                      <div key={blob.blobId} style={{
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        color: '#495057'
                      }}>
                        {blob.blobId}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  textAlign: 'center', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  No blobs found.
                </div>
              )}
            </div>
          </div>
        )}
        {isAuthenticated && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              color: '#212529', 
              fontSize: '1.25rem', 
              fontWeight: '600' 
            }}>
              Real-time Events
            </h2>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {events.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {events.map((event, index) => (
                    <div key={index} style={{
                      padding: '0.75rem',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      color: '#495057',
                      wordBreak: 'break-all'
                    }}>
                      {JSON.stringify(event, null, 2)}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  padding: '1rem', 
                  textAlign: 'center', 
                  color: '#6c757d',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  No events received yet.
                </div>
              )}
            </div>
          </div>
        )}
        {isAuthenticated && (
          <div className="context-management">
            <h2>Context Management</h2>
            <div className="tab-buttons">
              <button
                onClick={() => setActiveTab('join')}
                className={`tab-button ${activeTab === 'join' ? 'active' : ''}`}
              >
                Join Context
              </button>
              <button
                onClick={() => setActiveTab('invite')}
                className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
              >
                Invite to Context
              </button>
            </div>
            <div className="tab-content">
              {activeTab === 'join' ? <JoinContext /> : <InviteContext />}
            </div>
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
