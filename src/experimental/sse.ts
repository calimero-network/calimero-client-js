import { getAccessToken } from '../storage/storage';
import { NodeEvent } from '../subscriptions';

const RECONNECT_DELAY = 3000; // 3 seconds (matches SSE_RETRY_TIMEOUT_MS from backend)

type SseCallback = (event: NodeEvent) => void;

/**
 * Experimental SSE (Server-Sent Events) client with automatic reconnection
 *
 * This client provides a simpler API than SseSubscriptionsClient, automatically
 * managing a single connection with session persistence and reconnection.
 *
 * # Event Delivery Model
 *
 * - Sessions persist across reconnections (subscriptions are maintained)
 * - Events are NOT buffered - missed events during disconnection are skipped
 * - Event ID gaps indicate missed events (client should re-query state if needed)
 *
 * # Usage
 *
 * ```typescript
 * const sseClient = new ExperimentalSSE(baseUrl);
 * sseClient.subscribe(['context-id'], (event) => {
 *   console.log('Received event:', event);
 * });
 * ```
 */
export class ExperimentalSSE {
  private eventSource: EventSource | null = null;
  private url: string;
  private subscriptionUrl: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: Map<string, SseCallback> = new Map();
  private sessionId: string | null = null;
  private subscribedContexts: Set<string> = new Set();

  constructor(baseUrl: string) {
    this.url = this.buildSseUrl(baseUrl);
    this.subscriptionUrl = this.buildSubscriptionUrl(baseUrl);
    this.connect();
  }

  private buildSseUrl(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${normalized}/sse`;
  }

  private buildSubscriptionUrl(baseUrl: string): string {
    const normalized = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${normalized}/sse/subscription`;
  }

  private connect(): void {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.warn('No access token found, SSE connection aborted.');
      return;
    }

    const fullUrl = `${this.url}?token=${encodeURIComponent(accessToken)}`;

    try {
      this.eventSource = new EventSource(fullUrl);

      this.eventSource.onopen = () => {
        console.log('SSE connected');
        this.clearReconnect();
      };

      // All events come through 'message' type now (WHATWG standard)
      this.eventSource.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different event types by checking the 'type' field
          if (data.type === 'connect') {
            // Connect event - extract session ID
            const wasReconnect = data.reconnect === true;
            this.sessionId = data.session_id;
            console.log(
              `SSE session ${wasReconnect ? 'restored' : 'established'}: ${data.session_id}`,
            );

            // If this is a new session (not reconnect), resubscribe to contexts
            // Server maintains subscriptions on reconnect, so only resubscribe on new session
            if (!wasReconnect && this.subscribedContexts.size > 0) {
              this.resubscribeAll();
            }
          } else if (data.type === 'close') {
            // Close event from server
            console.log('SSE server closed connection:', data.reason);
            this.eventSource?.close();
            this.scheduleReconnect();
          } else if (data.type === 'error') {
            // Error event from server
            console.error('SSE server error:', data.message);
          } else if (data.result && data.result.contextId) {
            // Regular data event
            const nodeEvent: NodeEvent = data.result;
            this.decodeEventData(nodeEvent);
            const callback = this.callbacks.get(nodeEvent.contextId);
            if (callback) {
              callback(nodeEvent);
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.eventSource?.close();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      this.scheduleReconnect();
    }
  }

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

  private scheduleReconnect(): void {
    this.clearReconnect();
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect SSE...');
      this.connect();
    }, RECONNECT_DELAY);
  }

  private clearReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private async sendSubscriptionRequest(
    method: 'subscribe' | 'unsubscribe',
    contextIds: string[],
  ): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No session ID available. Connection not established.');
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(this.subscriptionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          id: this.sessionId,
          method,
          params: {
            contextIds,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Subscription request failed: ${response.status} ${errorText}`,
        );
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(
          `Subscription ${method} failed: ${JSON.stringify(result.error)}`,
        );
      }

      console.log(`Successfully ${method}d to contexts:`, contextIds);
    } catch (error) {
      console.error(`Failed to ${method} to contexts:`, error);
      throw error;
    }
  }

  private async resubscribeAll(): Promise<void> {
    if (this.subscribedContexts.size === 0) {
      return;
    }

    try {
      await this.sendSubscriptionRequest(
        'subscribe',
        Array.from(this.subscribedContexts),
      );
      console.log('Resubscribed to all contexts after reconnection');
    } catch (error) {
      console.error('Failed to resubscribe after reconnection:', error);
    }
  }

  public async subscribe(
    contextIds: string[],
    callback: SseCallback,
  ): Promise<void> {
    // Store callback for each context
    contextIds.forEach((contextId) => {
      this.callbacks.set(contextId, callback);
      this.subscribedContexts.add(contextId);
    });

    // Send subscription request if connected
    if (this.sessionId) {
      await this.sendSubscriptionRequest('subscribe', contextIds);
    }
  }

  public async unsubscribe(contextIds: string[]): Promise<void> {
    // Remove callbacks
    contextIds.forEach((contextId) => {
      this.callbacks.delete(contextId);
      this.subscribedContexts.delete(contextId);
    });

    // Send unsubscribe request if connected
    if (this.sessionId) {
      await this.sendSubscriptionRequest('unsubscribe', contextIds);
    }
  }

  public close(): void {
    this.clearReconnect();
    this.eventSource?.close();
    this.eventSource = null;
    this.sessionId = null;
  }
}
