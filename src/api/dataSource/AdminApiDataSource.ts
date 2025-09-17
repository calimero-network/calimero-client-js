import { ApiResponse } from '../../types/api-response';
import {
  AdminApi,
  RootKey,
  RootKeyRequest,
  RootKeyResponse,
  ClientKey,
  PermissionResponse,
  UpdateKeyPermissionsRequest,
} from '../adminApi';
import { HttpClient } from '../httpClient';
import { getAuthEndpointURL } from '../../storage';
import { BaseApiDataSource } from './BaseApiDataSource';

export class AdminApiDataSource extends BaseApiDataSource implements AdminApi {
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
    return getAuthEndpointURL();
  }

  async getRootKeys(): ApiResponse<RootKey[]> {
    try {
      const response = await this.client.get<RootKey[]>(
        this.buildUrl('admin/keys', this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching root keys:', error);
      return { error: { code: 500, message: 'Failed to fetch root keys.' } };
    }
  }

  async getClientKeys(): ApiResponse<ClientKey[]> {
    try {
      const response = await this.client.get<ClientKey[]>(
        this.buildUrl('admin/keys/clients', this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching client keys:', error);
      return { error: { code: 500, message: 'Failed to fetch client keys.' } };
    }
  }

  async addRootKey(
    rootKeyRequest: RootKeyRequest,
  ): ApiResponse<RootKeyResponse> {
    try {
      const response = await this.client.post<RootKeyResponse>(
        new URL('admin/keys', this.baseUrl).toString(),
        rootKeyRequest,
      );
      return response;
    } catch (error) {
      console.error('Error adding root key:', error);
      return { error: { code: 500, message: 'Failed to add root key.' } };
    }
  }

  async revokeRootKey(keyId: string): ApiResponse<RootKeyResponse> {
    try {
      const response = await this.client.delete<RootKeyResponse>(
        this.buildUrl(`admin/keys/${keyId}`, this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error deleting root key:', error);
      return { error: { code: 500, message: 'Failed to delete root key.' } };
    }
  }

  async revokeClientKey(
    rootKeyId: string,
    clientId: string,
  ): ApiResponse<RootKeyResponse> {
    try {
      const response = await this.client.delete<RootKeyResponse>(
        new URL(
          `admin/keys/${rootKeyId}/clients/${clientId}`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error revoking client key:', error);
      return { error: { code: 500, message: 'Failed to revoke client key.' } };
    }
  }

  async setKeyPermissions(
    keyId: string,
    request: UpdateKeyPermissionsRequest,
  ): ApiResponse<PermissionResponse> {
    try {
      const response = await this.client.put<PermissionResponse>(
        new URL(`admin/keys/${keyId}/permissions`, this.baseUrl).toString(),
        request,
      );
      return response;
    } catch (error) {
      console.error('Error updating key permissions:', error);
      return {
        error: { code: 500, message: 'Failed to update key permissions.' },
      };
    }
  }
}
