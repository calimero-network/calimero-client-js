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

  private validateBaseUrl(): ApiResponse<never> | null {
    if (!this.baseUrl) {
      return Promise.resolve({
        data: null,
        error: {
          code: 400,
          message:
            'Auth endpoint URL not configured. Please set the auth endpoint.',
        },
      });
    }
    return null;
  }

  async getRootKeys(): ApiResponse<RootKey[]> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<RootKey[]>(this.buildUrl('admin/keys', this.baseUrl!)),
    );
  }

  async getClientKeys(): ApiResponse<ClientKey[]> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<ClientKey[]>(
        this.buildUrl('admin/keys/clients', this.baseUrl!),
      ),
    );
  }

  async addRootKey(
    rootKeyRequest: RootKeyRequest,
  ): ApiResponse<RootKeyResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.post<RootKeyResponse>(
        this.buildUrl('admin/keys', this.baseUrl!),
        rootKeyRequest,
      ),
    );
  }

  async revokeRootKey(keyId: string): ApiResponse<RootKeyResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.delete<RootKeyResponse>(
        this.buildUrl(`admin/keys/${keyId}`, this.baseUrl!),
      ),
    );
  }

  async revokeClientKey(
    rootKeyId: string,
    clientId: string,
  ): ApiResponse<RootKeyResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.delete<RootKeyResponse>(
        this.buildUrl(
          `admin/keys/${rootKeyId}/clients/${clientId}`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async setKeyPermissions(
    keyId: string,
    request: UpdateKeyPermissionsRequest,
  ): ApiResponse<PermissionResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.put<PermissionResponse>(
        this.buildUrl(`admin/keys/${keyId}/permissions`, this.baseUrl!),
        request,
      ),
    );
  }

  // Package Management Methods
  async getPackages(): ApiResponse<PackageListResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<PackageListResponse>(
        this.buildUrl('admin-api/packages', this.baseUrl!),
      ),
    );
  }

  async getPackageVersions(
    packageName: string,
  ): ApiResponse<PackageVersionsResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<PackageVersionsResponse>(
        this.buildUrl(
          `admin-api/packages/${packageName}/versions`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getPackageLatest(
    packageName: string,
  ): ApiResponse<PackageLatestResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<PackageLatestResponse>(
        this.buildUrl(
          `admin-api/packages/${packageName}/latest`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async installApplication(
    request: InstallApplicationRequest,
  ): ApiResponse<InstallApplicationResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.post<InstallApplicationResponse>(
        this.buildUrl('admin-api/install-application', this.baseUrl!),
        request,
      ),
    );
  }

  // Context Management Methods
  async getContextsForApplication(
    applicationId: string,
  ): ApiResponse<ContextsResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<ContextsResponse>(
        this.buildUrl(
          `admin-api/contexts/for-application/${applicationId}`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getContextsWithExecutorsForApplication(
    applicationId: string,
  ): ApiResponse<ContextsWithExecutorsResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<ContextsWithExecutorsResponse>(
        this.buildUrl(
          `admin-api/contexts/with-executors/for-application/${applicationId}`,
          this.baseUrl!,
        ),
      ),
    );
  }
}
