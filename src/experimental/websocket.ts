import { getAccessToken } from '../storage/storage';
import { NodeEvent } from '../subscriptions';

const RECONNECT_DELAY = 5000; // 5 seconds
const PROTOCOL_NAME = 'calimero-client';
const PROTOCOL_VERSION = '0.1.11';

type WsCallback = (event: NodeEvent) => void;

export class ExperimentalWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private callbacks: Map<string, WsCallback> = new Map();
  private requestId = 0;

  constructor(baseUrl: string) {
    this.url = this.buildUrl(baseUrl);
    this.connect();
  }

  private buildUrl(baseUrl: string): string {
    let wsUrl = '';
    if (baseUrl.startsWith('https://')) {
      wsUrl = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.startsWith('http://')) {
      wsUrl = baseUrl.replace('http://', 'ws://');
    } else {
      wsUrl = `wss://${baseUrl}`;
    }
    return `${wsUrl}/ws`;
  }

  private connect(): void {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.warn('No access token found, WebSocket connection aborted.');
      return;
    }

    const fullUrl = this.url; // Token is no longer in the URL
    const protocol = [`${PROTOCOL_NAME}-v${PROTOCOL_VERSION}`, accessToken]; // Smuggle token
    console.log('Connecting to Experimental WebSocket:', fullUrl);

    this.ws = new WebSocket(fullUrl, protocol);

    this.ws.onopen = () => {
      console.log('Experimental WebSocket connected.');
      this.clearReconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.result && data.result.contextId) {
          const nodeEvent: NodeEvent = data.result;
          this.decodeEventData(nodeEvent);
          const callback = this.callbacks.get(nodeEvent.contextId);
          if (callback) {
            callback(nodeEvent);
          }
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Experimental WebSocket disconnected.');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Experimental WebSocket error:', error);
      this.ws?.close();
    };
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
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, RECONNECT_DELAY);
  }

  private clearReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  public subscribe(contextIds: string[], callback: WsCallback): void {
    contextIds.forEach((contextId) => {
      this.callbacks.set(contextId, callback);
    });
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        id: this.requestId++,
        method: 'subscribe',
        params: { contextIds: contextIds }
      }));
    }
  }

  public unsubscribe(contextIds: string[]): void {
    contextIds.forEach((contextId) => {
      this.callbacks.delete(contextId);
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        id: this.requestId++,
        method: 'unsubscribe',
        params: { contextIds: contextIds }
      }));
    }
  }

  public close(): void {
    this.clearReconnect();
    this.ws?.close();
  }
} 