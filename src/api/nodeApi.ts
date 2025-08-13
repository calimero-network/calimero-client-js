import { ApiResponse } from '../types/api-response';

export interface HealthRequest {
  url: string;
}

export interface HealthStatus {
  status: string;
}

export interface CreateContextResponse {
  contextId: string;
  memberPublicKey: string;
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
  memberPublicKey: string;
}

// Application Management Interfaces
export interface InstalledApplication {
  id: string;
  blob: string;
  version: string | null;
  source: string;
  metadata: number[];
}

export interface GetInstalledApplicationsResponse {
  apps: InstalledApplication[];
}

export interface InstallApplicationResponse {
  applicationId: string;
}

export interface UninstallApplicationResponse {
  applicationId: string;
}

// Context Management Extended Interfaces
export interface ContextClientKey {
  client_id: string;
  root_key_id: string;
  name: string;
  permissions: string[];
  created_at: number;
  revoked_at?: number;
  is_valid: boolean;
}

export interface ContextClientKeysList {
  clientKeys: ContextClientKey[];
}

export interface ContextUsersList {
  identities: string[];
}

export interface ContextStorage {
  sizeInBytes: number;
}

export interface CapabilitiesRequest {
  capabilities: Array<[string, string]>; // [ContextIdentity, Capability]
  signer_id: string;
}

export interface CheckAuthResponse {
  payload: Record<string, any>;
}

export interface NodeApi {
  health(request: HealthRequest): ApiResponse<HealthStatus>;
  getContext(contextId: string): ApiResponse<Context>;
  getContexts(): ApiResponse<GetContextsResponse>;
  deleteContext(contextId: string): ApiResponse<DeleteContextResponse>;
  createContext(
    applicationId: string,
    jsonParams: string,
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
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse>;

  // Application Management
  getInstalledApplications(): ApiResponse<GetInstalledApplicationsResponse>;
  getInstalledApplicationDetails(
    appId: string,
  ): ApiResponse<InstalledApplication | null>;
  installApplication(
    url: string,
    metadata?: Uint8Array,
    hash?: string,
  ): ApiResponse<InstallApplicationResponse>;
  uninstallApplication(
    applicationId: string,
  ): ApiResponse<UninstallApplicationResponse>;

  // Context Management Extended
  getContextClientKeys(contextId: string): ApiResponse<ContextClientKeysList>;
  getContextUsers(contextId: string): ApiResponse<ContextUsersList>;
  getContextStorageUsage(contextId: string): ApiResponse<ContextStorage>;

  // Capabilities Management
  grantCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void>;
  revokeCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void>;
  checkAuth(): ApiResponse<CheckAuthResponse>;
}
