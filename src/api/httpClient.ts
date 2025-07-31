import { Axios, AxiosError, AxiosResponse } from 'axios';
import { ErrorResponse, ResponseData } from '../types/api-response';
import {
  getAccessToken,
  getRefreshToken,
  clearAccessToken,
  setAccessToken,
  setRefreshToken,
  clientLogout,
} from '../storage';
import { RefreshTokenResponse } from '../api/authApi';
import { getAppEndpointKey } from '../storage';
import { authClient } from './index';

export interface Header {
  [key: string]: string;
}

export interface HttpClient {
  get<T>(
    url: string,
    headers?: Header[],
    isJsonRpc?: boolean,
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
  head(url: string, headers?: Header[]): Promise<ResponseData<void>>;
}

export class AxiosHttpClient implements HttpClient {
  private axios: Axios;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: any;
  }> = [];

  constructor(axios: Axios) {
    this.axios = axios;
  }

  private isRefreshRequest(config: any): boolean {
    const baseUrl = getAppEndpointKey();
    return config?.url === `${baseUrl}/public/refresh`;
  }

  private processQueue(error: Error | null, token: string | null = null) {
    // Filter out duplicate refresh requests from the queue
    const uniqueRequests = this.failedQueue.filter(
      (promise) => !this.isRefreshRequest(promise.config),
    );

    uniqueRequests.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        // Retry the request with new token
        if (token) {
          promise.config.headers.Authorization = `Bearer ${token}`;
        }
        promise.resolve(this.request(this.axios.request(promise.config)));
      }
    });

    this.failedQueue = [];
  }

  private convertHeaders(headers: any): Record<string, string> {
    if (!headers) {
      return {};
    }
    return Object.keys(headers).reduce((acc, key) => {
      acc[key] = String(headers[key]);
      return acc;
    }, {} as Record<string, string>);
  }

  private async handleTokenRefresh(originalRequest: any): Promise<any> {
    // If refresh is already in progress, queue this request
    if (this.isRefreshing) {
      // If this is another refresh request while one is in progress, just reject it
      if (this.isRefreshRequest(originalRequest)) {
        return Promise.reject(new Error('Token refresh already in progress'));
      }

      return new Promise((resolve, reject) => {
        this.failedQueue.push({
          resolve,
          reject,
          config: originalRequest,
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

      const response = await authClient.refreshToken({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (response.error || !response.data) {
        throw new Error('Failed to refresh token');
      }

      // Update stored tokens
      setAccessToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);

      // Update the original request with new token
      originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;

      // Process queue with new token
      this.processQueue(null, response.data.access_token);

      // Reset refreshing state
      this.isRefreshing = false;

      // Retry original request
      return this.request(this.axios.request(originalRequest));
    } catch (error) {
      this.isRefreshing = false;
      this.processQueue(new Error('Failed to refresh token'));
      clearAccessToken();
      throw error;
    }
  }

  private async request<T>(
    promise: Promise<AxiosResponse<T>>,
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    try {
      const response = await promise;

      if (response?.config?.method?.toUpperCase() === 'HEAD') {
        return {
          data: null as T,
          error: null,
          headers: this.convertHeaders(response.headers),
        };
      }

      // For JSON-RPC requests, treat the entire response as the data
      // For regular API requests, expect and unwrap the data field
      const responseData = isJsonRpc
        ? response.data
        : (response.data as { data: T }).data;

      return {
        data: responseData,
        error: null,
        headers: this.convertHeaders(response.headers),
      };
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const status = e.response?.status;
        const headers = e.response?.headers;
        const body = e.response?.data;
        // Handle 401 responses
        if (status === 401) {
          // Check specific error type from X-Auth-Error header
          const authError = headers?.['x-auth-error'];
          switch (authError) {
            case 'missing_token':
              return {
                data: null,
                error: {
                  code: 401,
                  message: 'No access token found.',
                },
              };
            case 'token_expired':
              try {
                // Attempt token refresh and retry original request
                return await this.handleTokenRefresh(e.config);
              } catch (refreshError) {
                clearAccessToken();
                return {
                  data: null,
                  error: {
                    code: 401,
                    message: 'Session expired. Please log in again.',
                  },
                };
              }
            case 'token_revoked':
              clientLogout();
              return {
                data: null,
                error: {
                  code: 401,
                  message: 'Session was revoked. Please log in again.',
                },
              };
            case 'invalid_token':
              clientLogout();
              return {
                data: null,
                error: {
                  code: 401,
                  message: 'Invalid authentication. Please log in again.',
                },
              };
            default:
              return {
                data: null,
                error: {
                  code: 401,
                  message: body.error,
                },
              };
          }
        }

        // Handle other error cases
        if (e?.config?.method?.toUpperCase() === 'HEAD') {
          return {
            data: null,
            error: {
              code: e.request.status,
              message: e.message,
            },
            headers: this.convertHeaders(e.response?.headers),
          };
        }

        const error: ErrorResponse | string =
          e.response?.data.error ?? e.response?.data;

        if (!error) {
          return {
            data: null,
            error: {
              code: status ?? 500,
              message: e.message || 'Something went wrong',
            },
          };
        }
        if (typeof error === 'string') {
          return {
            data: null,
            error: {
              code: status ?? 500,
              message: error,
            },
          };
        }
        return {
          data: null,
          error: {
            code: status ?? error.code ?? 500,
            message: error.message,
          },
        };
      }
      return {
        data: null,
        error: GENERIC_ERROR,
      };
    }
  }

  private getAuthHeaders(): Header {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get<T>(
    url: string,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.get<T>(url, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
      isJsonRpc,
    );
  }

  async post<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.post<T>(url, body, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
      isJsonRpc,
    );
  }

  async put<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.put<T>(url, body, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
      isJsonRpc,
    );
  }

  async delete<T>(
    url: string,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.delete<T>(url, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
      isJsonRpc,
    );
  }

  async patch<T>(
    url: string,
    body?: unknown,
    headers?: Header[],
    isJsonRpc = false,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.patch<T>(url, body, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
      isJsonRpc,
    );
  }

  async head(url: string, headers?: Header[]): Promise<ResponseData<void>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.head(url, {
        headers: { ...authHeaders, ...mergedHeaders },
      }),
    );
  }

  // Expose refresh mechanism for RPC error handling
  public async refreshTokens(): Promise<ResponseData<RefreshTokenResponse>> {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    if (!refreshToken || !accessToken) {
      return { error: { code: 401, message: 'Missing tokens for refresh' } };
    }

    const response = await authClient.refreshToken({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (response.data) {
      setAccessToken(response.data.access_token);
      setRefreshToken(response.data.refresh_token);
    }

    return response;
  }
}

const GENERIC_ERROR: ErrorResponse = {
  code: 500,
  message: 'Something went wrong',
};
