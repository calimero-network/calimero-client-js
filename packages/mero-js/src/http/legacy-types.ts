import { ResponseData } from '../types/api-response';

// Token refresh interfaces
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  access_token: string;
  refresh_token: string;
}

// Auth client interface for token refresh
export interface AuthClient {
  refreshToken(
    request: RefreshTokenRequest,
  ): Promise<ResponseData<RefreshTokenResponse>>;
}

// Storage interface for token management
export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
  clearAccessToken(): void;
  clearRefreshToken(): void;
  getAppEndpointKey(): string | null;
  clientLogout(): void;
}

// Legacy interfaces for backward compatibility with Axios-based client
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

export interface LegacyHttpClient {
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
