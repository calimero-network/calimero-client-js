import { ApiResponse } from '../../types/api-response';
import {
  Context,
  CreateContextResponse,
  DeleteContextResponse,
  FetchContextIdentitiesResponse,
  GetContextsResponse,
  HealthRequest,
  HealthStatus,
  JoinContextResponse,
  NodeApi,
  NodeIdentity,
  GetInstalledApplicationsResponse,
  InstalledApplication,
  InstallApplicationResponse,
  UninstallApplicationResponse,
  ContextClientKeysList,
  ContextUsersList,
  ContextStorage,
  CapabilitiesRequest,
  CheckAuthResponse,
} from '../nodeApi';
import { HttpClient } from '../httpClient';
import { getAppEndpointKey } from '../../storage';
import { BaseApiDataSource } from './BaseApiDataSource';

export class NodeApiDataSource extends BaseApiDataSource implements NodeApi {
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
    return getAppEndpointKey();
  }

  async health(request: HealthRequest): ApiResponse<HealthStatus> {
    return await this.client.get<HealthStatus>(
      new URL('admin-api/health', request.url).toString(),
    );
  }

  async getContext(contextId: string): ApiResponse<Context> {
    try {
      return this.client.get<Context>(
        this.buildUrl(`admin-api/contexts/${contextId}`, this.baseUrl),
      );
    } catch (error) {
      console.error('Error fetching context:', error);
      return {
        data: null,
        error: { code: 500, message: 'Failed to fetch context data.' },
      };
    }
  }

  async getContexts(): ApiResponse<GetContextsResponse> {
    try {
      const response = await this.client.get<GetContextsResponse>(
        this.buildUrl('admin-api/contexts', this.baseUrl),
      );
      return response;
    } catch (error) {
      console.error('Error fetching contexts:', error);
      return { error: { code: 500, message: 'Failed to fetch context data.' } };
    }
  }

  async createContext(
    applicationId: string,
    jsonParams: string,
    protocol: string,
  ): ApiResponse<CreateContextResponse> {
    const initializationParams =
      jsonParams === '' ? [] : Array.from(new TextEncoder().encode(jsonParams));

    try {
      const response = await this.client.post<CreateContextResponse>(
        new URL('admin-api/contexts', this.baseUrl).toString(),
        {
          applicationId,
          initializationParams,
          protocol,
        },
      );
      return response;
    } catch (error) {
      console.error('Error starting contexts:', error);
      return { error: { code: 500, message: 'Failed to start context.' } };
    }
  }

  async deleteContext(contextId: string): ApiResponse<DeleteContextResponse> {
    try {
      const response = await this.client.delete<DeleteContextResponse>(
        new URL(`admin-api/contexts/${contextId}`, this.baseUrl).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error deleting context:', error);
      return { error: { code: 500, message: 'Failed to delete context.' } };
    }
  }

  async fetchContextIdentities(
    contextId: string,
  ): ApiResponse<FetchContextIdentitiesResponse> {
    try {
      const response = await this.client.get<FetchContextIdentitiesResponse>(
        new URL(
          `admin-api/contexts/${contextId}/identities-owned`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error deleting context:', error);
      return { error: { code: 500, message: 'Failed to delete context.' } };
    }
  }

  async createNewIdentity(): ApiResponse<NodeIdentity> {
    try {
      const response = await this.client.post<NodeIdentity>(
        new URL('admin-api/identity/context', this.baseUrl).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error creating new identity:', error);
      return {
        error: { code: 500, message: 'Failed to create new identity.' },
      };
    }
  }

  async contextInvite(
    contextId: string,
    inviterPublicKey: string,
    inviteePublicKey: string,
  ): ApiResponse<string> {
    try {
      const response = await this.client.post<string>(
        new URL('admin-api/contexts/invite', this.baseUrl).toString(),
        {
          contextId: contextId,
          inviterId: inviterPublicKey,
          inviteeId: inviteePublicKey,
        },
      );
      return response;
    } catch (error) {
      console.error('Error inviting to context:', error);
      return { error: { code: 500, message: 'Failed to invite to context.' } };
    }
  }

  async joinContext(
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      const response = await this.client.post<JoinContextResponse>(
        new URL('admin-api/contexts/join', this.baseUrl).toString(),
        {
          invitationPayload,
        },
      );
      return response;
    } catch (error) {
      console.error('Error joining context:', error);
      return { error: { code: 500, message: 'Failed to join context.' } };
    }
  }

  // Application Management
  async getInstalledApplications(): ApiResponse<GetInstalledApplicationsResponse> {
    try {
      const response = await this.client.get<GetInstalledApplicationsResponse>(
        new URL('admin-api/applications', this.baseUrl).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error fetching installed applications:', error);
      return {
        error: {
          code: 500,
          message: 'Failed to fetch installed applications.',
        },
      };
    }
  }

  async getInstalledApplicationDetails(
    appId: string,
  ): ApiResponse<InstalledApplication> {
    try {
      const response = await this.client.get<InstalledApplication>(
        new URL(`admin-api/applications/${appId}`, this.baseUrl).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error fetching application details:', error);
      return {
        error: { code: 500, message: 'Failed to fetch application details.' },
      };
    }
  }

  async installApplication(
    url: string,
    metadata?: Uint8Array,
    hash?: string,
  ): ApiResponse<InstallApplicationResponse> {
    try {
      const requestBody: any = {
        url,
        metadata: metadata ? Array.from(metadata) : [],
        ...(hash ? { hash } : {}),
      };

      const response = await this.client.post<InstallApplicationResponse>(
        new URL('admin-api/install-application', this.baseUrl).toString(),
        requestBody,
      );
      return response;
    } catch (error) {
      console.error('Error installing application:', error);
      return {
        error: { code: 500, message: 'Failed to install application.' },
      };
    }
  }

  async uninstallApplication(
    applicationId: string,
  ): ApiResponse<UninstallApplicationResponse> {
    try {
      const response = await this.client.delete<UninstallApplicationResponse>(
        new URL(
          `admin-api/applications/${applicationId}`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error uninstalling application:', error);
      return {
        error: { code: 500, message: 'Failed to uninstall application.' },
      };
    }
  }

  // Context Management Extended
  async getContextClientKeys(
    contextId: string,
  ): ApiResponse<ContextClientKeysList> {
    try {
      const response = await this.client.get<ContextClientKeysList>(
        new URL(
          `admin-api/contexts/${contextId}/client-keys`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error fetching context client keys:', error);
      return {
        error: { code: 500, message: 'Failed to fetch context client keys.' },
      };
    }
  }

  async getContextUsers(contextId: string): ApiResponse<ContextUsersList> {
    try {
      const response = await this.client.get<ContextUsersList>(
        new URL(
          `admin-api/contexts/${contextId}/identities`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error fetching context users:', error);
      return {
        error: { code: 500, message: 'Failed to fetch context users.' },
      };
    }
  }

  async getContextStorageUsage(contextId: string): ApiResponse<ContextStorage> {
    try {
      const response = await this.client.get<ContextStorage>(
        new URL(
          `admin-api/contexts/${contextId}/storage`,
          this.baseUrl,
        ).toString(),
      );
      return response;
    } catch (error) {
      console.error('Error fetching context storage usage:', error);
      return {
        error: { code: 500, message: 'Failed to fetch context storage usage.' },
      };
    }
  }

  async grantCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void> {
    try {
      const response = await this.client.post<void>(
        new URL(
          `admin-api/contexts/${contextId}/capabilities/grant`,
          this.baseUrl,
        ).toString(),
        request,
      );
      return response;
    } catch (error) {
      console.error('Error granting capabilities:', error);
      return { error: { code: 500, message: 'Failed to grant capabilities.' } };
    }
  }

  async revokeCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void> {
    try {
      const response = await this.client.post<void>(
        new URL(
          `admin-api/contexts/${contextId}/capabilities/revoke`,
          this.baseUrl,
        ).toString(),
        request,
      );
      return response;
    } catch (error) {
      console.error('Error revoking capabilities:', error);
      return {
        error: { code: 500, message: 'Failed to revoke capabilities.' },
      };
    }
  }

  async checkAuth(): ApiResponse<CheckAuthResponse> {
    const response = await this.client.get<CheckAuthResponse>(
      new URL('admin-api/is-authed', this.baseUrl).toString(),
    );
    return response;
  }
}
