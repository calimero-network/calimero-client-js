// Supported protocols for context creation
export enum Protocol {
  ETHEREUM = 'ethereum',
  ICP = 'icp',
  NEAR = 'near',
  STARKNET = 'starknet',
  STELLAR = 'stellar',
}
export type ProtocolID = Protocol | string;

export enum AppMode {
  MultiContext = 'multi-context',
}

export enum ConnectionType {
  RemoteAndLocal = 'remote-and-local',
  Local = 'local',
  Remote = 'remote',
  Custom = 'custom',
}

export interface CustomConnectionConfig {
  type: ConnectionType.Custom;
  url: string;
}

// Minimal representation of a context
export interface Context {
  contextId: string;
  executorId: string;
  applicationId: string;
}

// Response from executing a method on a context
export interface ExecutionResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Subscription event types
export interface SubscriptionEvent {
  contextId: string;
  type: 'StateMutation' | 'ExecutionEvent';
  data: any;
}

// Interface for the application client
export interface CalimeroApp {
  /**
   * Fetches all contexts available to this application.
   */
  fetchContexts(): Promise<Context[]>;

  /**
   * Executes a method on a specific context.
   * @param context - The target context object.
   * @param method - The name of the method to invoke.
   * @param params - Optional parameters to pass to the method.
   */
  execute(
    context: Context,
    method: string,
    params?: Record<string, unknown>,
  ): Promise<ExecutionResponse>;

  /**
   * Creates a new context for this application.
   * @param protocol - Optional execution layer (e.g., NEAR, ICP, ETH).
   * @param initParams - Optional parameters for context initialization.
   */
  createContext(
    protocol?: ProtocolID,
    initParams?: Record<string, unknown>,
  ): Promise<Context>;

  /**
   * Deletes a specific context.
   * @param context - The context to delete.
   */
  deleteContext(context: Context): Promise<void>;

  /**
   * Subscribes to events for specific contexts.
   * @param contextIds - Array of context IDs to subscribe to.
   * @param callback - Function to call when events are received.
   */
  subscribeToEvents(
    contextIds: string[],
    callback: (event: SubscriptionEvent) => void,
  ): void;

  /**
   * Unsubscribes from events for specific contexts.
   * @param contextIds - Array of context IDs to unsubscribe from.
   */
  unsubscribeFromEvents(contextIds: string[]): void;

  /**
   * Closes the underlying WebSocket connection.
   */
  close(): void;
}
