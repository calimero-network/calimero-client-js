import { ContextId } from '../types/context';

export interface SubscriptionsClient {
  connect(connectionId?: string): Promise<void>;
  disconnect(connectionId?: string): void;
  subscribe(contextIds: string[], connectionId?: string): void;
  unsubscribe(contextIds: string[], connectionId?: string): void;
  addCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void;
  removeCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void;
}

export type NodeEvent = ContextEvent;

export type ContextEvent = ContextEventPayload & {
  contextId: ContextId;
};

type ContextEventPayload = StateMutationPayload | ExecutionEventPayload;

export type StateMutationPayload = {
  type: 'StateMutation';
  data: StateMutation;
};

export type ExecutionEventPayload = {
  type: 'ExecutionEvent';
  data: {
    events: ExecutionEvent[];
  };
};

export interface StateMutation {
  newRoot: string;
}

export interface ExecutionEvent {
  kind: string;
  data: any;
}
