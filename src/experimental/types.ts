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
  SingleContext = 'single-context',
  Admin = 'admin',
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

/**
 * Package-based application configuration (recommended)
 *
 * Uses package names from the Calimero registry for stable, human-readable identifiers.
 * The registry provides the application manifest including the WASM artifact URL.
 *
 * Example:
 * ```tsx
 * <CalimeroProvider
 *   packageName="network.calimero.meropass"
 *   packageVersion="1.0.0"  // Optional: defaults to latest
 *   registryUrl="http://localhost:8082"  // Optional: defaults to production
 *   mode={AppMode.MultiContext}
 * >
 * ```
 */
export interface PackageBasedApp {
  /** Package name in reverse DNS format (e.g., 'network.calimero.meropass') */
  packageName: string;
  /** Optional specific version. Defaults to latest if not provided. */
  packageVersion?: string;
  /**
   * Optional registry URL for fetching package manifests.
   * Defaults to production registry: https://mero-registry.vercel.app/api
   * Override for development/testing: http://localhost:8082
   */
  registryUrl?: string;
  // Explicitly exclude legacy props
  clientApplicationId?: never;
  applicationPath?: never; // Path comes from registry manifest
}

/**
 * Legacy application ID configuration
 *
 * Uses hash-based application IDs with direct WASM URLs.
 * Maintained for backwards compatibility with existing applications.
 *
 * ⚠️ New applications should use PackageBasedApp instead.
 *
 * Example:
 * ```tsx
 * <CalimeroProvider
 *   clientApplicationId="bk13KY5TSTjmp3cptTcmiv26upEPRnhs28pZMx2aByX"
 *   applicationPath="https://example.com/app.wasm"
 *   mode={AppMode.MultiContext}
 * >
 * ```
 */
export interface LegacyAppId {
  /** Hash-based application ID */
  clientApplicationId: string;
  /** Required: Direct URL or path to WASM artifact */
  applicationPath: string;
  // Explicitly exclude package props
  packageName?: never;
  packageVersion?: never;
  registryUrl?: never;
}

/**
 * Admin mode configuration
 *
 * Requests admin-level access to the node without installing any application.
 * Use this for node management tools, admin dashboards, or full-access utilities.
 *
 * ⚠️ Admin permissions grant unrestricted control over the node.
 * Only use for trusted administrative interfaces.
 *
 * Example:
 * ```tsx
 * <CalimeroProvider mode={AppMode.Admin}>
 *   <AdminDashboard />
 * </CalimeroProvider>
 * ```
 */
export interface AdminModeConfig {
  mode: AppMode.Admin;
  // Explicitly exclude all application props
  packageName?: never;
  packageVersion?: never;
  registryUrl?: never;
  clientApplicationId?: never;
  applicationPath?: never;
}

/**
 * Non-admin modes require an application to be specified
 */
export interface NonAdminModeConfig {
  mode: AppMode.SingleContext | AppMode.MultiContext;
}

/**
 * Application configuration - discriminated union ensures valid prop combinations
 *
 * Valid combinations:
 * 1. Package-based + SingleContext/MultiContext
 * 2. Legacy App ID + SingleContext/MultiContext
 * 3. Admin mode (no application)
 *
 * TypeScript will prevent invalid combinations like:
 * - packageName + clientApplicationId (can't mix approaches)
 * - packageName + applicationPath (path comes from registry)
 * - Admin mode + any application props (admin doesn't need apps)
 */
export type AppConfig =
  | (PackageBasedApp & NonAdminModeConfig)
  | (LegacyAppId & NonAdminModeConfig)
  | AdminModeConfig;

/**
 * Event streaming mode for real-time subscriptions
 */
export enum EventStreamMode {
  /**
   * WebSocket-based event streaming
   * - Bidirectional communication
   * - Lower latency
   * - Requires WebSocket support
   */
  WebSocket = 'websocket',

  /**
   * SSE (Server-Sent Events) based streaming
   * - Unidirectional (server to client)
   * - HTTP-based, better firewall compatibility
   * - Automatic reconnection built-in
   * - Session persistence across reconnections
   */
  SSE = 'sse',
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
   * Closes the underlying event stream connection (WebSocket or SSE).
   */
  close(): void;
}
