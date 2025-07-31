import { NodeEvent } from '../subscriptions/subscriptions';

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

  uploadBlob(
    file: File,
    onProgress?: (p: number) => void,
  ): Promise<{ blobId: string }>;
  downloadBlob(blobId: string): Promise<Blob>;
  listBlobs(): Promise<any>;
  deleteBlob(blobId: string): Promise<void>;

  // Subscription methods
  connect(connectionId?: string): Promise<void>;
  disconnect(connectionId?: string): void;
  subscribe(contexts: Context[], connectionId?: string): void;
  unsubscribe(contexts: Context[], connectionId?: string): void;
  addCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void;
  removeCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void;
}
