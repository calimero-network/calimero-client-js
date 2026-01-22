/**
 * @fileoverview HTTP Client - Now uses mero-js under the hood
 *
 * This file re-exports the HttpClient adapter that wraps mero-js's HTTP client.
 * This eliminates code duplication by using mero-js as the underlying implementation.
 */

// Re-export types and adapter from httpClientAdapter
// Re-export for backwards compatibility - FetchHttpClient now uses MeroHttpClientAdapter
import { MeroHttpClientAdapter } from './httpClientAdapter';

// Keep AxiosHttpClient for backwards compatibility (deprecated)
import type { HttpClient } from './httpClientAdapter';

export type {
  Header,
  ProgressCallback,
  HeadResponse,
  RequestOptions,
  HttpClient,
} from './httpClientAdapter';

export { MeroHttpClientAdapter } from './httpClientAdapter';
/**
 * @deprecated FetchHttpClient is deprecated. Use MeroHttpClientAdapter instead.
 * For backwards compatibility, FetchHttpClient is now an alias for MeroHttpClientAdapter.
 */
export const FetchHttpClient = MeroHttpClientAdapter;
export class AxiosHttpClient implements HttpClient {
  // This class is kept for backwards compatibility but should not be used
  // It will throw an error if someone tries to use it
  constructor() {
    throw new Error(
      'AxiosHttpClient is deprecated. Use MeroHttpClientAdapter instead.',
    );
  }

  async get<T>(): Promise<import('../types/api-response').ResponseData<T>> {
    throw new Error('AxiosHttpClient is deprecated');
  }
  async post<T>(): Promise<import('../types/api-response').ResponseData<T>> {
    throw new Error('AxiosHttpClient is deprecated');
  }
  async put<T>(): Promise<import('../types/api-response').ResponseData<T>> {
    throw new Error('AxiosHttpClient is deprecated');
  }
  async delete<T>(): Promise<import('../types/api-response').ResponseData<T>> {
    throw new Error('AxiosHttpClient is deprecated');
  }
  async patch<T>(): Promise<import('../types/api-response').ResponseData<T>> {
    throw new Error('AxiosHttpClient is deprecated');
  }
  async head(): Promise<
    import('../types/api-response').ResponseData<
      import('./httpClientAdapter').HeadResponse
    >
  > {
    throw new Error('AxiosHttpClient is deprecated');
  }
}
