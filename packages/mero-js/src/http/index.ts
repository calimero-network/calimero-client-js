// HTTP client types and interfaces
export * from './types';

// Web Standards HTTP client implementation
export { WebHttpClient, HTTPError } from './web-client';

// Factory functions for easy client creation
export {
  createHttpClient,
  createBrowserHttpClient,
  createNodeHttpClient,
  createUniversalHttpClient,
} from './factory';

// Retry functionality
export { withRetry, createRetryableMethod } from './retry';
export type { RetryOptions } from './retry';

// Legacy Axios client (commented out during Web Standards migration)
// export { AxiosHttpClient } from './axios-client';
