import { ApiResponse } from '../types/api-response';

export interface HealthRequest {
  url: string;
}

export interface HealthStatus {
  status: string;
}

export interface JwtTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface SigningKey {
  signingKey: string;
}

export interface CreateContextResponse {
  contextId: string;
  memberPublicKey: SigningKey;
}

export interface DeleteContextResponse {
  isDeleted: boolean;
}

export interface Context {
  applicationId: string;
  id: string;
  rootHash: String;
}

export interface GetContextsResponse {
  contexts: Context[];
}

export interface NodeApi {
  refreshToken(
    refreshToken: string,
    rpcBaseUrl: string,
  ): ApiResponse<JwtTokenResponse>;
  health(request: HealthRequest): ApiResponse<HealthStatus>;
  getContexts(): ApiResponse<GetContextsResponse>;
  deleteContext(contextId: string): ApiResponse<DeleteContextResponse>;
  createContext(
    applicationId: string,
    protocol: string,
  ): ApiResponse<CreateContextResponse>;
}
