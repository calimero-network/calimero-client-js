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
import { HttpClient } from '@calimero-network/mero-js';
import { withResponseData } from '../http-utils';
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
    return withResponseData(() =>
      this.client.get<RootKey[]>(this.buildUrl('admin/keys', this.baseUrl)),
    );
  }

  async getClientKeys(): ApiResponse<ClientKey[]> {
    return withResponseData(() =>
      this.client.get<ClientKey[]>(
        this.buildUrl('admin/keys/clients', this.baseUrl),
      ),
    );
  }

  async addRootKey(
    rootKeyRequest: RootKeyRequest,
  ): ApiResponse<RootKeyResponse> {
    return withResponseData(() =>
      this.client.post<RootKeyResponse>(
        this.buildUrl('admin/keys', this.baseUrl),
        rootKeyRequest,
      ),
    );
  }

  async revokeRootKey(keyId: string): ApiResponse<RootKeyResponse> {
    return withResponseData(() =>
      this.client.delete<RootKeyResponse>(
        this.buildUrl(`admin/keys/${keyId}`, this.baseUrl),
      ),
    );
  }

  async revokeClientKey(
    rootKeyId: string,
    clientId: string,
  ): ApiResponse<RootKeyResponse> {
    return withResponseData(() =>
      this.client.delete<RootKeyResponse>(
        this.buildUrl(
          `admin/keys/${rootKeyId}/clients/${clientId}`,
          this.baseUrl,
        ),
      ),
    );
  }

  async setKeyPermissions(
    keyId: string,
    request: UpdateKeyPermissionsRequest,
  ): ApiResponse<PermissionResponse> {
    return withResponseData(() =>
      this.client.put<PermissionResponse>(
        this.buildUrl(`admin/keys/${keyId}/permissions`, this.baseUrl),
        request,
      ),
    );
  }

  // Package Management Methods
  async getPackages(): ApiResponse<PackageListResponse> {
    return withResponseData(() =>
      this.client.get<PackageListResponse>(
        this.buildUrl('admin-api/packages', this.baseUrl),
      ),
    );
  }

  async getPackageVersions(
    packageName: string,
  ): ApiResponse<PackageVersionsResponse> {
    return withResponseData(() =>
      this.client.get<PackageVersionsResponse>(
        this.buildUrl(
          `admin-api/packages/${packageName}/versions`,
          this.baseUrl,
        ),
      ),
    );
  }

  async getPackageLatest(
    packageName: string,
  ): ApiResponse<PackageLatestResponse> {
    return withResponseData(() =>
      this.client.get<PackageLatestResponse>(
        this.buildUrl(`admin-api/packages/${packageName}/latest`, this.baseUrl),
      ),
    );
  }

  async installApplication(
    request: InstallApplicationRequest,
  ): ApiResponse<InstallApplicationResponse> {
    return withResponseData(() =>
      this.client.post<InstallApplicationResponse>(
        this.buildUrl('admin-api/install-application', this.baseUrl),
        request,
      ),
    );
  }

  // Context Management Methods
  async getContextsForApplication(
    applicationId: string,
  ): ApiResponse<ContextsResponse> {
    return withResponseData(() =>
      this.client.get<ContextsResponse>(
        this.buildUrl(
          `admin-api/contexts/for-application/${applicationId}`,
          this.baseUrl,
        ),
      ),
    );
  }

  async getContextsWithExecutorsForApplication(
    applicationId: string,
  ): ApiResponse<ContextsWithExecutorsResponse> {
    return withResponseData(() =>
      this.client.get<ContextsWithExecutorsResponse>(
        this.buildUrl(
          `admin-api/contexts/with-executors/for-application/${applicationId}`,
          this.baseUrl,
        ),
      ),
    );
  }
}
