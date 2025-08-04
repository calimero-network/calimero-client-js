import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { CalimeroProvider, useCalimero, Context, CalimeroConnectButton, AppMode, SubscriptionEvent } from '@calimero-network/calimero-client';
import { ContractClient } from './generated-client';
import EventLog from './EventLog';
import './EventLog.css';

const AppContent: React.FC = () => {
  const { app, isAuthenticated } = useCalimero();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [subscribedContexts, setSubscribedContexts] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [testResults, setTestResults] = useState<Record<string, {status: string, message: string}>>({});

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

  const runTests = async (context: Context) => {
    if (!app) return;
    setTestResults(prev => ({ ...prev, [context.contextId]: { status: 'running', message: 'Tests are running...' } }));
    const client = new ContractClient(app, context);

    try {
      await client.set({ key: 'test', value: 'hook' });
      const len = await client.len();
      const val = await client.get({ key: 'test' });
      if (val !== 'hook') throw new Error(`Value mismatch! Expected 'hook', got '${val}'`);
      
      setTestResults(prev => ({ ...prev, [context.contextId]: { status: 'success', message: `✅ Passed! Len: ${len}, Val: "${val}"` } }));
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [context.contextId]: { status: 'error', message: `❌ Failed: ${e.message}` } }));
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Codegen Example</h1>
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
                    <button onClick={() => runTests(ctx)} disabled={testResults[ctx.contextId]?.status === 'running'}>
                      Run tests with generated client
                    </button>
                    <button onClick={() => handleToggleSubscription(ctx.contextId)}>
                      {subscribedContexts.has(ctx.contextId) ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  </div>
                  {testResults[ctx.contextId] && (
                    <p style={{ 
                      marginTop: '0.5rem', 
                      color: testResults[ctx.contextId].status === 'error' ? 'red' : 'green' 
                    }}>
                      {testResults[ctx.contextId].message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <EventLog events={events} onClear={() => setEvents([])} />
          </div>
        )}
      </main>
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
