import React, { useState } from 'react';
import { SubscriptionEvent } from '@calimero-network/calimero-client';

interface EventLogProps {
  events: SubscriptionEvent[];
  onClear: () => void;
}

const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="event-log-container">
      <div className="event-log-header">
        <h3 onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
          {isCollapsed ? '▶' : '▼'} Event Log ({events.length})
        </h3>
        <button onClick={onClear} disabled={events.length === 0}>Clear Log</button>
      </div>
      {!isCollapsed && (
        <div className="event-log-content">
          {events.length === 0 ? (
            <p>No events received yet. Subscribe to a context and execute a method to see events.</p>
          ) : (
            <ul>
              {events.map((event, index) => (
                <li key={index} className="event-item">
                  <pre>{JSON.stringify(event, null, 2)}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default EventLog; 