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
  SubscriptionEvent,
} from '@calimero-network/calimero-client';
import ExecutionModal from './ExecutionModal';
import EventLog from './EventLog';

const AppContent: React.FC = () => {
  const { isAuthenticated, app } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [subscribedContexts, setSubscribedContexts] = useState<Set<string>>(
    new Set(),
  );
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);

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

  const eventCallback = useCallback((event: SubscriptionEvent) => {
    setEvents((prevEvents) => [event, ...prevEvents]);
  }, []);

  const handleToggleSubscription = useCallback(
    async (contextId: string) => {
      if (!app) return;
      const newSubscribed = new Set(subscribedContexts);
      const isSubscribed = newSubscribed.has(contextId);

      if (isSubscribed) {
        newSubscribed.delete(contextId);
        app.unsubscribeFromEvents([contextId]);
      } else {
        newSubscribed.add(contextId);
        app.subscribeToEvents([contextId], eventCallback);
      }
      setSubscribedContexts(newSubscribed);
    },
    [app, subscribedContexts, eventCallback],
  );

  const handleToggleAllSubscriptions = useCallback(async () => {
    if (!app || contexts.length === 0) return;
    const allContextIds = contexts.map((c) => c.contextId);
    const allCurrentlySubscribed = subscribedContexts.size === contexts.length;

    if (allCurrentlySubscribed) {
      app.unsubscribeFromEvents(allContextIds);
      setSubscribedContexts(new Set());
    } else {
      app.subscribeToEvents(allContextIds, eventCallback);
      setSubscribedContexts(new Set(allContextIds));
    }
  }, [app, contexts, subscribedContexts, eventCallback]);

  const handleExecute = (response: ExecutionResponse) => {
    console.log('Execution Result:', response);
  };

  const areAllSubscribed =
    contexts.length > 0 && subscribedContexts.size === contexts.length;

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
              <div>
                <button
                  onClick={handleToggleAllSubscriptions}
                  disabled={contexts.length === 0}
                  className={
                    areAllSubscribed ? 'unsubscribe-button' : 'subscribe-button'
                  }
                  style={{ marginRight: '1rem' }}
                >
                  {areAllSubscribed ? 'Unsubscribe from All' : 'Subscribe to All'}
                </button>
                <button onClick={handleCreateContext} disabled={creating}>
                  {creating ? 'Creating...' : 'Create New Context'}
                </button>
              </div>
            </div>
            {loading && <p>Loading contexts...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {contexts.length > 0 ? (
              <ul>
                {contexts.map((ctx) => (
                  <li
                    key={ctx.contextId}
                    style={{
                      cursor: 'pointer',
                      marginBottom: '0.5rem',
                      padding: '0.5rem',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Context ID: {ctx.contextId}</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleToggleSubscription(ctx.contextId)}
                        className={
                          subscribedContexts.has(ctx.contextId)
                            ? 'unsubscribe-button'
                            : 'subscribe-button'
                        }
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        {subscribedContexts.has(ctx.contextId)
                          ? 'Unsubscribe'
                          : 'Subscribe'}
                      </button>
                      <button
                        onClick={() => setSelectedContext(ctx)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                        }}
                      >
                        Execute
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              !loading && <p>No contexts found.</p>
            )}
            <EventLog events={events} onClear={() => setEvents([])} />
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
