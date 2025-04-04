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

export interface FetchContextIdentitiesResponse {
  identities: string[];
}

export interface NodeIdentity {
  publicKey: string;
  privateKey: string;
}

export interface JoinContextResponse {
  contextId: string;
  memberPublicKey: SigningKey;
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
  fetchContextIdentities(
    contextId: string,
  ): ApiResponse<FetchContextIdentitiesResponse>;
  createNewIdentity(): ApiResponse<NodeIdentity>;
  contextInvite(
    contextId: string,
    inviterPublicKey: string,
    inviteePublicKey: string,
  ): ApiResponse<string>;
  joinContext(
    privateKey: string,
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse>;
}
