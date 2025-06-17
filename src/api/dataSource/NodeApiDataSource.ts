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
} from '../nodeApi';
import { HttpClient } from '../httpClient';
import { getAppEndpointKey } from '../../storage';

export class NodeApiDataSource implements NodeApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  async health(request: HealthRequest): ApiResponse<HealthStatus> {
    return await this.client.get<HealthStatus>(
      `${request.url}/admin-api/health`,
    );
  }

  async getContext(contextId: string): ApiResponse<Context> {
    try {
      return this.client.get<Context>(
        `${this.baseUrl}/admin-api/contexts/${contextId}`,
      );
    } catch (error) {
      console.error('Error fetching context:', error);
      return { data: null, error: { code: 500, message: 'Failed to fetch context data.' } };
    }
  }

  async getContexts(): ApiResponse<GetContextsResponse> {
    try {
      const response = await this.client.get<GetContextsResponse>(
        `${this.baseUrl}/admin-api/contexts`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching contexts:', error);
      return { error: { code: 500, message: 'Failed to fetch context data.' } };
    }
  }

  async createContext(
    applicationId: string,
    protocol: string,
  ): ApiResponse<CreateContextResponse> {
    try {
      const response = await this.client.post<CreateContextResponse>(
        `${this.baseUrl}/admin-api/contexts`,
        {
          applicationId,
          initializationParams: [],
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
        `${this.baseUrl}/admin-api/contexts/${contextId}`,
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
        `${this.baseUrl}/admin-api/contexts/${contextId}/identities-owned`,
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
        `${this.baseUrl}/admin-api/identity/context`,
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
        `${this.baseUrl}/admin-api/contexts/invite`,
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
    privateKey: string,
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      const response = await this.client.post<JoinContextResponse>(
        `${this.baseUrl}/admin-api/contexts/join`,
        {
          privateKey,
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
        `${this.baseUrl}/admin-api/applications`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching installed applications:', error);
      return { error: { code: 500, message: 'Failed to fetch installed applications.' } };
    }
  }

  async getInstalledApplicationDetails(appId: string): ApiResponse<InstalledApplication> {
    try {
      const response = await this.client.get<InstalledApplication>(
        `${this.baseUrl}/admin-api/applications/${appId}`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching application details:', error);
      return { error: { code: 500, message: 'Failed to fetch application details.' } };
    }
  }

  async installApplication(
    url: string,
    metadata: Uint8Array,
    hash?: string,
  ): ApiResponse<InstallApplicationResponse> {
    try {
      const requestBody = {
        url,
        metadata: Array.from(metadata),
        ...(hash ? { hash } : {})
      };

      const response = await this.client.post<InstallApplicationResponse>(
        `${this.baseUrl}/admin-api/install-application`,
        requestBody
      );
      return response;
    } catch (error) {
      console.error('Error installing application:', error);
      return { error: { code: 500, message: 'Failed to install application.' } };
    }
  }

  async uninstallApplication(applicationId: string): ApiResponse<UninstallApplicationResponse> {
    try {
      const response = await this.client.delete<UninstallApplicationResponse>(
        `${this.baseUrl}/admin-api/applications/${applicationId}`,
      );
      return response;
    } catch (error) {
      console.error('Error uninstalling application:', error);
      return { error: { code: 500, message: 'Failed to uninstall application.' } };
    }
  }

  // Context Management Extended
  async getContextClientKeys(contextId: string): ApiResponse<ContextClientKeysList> {
    try {
      const response = await this.client.get<ContextClientKeysList>(
        `${this.baseUrl}/admin-api/contexts/${contextId}/client-keys`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching context client keys:', error);
      return { error: { code: 500, message: 'Failed to fetch context client keys.' } };
    }
  }

  async getContextUsers(contextId: string): ApiResponse<ContextUsersList> {
    try {
      const response = await this.client.get<ContextUsersList>(
        `${this.baseUrl}/admin-api/contexts/${contextId}/identities`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching context users:', error);
      return { error: { code: 500, message: 'Failed to fetch context users.' } };
    }
  }

  async getContextStorageUsage(contextId: string): ApiResponse<ContextStorage> {
    try {
      const response = await this.client.get<ContextStorage>(
        `${this.baseUrl}/admin-api/contexts/${contextId}/storage`,
      );
      return response;
    } catch (error) {
      console.error('Error fetching context storage usage:', error);
      return { error: { code: 500, message: 'Failed to fetch context storage usage.' } };
    }
  }

  async grantCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void> {
    try {
      const response = await this.client.post<void>(
        `${this.baseUrl}/admin-api/contexts/${contextId}/capabilities/grant`,
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
        `${this.baseUrl}/admin-api/contexts/${contextId}/capabilities/revoke`,
        request,
      );
      return response;
    } catch (error) {
      console.error('Error revoking capabilities:', error);
      return { error: { code: 500, message: 'Failed to revoke capabilities.' } };
    }
  }
}
