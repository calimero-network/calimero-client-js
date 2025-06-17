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
}
