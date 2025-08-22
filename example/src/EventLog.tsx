import React, { useState } from 'react';
import { SubscriptionEvent } from '@calimero-network/calimero-client';
import './EventLog.css';

interface EventLogProps {
  events: SubscriptionEvent[];
  onClear: () => void;
}

interface EventItemProps {
  event: SubscriptionEvent;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="event-item-container">
      <button
        className="event-item-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className={`event-caret ${isCollapsed ? '' : 'open'}`}>▶</span>
        <span className="event-timestamp">
          {new Date().toLocaleTimeString()}
        </span>
        <span className={`event-type-badge ${event.type}`}>{event.type}</span>
        <span className="event-context-id" title={event.contextId}>
          {event.contextId.substring(0, 15)}...
        </span>
      </button>
      {!isCollapsed && (
        <div className="event-item-body">
          <pre>{JSON.stringify(event, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const EventLog: React.FC<EventLogProps> = ({ events, onClear }) => {
  return (
    <div className="event-log-container">
      <div className="event-log-header">
        <h3>Live Event Log</h3>
        <button onClick={onClear} disabled={events.length === 0}>
          Clear Log
        </button>
      </div>
      <div className="event-log-content">
        {events.length === 0 ? (
          <p className="event-log-placeholder">
            Subscribe to see live events here...
          </p>
        ) : (
          [...events]
            .reverse()
            .map((event, index) => (
              <EventItem key={`${event.contextId}-${index}`} event={event} />
            ))
        )}
      </div>
    </div>
  );
};

export default EventLog;
