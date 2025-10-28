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
  ContextInviteByOpenInvitationResponse,
  SignedOpenInvitation,
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
      this.buildUrl('admin-api/health', request.url),
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
        this.buildUrl('admin-api/contexts', this.baseUrl),
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
        this.buildUrl(`admin-api/contexts/${contextId}`, this.baseUrl),
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
        this.buildUrl(
          `admin-api/contexts/${contextId}/identities-owned`,
          this.baseUrl,
        ),
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
        this.buildUrl('admin-api/identity/context', this.baseUrl),
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
        this.buildUrl('admin-api/contexts/invite', this.baseUrl),
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

  async contextInviteByOpenInvitation(
    contextId: string,
    inviterId: string,
    validForBlocks: number,
  ): ApiResponse<ContextInviteByOpenInvitationResponse> {
    try {
      const response = await this.client.post<ContextInviteByOpenInvitationResponse>(
        this.buildUrl('admin-api/contexts/invite_by_open_invitation', this.baseUrl),
        {
          contextId,
          inviterId,
          validForBlocks,
        },
      );
      return response;
    } catch (error) {
      console.error('Error creating open invitation:', error);
      return { error: { code: 500, message: 'Failed to create open invitation.' } };
    }
  }

  async joinContextByOpenInvitation(
    invitation: SignedOpenInvitation,
    newMemberPublicKey: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      const response = await this.client.post<JoinContextResponse>(
        this.buildUrl('admin-api/contexts/join_by_open_invitation', this.baseUrl),
        {
          invitation,
          newMemberPublicKey,
        },
      );
      return response;
    } catch (error) {
      console.error('Error joining context by open invitation:', error);
      return { error: { code: 500, message: 'Failed to join context by open invitation.' } };
    }
  }

  async joinContext(
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      const response = await this.client.post<JoinContextResponse>(
        this.buildUrl('admin-api/contexts/join', this.baseUrl),
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
        this.buildUrl('admin-api/applications', this.baseUrl),
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
        this.buildUrl(`admin-api/applications/${appId}`, this.baseUrl),
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
        this.buildUrl('admin-api/install-application', this.baseUrl),
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
        this.buildUrl(`admin-api/applications/${applicationId}`, this.baseUrl),
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
        this.buildUrl(
          `admin-api/contexts/${contextId}/client-keys`,
          this.baseUrl,
        ),
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
        this.buildUrl(
          `admin-api/contexts/${contextId}/identities`,
          this.baseUrl,
        ),
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
        this.buildUrl(`admin-api/contexts/${contextId}/storage`, this.baseUrl),
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
        this.buildUrl(
          `admin-api/contexts/${contextId}/capabilities/grant`,
          this.baseUrl,
        ),
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
        this.buildUrl(
          `admin-api/contexts/${contextId}/capabilities/revoke`,
          this.baseUrl,
        ),
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
      this.buildUrl('admin-api/is-authed', this.baseUrl),
    );
    return response;
  }
}
