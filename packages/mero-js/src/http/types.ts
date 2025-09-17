import { ResponseData } from '../types/api-response';

// Web Standards based types
export type FetchLike = (
  input: RequestInfo,
  init?: RequestInit,
) => Promise<Response>;

export interface Transport {
  fetch: FetchLike;
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: () => Promise<string | undefined>;
  onTokenRefresh?: (newToken: string) => Promise<void>;
  timeoutMs?: number;
}

export interface HttpClient {
  get<T>(path: string, init?: RequestInit): Promise<ResponseData<T>>;
  post<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ResponseData<T>>;
  put<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ResponseData<T>>;
  delete<T>(path: string, init?: RequestInit): Promise<ResponseData<T>>;
  patch<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<ResponseData<T>>;
  head<T>(path: string, init?: RequestInit): Promise<ResponseData<T>>;
  request<T>(path: string, init?: RequestInit): Promise<ResponseData<T>>;
}

// Legacy compatibility types (for gradual migration)
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

// Note: Auth and storage interfaces moved to legacy-types.ts for Axios compatibility
