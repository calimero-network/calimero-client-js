import { WebHttpClient } from './web-client';
import { Transport, HttpClient } from './types';

// Factory function to create HTTP client with sensible defaults
export function createHttpClient(transport: Transport): HttpClient {
  return new WebHttpClient(transport);
}

// Factory function for browser environments
export function createBrowserHttpClient(options: {
  baseUrl: string;
  getAuthToken?: () => Promise<string | undefined>;
  onTokenRefresh?: (newToken: string) => Promise<void>;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
  defaultAbortSignal?: AbortSignal;
}): HttpClient {
  const transport: Transport = {
    fetch: globalThis.fetch,
    baseUrl: options.baseUrl,
    getAuthToken: options.getAuthToken,
    onTokenRefresh: options.onTokenRefresh,
    defaultHeaders: options.defaultHeaders,
    timeoutMs: options.timeoutMs,
    credentials: options.credentials ?? 'same-origin',
    defaultAbortSignal: options.defaultAbortSignal,
  };

  return createHttpClient(transport);
}

// Factory function for Node.js environments
export function createNodeHttpClient(options: {
  baseUrl: string;
  fetch?: typeof fetch; // Allow injection of undici.fetch or other fetch implementations
  getAuthToken?: () => Promise<string | undefined>;
  onTokenRefresh?: (newToken: string) => Promise<void>;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
  defaultAbortSignal?: AbortSignal;
}): HttpClient {
  // Use provided fetch or try to use global fetch (Node 18+)
  const fetchImpl = options.fetch ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error(
      'No fetch implementation available. Please provide a fetch implementation ' +
        '(e.g., undici.fetch) or use Node.js 18+ which has native fetch support.',
    );
  }

  const transport: Transport = {
    fetch: fetchImpl,
    baseUrl: options.baseUrl,
    getAuthToken: options.getAuthToken,
    onTokenRefresh: options.onTokenRefresh,
    defaultHeaders: options.defaultHeaders,
    timeoutMs: options.timeoutMs,
    credentials: options.credentials, // Node.js doesn't have default credentials
    defaultAbortSignal: options.defaultAbortSignal,
  };

  return createHttpClient(transport);
}

// Universal factory that works in both environments
export function createUniversalHttpClient(options: {
  baseUrl: string;
  fetch?: typeof fetch;
  getAuthToken?: () => Promise<string | undefined>;
  onTokenRefresh?: (newToken: string) => Promise<void>;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
  defaultAbortSignal?: AbortSignal;
}): HttpClient {
  // Try to detect environment and use appropriate factory
  if (typeof window !== 'undefined') {
    // Browser environment
    return createBrowserHttpClient(options);
  } else {
    // Node.js environment
    return createNodeHttpClient(options);
  }
}
