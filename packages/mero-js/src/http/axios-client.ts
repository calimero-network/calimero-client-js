import { Axios, AxiosError, AxiosResponse } from 'axios';
import { ResponseData, ErrorResponse } from '../types/api-response';
import {
  Header,
  ProgressCallback,
  HeadResponse,
  RequestOptions,
  RefreshTokenResponse,
  AuthClient,
  TokenStorage,
} from './legacy-types';
import { LegacyHttpClient } from './legacy-types';

const GENERIC_ERROR: ErrorResponse = {
  code: 500,
  message: 'Something went wrong',
};

export class AxiosHttpClient implements LegacyHttpClient {
  private axios: Axios;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
    config: any;
  }> = [];
  private authClient: AuthClient;
  private tokenStorage: TokenStorage;

  constructor(
    axios: Axios,
    authClient: AuthClient,
    tokenStorage: TokenStorage,
  ) {
    this.axios = axios;
    this.authClient = authClient;
    this.tokenStorage = tokenStorage;
  }

  private isRefreshRequest(config: any): boolean {
    const baseUrl = this.tokenStorage.getAppEndpointKey();
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
      const refreshToken = this.tokenStorage.getRefreshToken();
      const accessToken = this.tokenStorage.getAccessToken();

      if (!refreshToken || !accessToken) {
        throw new Error('Missing tokens for refresh');
      }

      const response = await this.authClient.refreshToken({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (response.error || !response.data) {
        throw new Error('Failed to refresh token');
      }

      // Update stored tokens
      this.tokenStorage.setAccessToken(response.data.access_token);
      this.tokenStorage.setRefreshToken(response.data.refresh_token);

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
      this.tokenStorage.clearAccessToken();
      throw error;
    }
  }

  private async request<T>(
    promise: Promise<AxiosResponse<T>>,
    isJsonRpc = false,
    responseType?: 'arraybuffer' | 'blob' | 'json',
  ): Promise<ResponseData<T>> {
    try {
      const response = await promise;

      if (response?.config?.method?.toUpperCase() === 'HEAD') {
        // For HEAD requests, return headers and status
        // Convert axios headers to string record
        const headers: Record<string, string> = {};
        if (response.headers) {
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value !== undefined) {
              headers[key] = Array.isArray(value)
                ? value.join(', ')
                : String(value);
            }
          });
        }

        const headResponse: HeadResponse = {
          headers,
          status: response.status,
        };
        return {
          data: headResponse as T,
          error: null,
        };
      }

      // For binary responses, return the raw data
      if (responseType === 'arraybuffer' || responseType === 'blob') {
        return {
          data: response.data as T,
          error: null,
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
                this.tokenStorage.clearAccessToken();
                return {
                  data: null,
                  error: {
                    code: 401,
                    message: 'Session expired. Please log in again.',
                  },
                };
              }
            case 'token_revoked':
              this.tokenStorage.clientLogout();
              return {
                data: null,
                error: {
                  code: 401,
                  message: 'Session was revoked. Please log in again.',
                },
              };
            case 'invalid_token':
              this.tokenStorage.clientLogout();
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
    const token = this.tokenStorage.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async get<T>(
    url: string,
    headers?: Header[],
    isJsonRpc = false,
    options?: { responseType?: 'arraybuffer' | 'blob' | 'json' },
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );
    return this.request(
      this.axios.get<T>(url, {
        headers: { ...authHeaders, ...mergedHeaders },
        responseType: options?.responseType,
      }),
      isJsonRpc,
      options?.responseType,
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
    onUploadProgress?: ProgressCallback,
  ): Promise<ResponseData<T>> {
    const authHeaders = this.getAuthHeaders();
    const mergedHeaders = headers?.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    );

    const config: any = {
      headers: { ...authHeaders, ...mergedHeaders },
    };

    // Add upload progress callback if provided
    if (onUploadProgress) {
      config.onUploadProgress = (progressEvent: any) => {
        if (progressEvent.lengthComputable) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onUploadProgress(progress);
        }
      };
    }

    return this.request(this.axios.put<T>(url, body, config), isJsonRpc);
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

  async head(
    url: string,
    headers?: Header[],
  ): Promise<ResponseData<HeadResponse>> {
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
    const refreshToken = this.tokenStorage.getRefreshToken();
    const accessToken = this.tokenStorage.getAccessToken();

    if (!refreshToken || !accessToken) {
      return { error: { code: 401, message: 'Missing tokens for refresh' } };
    }

    const response = await this.authClient.refreshToken({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (response.data) {
      this.tokenStorage.setAccessToken(response.data.access_token);
      this.tokenStorage.setRefreshToken(response.data.refresh_token);
    }

    return response;
  }
}
