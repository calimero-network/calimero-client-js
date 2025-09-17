import { ResponseData, ErrorResponse } from '../types/api-response';
import { HttpClient, Transport } from './types';

// Custom error class for HTTP errors
export class HTTPError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string,
    public headers?: Headers,
  ) {
    super(`HTTP ${status} ${statusText}`);
    this.name = 'HTTPError';
  }
}

// Generic error response
const GENERIC_ERROR: ErrorResponse = {
  code: 500,
  message: 'Something went wrong',
};

// Helper function to safely extract text from response
async function safeText(res: Response): Promise<string | undefined> {
  try {
    return await res.text();
  } catch {
    return undefined;
  }
}

// Helper function to safely extract JSON from response
async function safeJson<T>(res: Response): Promise<T | undefined> {
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

// Helper function to convert Headers to Record<string, string>
function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

export class WebHttpClient implements HttpClient {
  private transport: Transport;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: ResponseData<any>) => void;
    reject: (reason: Error) => void;
    path: string;
    init: RequestInit;
  }> = [];

  constructor(transport: Transport) {
    this.transport = {
      ...transport,
      baseUrl: transport.baseUrl.replace(/\/+$/, ''), // Remove trailing slashes
      timeoutMs: transport.timeoutMs ?? 30_000,
    };
  }

  private async makeRequest<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    const url = `${this.transport.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    // Merge headers
    const headers: Record<string, string> = {
      ...(this.transport.defaultHeaders ?? {}),
    };

    // Handle different header types
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    // Add auth token if available
    if (this.transport.getAuthToken) {
      try {
        const token = await this.transport.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        // If token retrieval fails, continue without auth
        console.warn('Failed to get auth token:', error);
      }
    }

    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, this.transport.timeoutMs);

    try {
      const response = await this.transport.fetch(url, {
        ...init,
        headers,
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const text = await safeText(response);
        const authError = response.headers.get('x-auth-error');

        // Handle 401 errors with specific auth error types
        if (response.status === 401) {
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
              // Attempt token refresh
              try {
                return await this.handleTokenRefresh(path, init);
              } catch (refreshError) {
                return {
                  data: null,
                  error: {
                    code: 401,
                    message: 'Session expired. Please log in again.',
                  },
                };
              }
            case 'token_revoked':
              return {
                data: null,
                error: {
                  code: 401,
                  message: 'Session was revoked. Please log in again.',
                },
              };
            case 'invalid_token':
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
                  message: text || 'Authentication failed',
                },
              };
          }
        }

        // Handle other HTTP errors
        return {
          data: null,
          error: {
            code: response.status,
            message: text || response.statusText || 'Request failed',
          },
        };
      }

      // Handle successful responses
      const contentType = response.headers.get('content-type');

      // Handle different response types
      if (contentType?.includes('application/json')) {
        const data = await safeJson<T>(response);
        return {
          data: data as T,
          error: null,
        };
      }

      if (contentType?.includes('text/')) {
        const text = await response.text();
        return {
          data: text as T,
          error: null,
        };
      }

      // Handle binary responses
      if (
        contentType?.includes('application/octet-stream') ||
        contentType?.includes('image/') ||
        contentType?.includes('video/') ||
        contentType?.includes('audio/')
      ) {
        const arrayBuffer = await response.arrayBuffer();
        return {
          data: arrayBuffer as T,
          error: null,
        };
      }

      // Default: try to parse as JSON, fallback to text
      try {
        const data = await response.json();
        return {
          data: data as T,
          error: null,
        };
      } catch {
        const text = await response.text();
        return {
          data: text as T,
          error: null,
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            data: null,
            error: {
              code: 408,
              message: 'Request timeout',
            },
          };
        }

        return {
          data: null,
          error: {
            code: 500,
            message: error.message || 'Network error',
          },
        };
      }

      return {
        data: null,
        error: GENERIC_ERROR,
      };
    }
  }

  private async handleTokenRefresh<T>(
    path: string,
    init: RequestInit,
  ): Promise<ResponseData<T>> {
    // If refresh is already in progress, queue this request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({
          resolve,
          reject,
          path,
          init,
        });
      });
    }

    try {
      this.isRefreshing = true;

      // Get current tokens
      const currentToken = await this.transport.getAuthToken?.();
      if (!currentToken) {
        throw new Error('No current token available for refresh');
      }

      // Attempt to refresh token
      // Note: This is a simplified approach. In a real implementation,
      // you'd need to implement the actual token refresh logic
      // or inject an auth client that handles this

      // For now, we'll just retry the original request
      // In a full implementation, you'd call your auth service here

      // Process queued requests
      this.processQueue(null);

      // Retry original request
      return this.makeRequest<T>(path, init);
    } catch (error) {
      this.isRefreshing = false;
      this.processQueue(error as Error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: Error | null) {
    this.failedQueue.forEach(({ resolve, reject, path, init }) => {
      if (error) {
        reject(error);
      } else {
        // Retry the request
        this.makeRequest(path, init).then(resolve).catch(reject);
      }
    });
    this.failedQueue = [];
  }

  // HTTP method implementations
  async get<T>(path: string, init: RequestInit = {}): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, { ...init, method: 'GET' });
  }

  async post<T>(
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, { ...init, method: 'DELETE' });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    const headers = {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async head<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    const response = await this.makeRequest<T>(path, {
      ...init,
      method: 'HEAD',
    });

    // For HEAD requests, return headers and status
    if (response.data) {
      const headResponse = {
        headers: headersToRecord(new Headers(init.headers)),
        status: 200, // This would need to be extracted from the actual response
      };
      return {
        data: headResponse as T,
        error: null,
      };
    }

    return response;
  }

  // Generic request method (alias for the private makeRequest method)
  async request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, init);
  }
}
