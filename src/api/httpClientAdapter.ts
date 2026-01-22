/**
 * Adapter that wraps mero-js HttpClient to match calimero-client-js HttpClient interface
 * This eliminates duplication by using mero-js as the underlying HTTP client implementation
 */

import {
  createBrowserHttpClient,
  HttpClient as MeroHttpClient,
  HTTPError,
} from '@calimero-network/mero-js';
import { ResponseData } from '../types/api-response';
import {
  getAccessToken,
  getRefreshToken,
  clearAccessToken,
  setAccessToken,
  setRefreshToken,
  clientLogout,
} from '../storage';
import { getAppEndpointKey, getAuthEndpointURL } from '../storage';
import { RefreshTokenResponse } from './authApi';

export interface Header {
  [key: string]: string;
}

export interface ProgressCallback {
  (progress: number): void;
}

export interface HeadResponse {
  headers: Record<string, string>;
  status: number;
}

export interface RequestOptions {
  responseType?: 'arraybuffer' | 'blob' | 'json';
}

export interface HttpClient {
  get<T>(
    url: string,
    headers?: Header[],
    isJsonRpc?: boolean,
    options?: RequestOptions,
  ): Promise<ResponseData<T>>;
  post<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc?: boolean,
  ): Promise<ResponseData<T>>;
  put<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc?: boolean,
    onUploadProgress?: ProgressCallback,
  ): Promise<ResponseData<T>>;
  delete<T>(
    url: string,
    headers?: Header[],
    isJsonRpc?: boolean,
  ): Promise<ResponseData<T>>;
  patch<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc?: boolean,
  ): Promise<ResponseData<T>>;
  head(url: string, headers?: Header[]): Promise<ResponseData<HeadResponse>>;
}

/**
 * Adapter that wraps mero-js HttpClient to provide calimero-client-js compatible interface
 */
export class MeroHttpClientAdapter implements HttpClient {
  private meroClient: MeroHttpClient;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    method: string;
    url: string;
    body?: unknown;
    headers?: Header[];
    isJsonRpc?: boolean;
    options?: RequestOptions;
    onUploadProgress?: ProgressCallback;
  }> = [];

  constructor() {
    // Create mero-js client with token refresh support
    // baseUrl will be handled dynamically in makeRequest since URLs can be absolute
    // For relative URLs, we'll use getAppEndpointKey() at request time
    this.meroClient = createBrowserHttpClient({
      baseUrl: getAppEndpointKey() || 'http://localhost', // Temporary baseUrl, will be overridden for absolute URLs
      getAuthToken: async () => {
        const token = getAccessToken();
        return token || undefined;
      },
      onTokenRefresh: async (newToken: string) => {
        setAccessToken(newToken);
      },
    });
  }


  private isRefreshRequest(url: string): boolean {
    const baseUrl = getAppEndpointKey();
    if (!baseUrl) return false;
    return url === new URL('public/refresh', baseUrl).toString();
  }

  private processQueue(error: Error | null, token: string | null = null) {
    // Filter out duplicate refresh requests from the queue
    const uniqueRequests = this.failedQueue.filter(
      (promise) => !this.isRefreshRequest(promise.url),
    );

    uniqueRequests.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        // Retry the request with new token
        const headers = token
          ? [{ Authorization: `Bearer ${token}`, ...promise.headers?.[0] }]
          : promise.headers;
        
        // Retry based on method
        let retryPromise: Promise<ResponseData<unknown>>;
        switch (promise.method) {
          case 'GET':
            retryPromise = this.get(promise.url, headers, promise.isJsonRpc, promise.options);
            break;
          case 'POST':
            retryPromise = this.post(promise.url, promise.body, headers, promise.isJsonRpc);
            break;
          case 'PUT':
            retryPromise = this.put(
              promise.url,
              promise.body,
              headers,
              promise.isJsonRpc,
              promise.onUploadProgress,
            );
            break;
          case 'DELETE':
            retryPromise = this.delete(promise.url, headers, promise.isJsonRpc);
            break;
          case 'PATCH':
            retryPromise = this.patch(promise.url, promise.body, headers, promise.isJsonRpc);
            break;
          default:
            promise.reject(new Error(`Unknown method: ${promise.method}`));
            return;
        }
        promise.resolve(retryPromise);
      }
    });

    this.failedQueue = [];
  }

  private async handleTokenRefresh<T>(
    originalMethod: string,
    originalUrl: string,
    originalBody?: unknown,
    originalHeaders?: Header[],
    originalIsJsonRpc?: boolean,
    originalOptions?: RequestOptions,
    originalOnUploadProgress?: ProgressCallback,
  ): Promise<ResponseData<T>> {
    // If refresh is already in progress, queue this request
    if (this.isRefreshing) {
      // If this is another refresh request while one is in progress, just reject it
      if (this.isRefreshRequest(originalUrl)) {
        return Promise.reject(new Error('Token refresh already in progress'));
      }

      return new Promise<ResponseData<T>>((resolve, reject) => {
        this.failedQueue.push({
          resolve: resolve as (value?: unknown) => void,
          reject,
          method: originalMethod,
          url: originalUrl,
          body: originalBody,
          headers: originalHeaders,
          isJsonRpc: originalIsJsonRpc,
          options: originalOptions,
          onUploadProgress: originalOnUploadProgress,
        });
      });
    }

    try {
      this.isRefreshing = true;
      const refreshToken = getRefreshToken();
      const accessToken = getAccessToken();

      if (!refreshToken || !accessToken) {
        throw new Error('Missing tokens for refresh');
      }

      // Call refresh endpoint directly to avoid circular dependency
      const authEndpoint = getAuthEndpointURL();
      if (!authEndpoint) {
        throw new Error('Auth endpoint not configured');
      }
      
      const refreshUrl = new URL('auth/refresh', authEndpoint).toString();
      const response = await this.meroClient.post<RefreshTokenResponse>(
        refreshUrl,
        {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      );
      
      // Convert to ResponseData format
      const refreshResponse: ResponseData<RefreshTokenResponse> = {
        data: response,
        error: null,
      };

      if (refreshResponse.error || !refreshResponse.data) {
        throw new Error('Failed to refresh token');
      }

      // Update stored tokens
      setAccessToken(refreshResponse.data.access_token);
      setRefreshToken(refreshResponse.data.refresh_token);

      // Process queue with new token
      this.processQueue(null, refreshResponse.data.access_token);

      // Reset refreshing state
      this.isRefreshing = false;

      // Retry original request
      switch (originalMethod) {
        case 'GET':
          return this.get<T>(originalUrl, originalHeaders, originalIsJsonRpc, originalOptions);
        case 'POST':
          return this.post<T>(originalUrl, originalBody, originalHeaders, originalIsJsonRpc);
        case 'PUT':
          return this.put<T>(
            originalUrl,
            originalBody,
            originalHeaders,
            originalIsJsonRpc,
            originalOnUploadProgress,
          );
        case 'DELETE':
          return this.delete<T>(originalUrl, originalHeaders, originalIsJsonRpc);
        case 'PATCH':
          return this.patch<T>(originalUrl, originalBody, originalHeaders, originalIsJsonRpc);
        default:
          throw new Error(`Unknown method: ${originalMethod}`);
      }
    } catch (error) {
      this.isRefreshing = false;
      this.processQueue(new Error('Failed to refresh token'));
      clearAccessToken();
      throw error;
    }
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
    options?: RequestOptions,
  ): Promise<ResponseData<T>> {
    try {
      // Merge headers
      const mergedHeaders: Record<string, string> = {};
      headers?.forEach((h) => {
        Object.assign(mergedHeaders, h);
      });

      // Determine parse type based on responseType
      let parse: 'json' | 'text' | 'blob' | 'arrayBuffer' | undefined = 'json';
      if (options?.responseType === 'arraybuffer') {
        parse = 'arrayBuffer';
      } else if (options?.responseType === 'blob') {
        parse = 'blob';
      }

      // Make request using mero-js client
      // mero-js handles both absolute URLs and relative paths
      // If it's an absolute URL, mero-js will use it directly
      // If it's relative, it will combine with baseUrl from the transport
      let response: T;

      switch (method) {
        case 'GET':
          response = await this.meroClient.get<T>(url, {
            headers: mergedHeaders,
            parse,
          });
          break;
        case 'POST':
          response = await this.meroClient.post<T>(url, body, {
            headers: mergedHeaders,
            parse,
          });
          break;
        case 'PUT':
          response = await this.meroClient.put<T>(url, body, {
            headers: mergedHeaders,
            parse,
          });
          break;
        case 'DELETE':
          response = await this.meroClient.delete<T>(url, {
            headers: mergedHeaders,
            parse,
          });
          break;
        case 'PATCH':
          response = await this.meroClient.patch<T>(url, body, {
            headers: mergedHeaders,
            parse,
          });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // For JSON-RPC requests, treat the entire response as the data
      // For regular API requests, expect and unwrap the data field
      let responseData: T;
      if (isJsonRpc) {
        responseData = response;
      } else {
        // Check if response has a 'data' field (wrapped format)
        if (
          response &&
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          (response as { data?: unknown }).data !== undefined
        ) {
          // Wrapped format: { data: {...} }
          responseData = (response as { data: T }).data;
        } else {
          // Direct payload format
          responseData = response;
        }
      }

      return {
        data: responseData,
        error: null,
      };
    } catch (error) {
      // Handle HTTPError from mero-js
      if (error instanceof HTTPError) {
        // Handle 401 responses for token refresh
        if (error.status === 401) {
          const authError = error.headers.get('x-auth-error');
          const errorMessage = error.bodyText || 'Unauthorized';

          switch (authError) {
            case 'missing_token':
              return {
                data: null,
                error: {
                  code: 401,
                  message: errorMessage || 'No access token found.',
                },
              };
            case 'token_expired':
              try {
                // Attempt token refresh and retry original request
                return await this.handleTokenRefresh<T>(
                  method,
                  url,
                  body,
                  headers,
                  isJsonRpc,
                  options,
                );
              } catch (refreshError) {
                clearAccessToken();
                return {
                  data: null,
                  error: {
                    code: 401,
                    message: errorMessage || 'Session expired. Please log in again.',
                  },
                };
              }
            case 'token_revoked':
              clientLogout();
              return {
                data: null,
                error: {
                  code: 401,
                  message: errorMessage || 'Session was revoked. Please log in again.',
                },
              };
            case 'invalid_token':
              clientLogout();
              return {
                data: null,
                error: {
                  code: 401,
                  message: errorMessage || 'Invalid authentication. Please log in again.',
                },
              };
            default:
              return {
                data: null,
                error: {
                  code: 401,
                  message: errorMessage,
                },
              };
          }
        }

        // Handle other HTTP errors
        let errorMessage = error.bodyText || error.statusText || 'Something went wrong';
        try {
          const errorJson = JSON.parse(errorMessage);
          if (typeof errorJson === 'string') {
            errorMessage = errorJson;
          } else if (errorJson.error) {
            errorMessage =
              typeof errorJson.error === 'string'
                ? errorJson.error
                : errorJson.error.message || JSON.stringify(errorJson.error);
          } else if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          // Use errorMessage as-is if JSON parsing fails
        }

        return {
          data: null,
          error: {
            code: error.status,
            message: errorMessage,
          },
        };
      }

      // Handle network errors
      if (error instanceof Error) {
        return {
          data: null,
          error: {
            code: 0,
            message: error.message || 'Network error: Failed to fetch',
          },
        };
      }

      return {
        data: null,
        error: {
          code: 500,
          message: 'Something went wrong',
        },
      };
    }
  }

  async get<T>(
    url: string,
    headers?: Header[],
    isJsonRpc = false,
    options?: RequestOptions,
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>('GET', url, undefined, headers, isJsonRpc, options);
  }

  async post<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>('POST', url, body, headers, isJsonRpc);
  }

  async put<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
    onUploadProgress?: ProgressCallback,
  ): Promise<ResponseData<T>> {
    // Note: Upload progress with fetch requires ReadableStream tracking
    // For now, we'll make the request but progress tracking is limited
    const result = await this.makeRequest<T>('PUT', url, body, headers, isJsonRpc);
    if (onUploadProgress) {
      onUploadProgress(100);
    }
    return result;
  }

  async delete<T>(
    url: string,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>('DELETE', url, undefined, headers, isJsonRpc);
  }

  async patch<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>('PATCH', url, body, headers, isJsonRpc);
  }

  async head(url: string, headers?: Header[]): Promise<ResponseData<HeadResponse>> {
    try {
      const mergedHeaders: Record<string, string> = {};
      headers?.forEach((h) => {
        Object.assign(mergedHeaders, h);
      });

      const headResponse = await this.meroClient.head(url, {
        headers: mergedHeaders,
      });

      return {
        data: headResponse,
        error: null,
      };
    } catch (error) {
      if (error instanceof HTTPError) {
        return {
          data: null,
          error: {
            code: error.status,
            message: error.bodyText || error.statusText || 'Request failed',
          },
        };
      }

      return {
        data: null,
        error: {
          code: 0,
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Expose refresh mechanism for RPC error handling
  public async refreshTokens(): Promise<ResponseData<RefreshTokenResponse>> {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    if (!refreshToken || !accessToken) {
      return { error: { code: 401, message: 'Missing tokens for refresh' } };
    }

    // Call refresh endpoint directly to avoid circular dependency
    const authEndpoint = getAuthEndpointURL();
    if (!authEndpoint) {
      return { error: { code: 500, message: 'Auth endpoint not configured' } };
    }

    try {
      const refreshUrl = new URL('auth/refresh', authEndpoint).toString();
      const response = await this.meroClient.post<RefreshTokenResponse>(
        refreshUrl,
        {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      );

      const refreshResponse: ResponseData<RefreshTokenResponse> = {
        data: response,
        error: null,
      };

      if (refreshResponse.data) {
        setAccessToken(refreshResponse.data.access_token);
        setRefreshToken(refreshResponse.data.refresh_token);
      }

      return refreshResponse;
    } catch (error) {
      if (error instanceof HTTPError) {
        return {
          data: null,
          error: {
            code: error.status,
            message: error.bodyText || error.statusText || 'Token refresh failed',
          },
        };
      }
      return {
        data: null,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : 'Token refresh failed',
        },
      };
    }
  }
}

// Keep FetchHttpClient for backwards compatibility (deprecated)
export class FetchHttpClient implements HttpClient {
  // This class is kept for backwards compatibility but should not be used
  // It will throw an error if someone tries to use it
  constructor() {
    throw new Error(
      'FetchHttpClient is deprecated. Use MeroHttpClientAdapter instead.',
    );
  }

  async get<T>(): Promise<ResponseData<T>> {
    throw new Error('FetchHttpClient is deprecated');
  }
  async post<T>(): Promise<ResponseData<T>> {
    throw new Error('FetchHttpClient is deprecated');
  }
  async put<T>(): Promise<ResponseData<T>> {
    throw new Error('FetchHttpClient is deprecated');
  }
  async delete<T>(): Promise<ResponseData<T>> {
    throw new Error('FetchHttpClient is deprecated');
  }
  async patch<T>(): Promise<ResponseData<T>> {
    throw new Error('FetchHttpClient is deprecated');
  }
  async head(): Promise<ResponseData<HeadResponse>> {
    throw new Error('FetchHttpClient is deprecated');
  }
}
