import { ResponseData, ErrorResponse } from '../types/api-response';
import { HttpClient, Transport, RequestOptions, ResponseParser } from './types';

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
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    // Use URL constructor for proper URL handling
    const url = new URL(path, this.transport.baseUrl).toString();

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

    // Add auth token if available (respect user-provided Authorization header)
    if (this.transport.getAuthToken && !headers['Authorization']) {
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

    // Handle AbortSignal - merge user signal with timeout signal
    const userSignal = init.signal || this.transport.defaultAbortSignal;
    const timeoutMs = init.timeoutMs ?? this.transport.timeoutMs;
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeoutMs);

    // Create combined signal if user provided one
    let combinedSignal: AbortSignal;
    if (userSignal) {
      // Create a combined signal that aborts when either signal aborts
      const fallbackController = new AbortController();
      userSignal.addEventListener('abort', () => fallbackController.abort());
      abortController.signal.addEventListener('abort', () => fallbackController.abort());
      combinedSignal = fallbackController.signal;
    } else {
      combinedSignal = abortController.signal;
    }

    try {
      const response = await this.transport.fetch(url, {
        ...init,
        headers,
        signal: combinedSignal,
        credentials: init.credentials ?? this.transport.credentials ?? 'same-origin',
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

      // Handle successful responses with enhanced parsing
      const parseMode = init.parse || this.detectParseMode(response);
      const data = await this.parseResponse<T>(response, parseMode);
      
      return {
        data,
        error: null,
      };
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

  private detectParseMode(response: Response): ResponseParser {
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    
    if (contentType.includes('application/json')) {
      return 'json';
    }
    if (contentType.includes('text/')) {
      return 'text';
    }
    if (contentType.includes('application/octet-stream') || 
        contentType.includes('image/') || 
        contentType.includes('video/') || 
        contentType.includes('audio/')) {
      return 'arrayBuffer';
    }
    
    // Default to JSON for most APIs
    return 'json';
  }

  private async parseResponse<T>(response: Response, parseMode: ResponseParser): Promise<T> {
    switch (parseMode) {
      case 'json':
        try {
          return await response.json() as T;
        } catch (error) {
          throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      case 'text':
        return await response.text() as T;
      case 'blob':
        return await response.blob() as T;
      case 'arrayBuffer':
        return await response.arrayBuffer() as T;
      case 'response':
        return response as T;
      default:
        // Fallback to JSON with error handling
        try {
          return await response.json() as T;
        } catch {
          return await response.text() as T;
        }
    }
  }

  private async handleTokenRefresh<T>(
    path: string,
    init: RequestOptions,
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
  async get<T>(path: string, init: RequestOptions = {}): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, { ...init, method: 'GET' });
  }

  async post<T>(
    path: string,
    body?: unknown,
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    // Don't set Content-Type for FormData - let the browser handle it
    const headers = body instanceof FormData 
      ? { ...(init.headers ?? {}) }
      : {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'POST',
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async put<T>(
    path: string,
    body?: unknown,
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    const headers = body instanceof FormData 
      ? { ...(init.headers ?? {}) }
      : {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'PUT',
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async delete<T>(
    path: string,
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, { ...init, method: 'DELETE' });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    const headers = body instanceof FormData 
      ? { ...(init.headers ?? {}) }
      : {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        };

    return this.makeRequest<T>(path, {
      ...init,
      method: 'PATCH',
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    });
  }

  async head<T>(
    path: string,
    init: RequestOptions = {},
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
    init: RequestOptions = {},
  ): Promise<ResponseData<T>> {
    return this.makeRequest<T>(path, init);
  }
}
