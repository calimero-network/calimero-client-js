import { Axios } from 'axios';
import { AxiosHttpClient, HttpClient } from '../api/httpClient';
import { NodeEvent, SubscriptionsClient } from './subscriptions';

export type SseEventType = 'connect' | 'message' | 'close' | 'error';

const DEFAULT_CONNECTION_ID = 'DEFAULT';

export interface ContextIds {
    contextIds: string[];
}

export interface Request {
    id: string;
    method: 'subscribe' | 'unsubscribe';
    params: ContextIds;
}
export type Response =
    | { body: { result: any } }
    | { body: { error: ServerResponseError | any } };

export type ServerResponseError =
    | { type: 'ParseError'; data: string }
    | { type: 'InternalError'; data?: any };

export interface SseEvent {
    eventType: SseEventType;
    data?: any;
}

export class SseSubscriptionsClient implements SubscriptionsClient {
    private httpClient: HttpClient;
    private readonly url: string;
    private connectionIds: Map<string, string>;
    private connections: Map<string, EventSource>;
    private callbacks: Map<string, Array<(event: NodeEvent) => void>>;

    public constructor(baseUrl: string, path: string) {
        this.url = `${baseUrl}${path}`;
        this.connections = new Map();
        this.callbacks = new Map();
        this.connectionIds = new Map();
        this.httpClient = new AxiosHttpClient(new Axios());
    }

    public connect(connectionId: string = DEFAULT_CONNECTION_ID): Promise<void> {
        const sse = new EventSource(this.url);
        this.connections.set(connectionId, sse);
        this.callbacks.set(connectionId, []);
        let isResolved = false;
        let cId = DEFAULT_CONNECTION_ID;

        return new Promise((resolve, reject) => {
            sse.onerror = (err) => reject(err);
            sse.addEventListener('connect', (event: MessageEvent) => {
                if (isResolved) return;

                cId = event.data;
                if (!cId) {
                    isResolved = true;
                    reject("Connection Couldn't Be established! No connection ID found!");
                } else {
                    this.connectionIds.set(connectionId, cId);
                    isResolved = true;
                    resolve();
                }
            });
            sse.addEventListener('message', (event: MessageEvent) => {
                this.handleMessage(cId, event);
            });
            sse.addEventListener('close', (event: MessageEvent) => {
                this.disconnect(connectionId);
            });
            sse.addEventListener('error', (event: MessageEvent) => {
                console.error(event.data);
            });
        });
    }

    public disconnect(connectionId = DEFAULT_CONNECTION_ID): void {
        const sse = this.connections.get(connectionId);
        if (sse) {
            sse.close();

            this.connectionIds.delete(connectionId);
            this.connections.delete(connectionId);
            this.callbacks.delete(connectionId);
        }
    }

    public async subscribe(
        contextIds: string[],
        connectionId: string = DEFAULT_CONNECTION_ID,
    ): Promise<void> {
        const cId = this.connectionIds.get(connectionId);
        const params: ContextIds = { contextIds: contextIds };
        const data: Request = {
            id: cId,
            method: 'subscribe',
            params: params,
        };
        await this.httpClient.post<Request>(
            `${this.url}/subscription`,
            JSON.stringify(data),
            [{ 'Content-Type': 'application/json' }],
            false,
        );
    }

    public async unsubscribe(
        contextIds: string[],
        connectionId: string = DEFAULT_CONNECTION_ID,
    ): Promise<void> {
        const cId = this.connectionIds.get(connectionId);
        const params: ContextIds = { contextIds: contextIds };
        const data: Request = {
            id: cId,
            method: 'unsubscribe',
            params: params,
        };

        await this.httpClient.post<Request>(
            `${this.url}/subscription`,
            JSON.stringify(data),
            [{ 'Content-Type': 'application/json' }],
            false,
        );
    }

    public addCallback(
        callback: (event: NodeEvent) => void,
        connectionId: string = DEFAULT_CONNECTION_ID,
    ): void {
        if (!this.callbacks.has(connectionId)) {
            this.callbacks.set(connectionId, [callback]);
        } else {
            this.callbacks.get(connectionId).push(callback);
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

    private handleMessage(connectionId: string, event: any): void {
        const response: NodeEvent = JSON.parse(event.data.toString());
        const callbacks = this.callbacks.get(connectionId);
        if (callbacks) {
            for (const callback of callbacks) {
                const nodeEvent: NodeEvent = response;
                callback(nodeEvent);
            }
        }
    }
}