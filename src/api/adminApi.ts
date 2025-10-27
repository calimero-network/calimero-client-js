import { ApiResponse } from '../types/api-response';

export interface RootKey {
  key_id: string;
  public_key: string;
  auth_method: string;
  created_at: number;
  revoked_at: number;
}

export interface ClientKey {
  client_id: string;
  root_key_id: string;
  name: string;
  permissions: string[];
  created_at: number;
  revoked_at?: number;
  is_valid: boolean;
}

export interface RootKeyRequest {
  public_key: string;
  auth_method: string;
  provider_data: any;
}

export interface RootKeyResponse {
  status: boolean;
  message: string;
}

export interface PermissionResponse {
  permissions: string[];
}

export interface UpdateKeyPermissionsRequest {
  add?: string[];
  remove?: string[];
}

// Package Management Types
export interface PackageListResponse {
  packages: string[];
}

export interface PackageVersionsResponse {
  versions: string[];
}

export interface PackageLatestResponse {
  application_id: string | null;
}

export interface InstallApplicationRequest {
  url: string;
  package: string;
  version: string;
  metadata: any[];
}

export interface InstallApplicationResponse {
  data: {
    applicationId: string;
  };
}

// Context Management Types
export interface Context {
  id: string;
  application_id: string;
  root_hash: string;
}

export interface ContextWithExecutors extends Context {
  executors: string[];
}

export interface ContextsResponse {
  data: {
    contexts: Context[];
  };
}

export interface ContextsWithExecutorsResponse {
  contexts: ContextWithExecutors[];
}

export interface AdminApi {
  getRootKeys(): ApiResponse<RootKey[]>;
  getClientKeys(): ApiResponse<ClientKey[]>;
  addRootKey(rootKeyRequest: RootKeyRequest): ApiResponse<RootKeyResponse>;
  revokeRootKey(keyId: string): ApiResponse<RootKeyResponse>;
  revokeClientKey(
    rootKeyId: string,
    clientId: string,
  ): ApiResponse<RootKeyResponse>;
  setKeyPermissions(
    keyId: string,
    request: UpdateKeyPermissionsRequest,
  ): ApiResponse<PermissionResponse>;
  
  // Package Management Methods
  getPackages(): ApiResponse<PackageListResponse>;
  getPackageVersions(packageName: string): ApiResponse<PackageVersionsResponse>;
  getPackageLatest(packageName: string): ApiResponse<PackageLatestResponse>;
  installApplication(request: InstallApplicationRequest): ApiResponse<InstallApplicationResponse>;
  
  // Context Management Methods
  getContextsForApplication(applicationId: string): ApiResponse<ContextsResponse>;
  getContextsWithExecutorsForApplication(applicationId: string): ApiResponse<ContextsWithExecutorsResponse>;
}
