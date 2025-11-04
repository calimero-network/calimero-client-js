import { ApiResponse } from '../types/api-response';

export interface LoginRequest {
  url: string;
  callbackUrl: string;
  permissions: string[];
  /**
   * Legacy: Hash-based application ID (backwards compat)
   */
  applicationId?: string;
  /**
   * Registry manifest URL (package-based approach)
   * Constructed from registryUrl + packageName + version
   */
  manifestUrl?: string;
  applicationPath: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenRequest {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ProvidersResponse {
  providers: Provider[];
  count: number;
}

export interface Provider {
  name: string;
  type: string;
  description: string;
  configured: boolean;
  config?: Record<string, any>;
}

export interface BaseTokenRequest {
  auth_method: string;
  public_key: string;
  client_name: string;
  timestamp: number;
  permissions?: string[];
  provider_data: any; // This will be typed based on the auth method
  target_node_url?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  error?: string;
}

export interface ChallengeRequest {
  provider: string;
  redirect_uri?: string;
  client_id?: string;
}

export interface ChallengeResponse {
  challenge: string;
  nonce: string; // Base64 encoded nonce from server
}

export interface SignedMessage {
  accountId: string;
  publicKey: string;
  signature: string;
}

export interface GenerateClientKeyRequest {
  context_id: string;
  context_identity: string;
  permissions?: string[];
  target_node_url: string;
}

export interface AuthApi {
  login(request: LoginRequest): ApiResponse<LoginResponse>;
  refreshToken(request: RefreshTokenRequest): ApiResponse<RefreshTokenResponse>;
  getProviders(): ApiResponse<ProvidersResponse>;
  requestToken(requestBody: BaseTokenRequest): ApiResponse<TokenResponse>;
  getChallenge(): ApiResponse<ChallengeResponse>;
  generateClientKey(
    request: GenerateClientKeyRequest,
  ): ApiResponse<TokenResponse>;
}
