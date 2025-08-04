import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CalimeroProvider, useCalimero, Context, CalimeroConnectButton, AppMode, SubscriptionEvent, ExecutionResponse } from '@calimero-network/calimero-client';
import EventLog from './EventLog';
import './EventLog.css';
import ExecutionModal from './ExecutionModal';
import CalimeroLogo from '../../src/experimental/CalimeroLogo';

const AppContent: React.FC = () => {
  const { app, isAuthenticated } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [subscribedContexts, setSubscribedContexts] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);

  useEffect(() => {
    const fetchContexts = async () => {
      if (app) {
        const fetchedContexts = await app.fetchContexts();
        setContexts(fetchedContexts);
      }
    };
    if (isAuthenticated) {
      fetchContexts();
    }
  }, [app, isAuthenticated]);

  const eventCallback = useCallback((event: SubscriptionEvent) => {
    setEvents((prevEvents) => [event, ...prevEvents]);
  }, []);
  
  const handleToggleSubscription = useCallback((contextId: string) => {
    if (!app) return;
    const newSubscribed = new Set(subscribedContexts);
    if (newSubscribed.has(contextId)) {
      newSubscribed.delete(contextId);
      app.unsubscribeFromEvents([contextId]);
    } else {
      newSubscribed.add(contextId);
      app.subscribeToEvents([contextId], eventCallback);
    }
    setSubscribedContexts(newSubscribed);
  }, [app, subscribedContexts, eventCallback]);

  const handleExecute = (response: ExecutionResponse) => {
    console.log('Execution Result:', response);
    const event: SubscriptionEvent = {
      contextId: selectedContext?.contextId || 'unknown',
      type: 'ExecutionEvent',
      data: response
    };
    setEvents(prev => [event, ...prev]);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CalimeroLogo style={{ width: '40px', height: '40px' }} />
          <h1>Dynamic Example</h1>
        </div>
        <CalimeroConnectButton />
      </header>
      
      <main>
        {!isAuthenticated ? (
          <p>Please connect your wallet to see available contexts.</p>
        ) : (
          <div>
            <h2>Available Contexts</h2>
            {contexts.length === 0 && <p>Loading contexts or none found...</p>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {contexts.map(ctx => (
                <li key={ctx.contextId} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
                  <p><strong>Context ID:</strong> {ctx.contextId}</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => setSelectedContext(ctx)}>
                      Execute Method
                    </button>
                    <button onClick={() => handleToggleSubscription(ctx.contextId)}>
                      {subscribedContexts.has(ctx.contextId) ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <EventLog events={events} onClear={() => setEvents([])} />
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CalimeroProvider
      clientApplicationId="YOUR_CLIENT_APP_ID"
      applicationPath="YOUR_API_ENDPOINT"
      mode={AppMode.MultiContext}
    >
      <AppContent />
    </CalimeroProvider>
  </React.StrictMode>
);
