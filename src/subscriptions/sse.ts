import { SubscriptionsClient, NodeEvent } from './subscriptions';
import { getAccessToken } from '../storage/storage';

const DEFAULT_CONNECTION_ID = 'DEFAULT';

interface SseRequestPayload {
  id: string;
  method: string;
  params: {
    contextIds: string[];
  };
}

interface SseResponse {
  result?: any;
  error?: {
    type?: string;
    data?: any;
  };
}

/**
 * SSE (Server-Sent Events) client for real-time event subscriptions
 *
 * # Event Delivery Model
 *
 * This client implements a **skip-on-disconnect** approach:
 * - ✅ Sessions persist across reconnections (subscriptions, event counter)
 * - ✅ Event IDs are sequential and monotonically increasing per session
 * - ❌ Events are **NOT buffered** - they only go to active connections
 * - ❌ Events occurring during disconnection are **permanently skipped**
 *
 * When clients reconnect:
 * 1. Session state is restored (subscriptions, counter position)
 * 2. New events continue from the current counter value
 * 3. Event ID gaps indicate missed events during disconnection
 * 4. Clients should re-query application state to handle gaps if needed
 *
 * # Usage
 *
 * ```typescript
 * const client = new SseSubscriptionsClient(baseUrl, '/sse');
 * await client.connect();
 * client.subscribe(['context-id']);
 * client.addCallback((event) => console.log('Event:', event));
 * ```
 */
export class SseSubscriptionsClient implements SubscriptionsClient {
  private readonly baseUrl: string;
  private readonly ssePath: string;
  private readonly subscriptionPath: string;
  private eventSources: Map<string, EventSource>;
  private callbacks: Map<string, Array<(event: NodeEvent) => void>>;
  private sessionIds: Map<string, string>;
  private reconnectTimeouts: Map<string, NodeJS.Timeout>;
  private readonly reconnectDelay: number = 3000; // Match backend SSE_RETRY_TIMEOUT_MS

  public constructor(baseUrl: string, ssePath: string = '/sse') {
    this.baseUrl = baseUrl;
    this.ssePath = ssePath;
    this.subscriptionPath = `${ssePath}/subscription`;
    this.eventSources = new Map();
    this.callbacks = new Map();
    this.sessionIds = new Map();
    this.reconnectTimeouts = new Map();
  }

  public connect(connectionId: string = DEFAULT_CONNECTION_ID): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.ssePath, this.baseUrl).toString();
        const accessToken = getAccessToken();

        if (!accessToken) {
          reject(new Error('No access token found'));
          return;
        }

        // Add authentication token as query parameter
        const urlWithAuth = `${url}?token=${encodeURIComponent(accessToken)}`;

        const eventSource = new EventSource(urlWithAuth);

        this.eventSources.set(connectionId, eventSource);
        this.callbacks.set(connectionId, []);

        // Track if we've received the session ID yet
        let sessionReceived = false;

        eventSource.onopen = (openEvent) => {
          // Extract session ID from response headers
          // Note: EventSource doesn't expose response headers directly in browser
          // We'll get it from the first message event instead
          console.log(`SSE connection opened for ${connectionId}`);
          this.clearReconnectTimeout(connectionId);
        };

        eventSource.onerror = (error) => {
          console.error(`SSE connection error for ${connectionId}:`, error);

          // Don't reject immediately - schedule reconnection
          this.scheduleReconnect(connectionId);

          // Only reject on first connection attempt
          if (!sessionReceived) {
            reject(error);
          }
        };

        // All events come through 'message' type now (WHATWG standard)
        eventSource.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different event types by checking the 'type' field
            if (data.type === 'connect') {
              // Connect event - extract session ID
              this.sessionIds.set(connectionId, data.session_id);
              sessionReceived = true;
              console.log(
                `SSE session ${data.reconnect ? 'restored' : 'established'}: ${data.session_id} for connection: ${connectionId}`,
              );
              
              // Resolve on first connect
              if (!data.reconnect) {
                resolve();
              }
            } else if (data.type === 'close') {
              // Close event from server
              console.log(
                `Server closed connection for ${connectionId}:`,
                data.reason,
              );
              this.disconnect(connectionId);
            } else if (data.type === 'error') {
              // Error event from server
              console.error(`Server error for ${connectionId}:`, data.message);
            } else {
              // Regular data event
              this.handleMessage(connectionId, data);
            }
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(connectionId: string = DEFAULT_CONNECTION_ID): void {
    const eventSource = this.eventSources.get(connectionId);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(connectionId);
    }

    this.clearReconnectTimeout(connectionId);
    // Keep callbacks and sessionId for potential reconnection
  }

  public async subscribe(
    contextIds: string[],
    connectionId: string = DEFAULT_CONNECTION_ID,
  ): Promise<void> {
    const sessionId = this.sessionIds.get(connectionId);
    if (!sessionId) {
      throw new Error(
        `No session ID found for connection ${connectionId}. Please connect first.`,
      );
    }

    await this.sendSubscriptionRequest(sessionId, 'subscribe', contextIds);
  }

  public async unsubscribe(
    contextIds: string[],
    connectionId: string = DEFAULT_CONNECTION_ID,
  ): Promise<void> {
    const sessionId = this.sessionIds.get(connectionId);
    if (!sessionId) {
      throw new Error(
        `No session ID found for connection ${connectionId}. Please connect first.`,
      );
    }

    await this.sendSubscriptionRequest(sessionId, 'unsubscribe', contextIds);
  }

  public addCallback(
    callback: (event: NodeEvent) => void,
    connectionId: string = DEFAULT_CONNECTION_ID,
  ): void {
    if (!this.callbacks.has(connectionId)) {
      this.callbacks.set(connectionId, [callback]);
    } else {
      this.callbacks.get(connectionId)!.push(callback);
    }
  }

  public removeCallback(
    callback: (event: NodeEvent) => void,
    connectionId: string = DEFAULT_CONNECTION_ID,
  ): void {
    const callbacks = this.callbacks.get(connectionId);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private async sendSubscriptionRequest(
    sessionId: string,
    method: 'subscribe' | 'unsubscribe',
    contextIds: string[],
  ): Promise<void> {
    const url = new URL(this.subscriptionPath, this.baseUrl).toString();
    const accessToken = getAccessToken();

    const payload: SseRequestPayload = {
      id: sessionId,
      method,
      params: {
        contextIds,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Subscription request failed: ${response.status} ${errorText}`,
        );
      }

      const result: SseResponse = await response.json();

      if (result.error) {
        console.error(`Subscription ${method} error:`, result.error);
        throw new Error(
          `Subscription ${method} failed: ${JSON.stringify(result.error)}`,
        );
      }

      console.log(`Successfully ${method}d to contexts:`, contextIds);
    } catch (error) {
      console.error(`Failed to ${method}:`, error);
      throw error;
    }
  }

  private handleMessage(connectionId: string, data: any): void {
    try {
      // Data is already parsed JSON object
      const response: SseResponse = data;

      if (response.error) {
        console.error(`SSE event error for ${connectionId}:`, response.error);
        return;
      }

      if (!response.result) {
        return;
      }

      const callbacks = this.callbacks.get(connectionId);
      if (callbacks) {
        const nodeEvent: NodeEvent = response.result;
        this.decodeEventData(nodeEvent);

        for (const callback of callbacks) {
          try {
            callback(nodeEvent);
          } catch (error) {
            console.error('Error in SSE callback:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to handle SSE message:', error);
    }
  }

  /**
   * Decode event data that may be encoded as byte arrays
   * This matches the behavior from the experimental WebSocket client
   */
  private decodeEventData(nodeEvent: NodeEvent): void {
    if (
      nodeEvent.type === 'ExecutionEvent' &&
      nodeEvent.data &&
      Array.isArray(nodeEvent.data.events)
    ) {
      nodeEvent.data.events.forEach((executionEvent) => {
        if (
          Array.isArray(executionEvent.data) &&
          executionEvent.data.every((item) => typeof item === 'number')
        ) {
          try {
            const decodedString = new TextDecoder().decode(
              new Uint8Array(executionEvent.data),
            );
            try {
              executionEvent.data = JSON.parse(decodedString);
            } catch (jsonError) {
              executionEvent.data = decodedString;
            }
          } catch (decodeError) {
            console.error(
              'Failed to decode event data byte array',
              decodeError,
            );
          }
        }
      });
    }
  }

  private scheduleReconnect(connectionId: string): void {
    // Clear any existing timeout
    this.clearReconnectTimeout(connectionId);

    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect SSE for ${connectionId}...`);
      this.reconnect(connectionId);
    }, this.reconnectDelay);

    this.reconnectTimeouts.set(connectionId, timeout);
  }

  private clearReconnectTimeout(connectionId: string): void {
    const timeout = this.reconnectTimeouts.get(connectionId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(connectionId);
    }
  }

  private async reconnect(connectionId: string): Promise<void> {
    try {
      // Keep the session ID for reconnection
      await this.connect(connectionId);
      console.log(`Successfully reconnected SSE for ${connectionId}`);

      // Note: Subscriptions are persisted on the server side
      // The server will restore them when we reconnect with the same session ID
    } catch (error) {
      console.error(`Failed to reconnect SSE for ${connectionId}:`, error);
      // Will try again on next scheduled reconnect
    }
  }
}
