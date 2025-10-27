import { ApiResponse } from '../../types/api-response';
import {
  AdminApi,
  RootKey,
  RootKeyRequest,
  RootKeyResponse,
  ClientKey,
  PermissionResponse,
  UpdateKeyPermissionsRequest,
  PackageListResponse,
  PackageVersionsResponse,
  PackageLatestResponse,
  InstallApplicationRequest,
  InstallApplicationResponse,
  ContextsResponse,
  ContextsWithExecutorsResponse,
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
        this.buildUrl('admin/keys', this.baseUrl),
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
        this.buildUrl(
          `admin/keys/${rootKeyId}/clients/${clientId}`,
          this.baseUrl,
        ),
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
        this.buildUrl(`admin/keys/${keyId}/permissions`, this.baseUrl),
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

  // Package Management Methods
  async getPackages(): ApiResponse<PackageListResponse> {
    try {
      const response = await this.client.get<PackageListResponse>(
        this.buildUrl('admin-api/packages', this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching packages:', error);
      return { error: { code: 500, message: 'Failed to fetch packages.' } };
    }
  }

  async getPackageVersions(packageName: string): ApiResponse<PackageVersionsResponse> {
    try {
      const response = await this.client.get<PackageVersionsResponse>(
        this.buildUrl(`admin-api/packages/${packageName}/versions`, this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching package versions:', error);
      return { error: { code: 500, message: 'Failed to fetch package versions.' } };
    }
  }

  async getPackageLatest(packageName: string): ApiResponse<PackageLatestResponse> {
    try {
      const response = await this.client.get<PackageLatestResponse>(
        this.buildUrl(`admin-api/packages/${packageName}/latest`, this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching latest package version:', error);
      return { error: { code: 500, message: 'Failed to fetch latest package version.' } };
    }
  }

  async installApplication(request: InstallApplicationRequest): ApiResponse<InstallApplicationResponse> {
    try {
      const response = await this.client.post<InstallApplicationResponse>(
        this.buildUrl('admin-api/install-application', this.baseUrl),
        request,
      );
      return response;
    } catch (error) {
      console.error('Error installing application:', error);
      return { error: { code: 500, message: 'Failed to install application.' } };
    }
  }

  // Context Management Methods
  async getContextsForApplication(applicationId: string): ApiResponse<ContextsResponse> {
    try {
      const response = await this.client.get<ContextsResponse>(
        this.buildUrl(`admin-api/contexts/for-application/${applicationId}`, this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching contexts for application:', error);
      return { error: { code: 500, message: 'Failed to fetch contexts for application.' } };
    }
  }

  async getContextsWithExecutorsForApplication(applicationId: string): ApiResponse<ContextsWithExecutorsResponse> {
    try {
      const response = await this.client.get<ContextsWithExecutorsResponse>(
        this.buildUrl(`admin-api/contexts/with-executors/for-application/${applicationId}`, this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching contexts with executors for application:', error);
      return { error: { code: 500, message: 'Failed to fetch contexts with executors for application.' } };
    }
  }
}
