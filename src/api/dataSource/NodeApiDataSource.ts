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
import { HttpClient } from '@calimero-network/mero-js';
import { getAppEndpointKey } from '../../storage';
import { BaseApiDataSource } from './BaseApiDataSource';
import { withResponseData } from '../http-utils';

export class NodeApiDataSource extends BaseApiDataSource implements NodeApi {
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
    return getAppEndpointKey();
  }

  async health(request: HealthRequest): ApiResponse<HealthStatus> {
    return withResponseData(() =>
      this.client.get<HealthStatus>(
        this.buildUrl('admin-api/health', request.url),
      ),
    );
  }

  async getContext(contextId: string): ApiResponse<Context> {
    return withResponseData(() =>
      this.client.get<Context>(
        this.buildUrl(`admin-api/contexts/${contextId}`, this.baseUrl),
      ),
    );
  }

  async getContexts(): ApiResponse<GetContextsResponse> {
    return withResponseData(() =>
      this.client.get<GetContextsResponse>(
        this.buildUrl('admin-api/contexts', this.baseUrl),
      ),
    );
  }

  async createContext(
    applicationId: string,
    jsonParams: string,
    protocol: string,
  ): ApiResponse<CreateContextResponse> {
    const initializationParams =
      jsonParams === '' ? [] : Array.from(new TextEncoder().encode(jsonParams));

    return withResponseData(() =>
      this.client.post<CreateContextResponse>(
        this.buildUrl('admin-api/contexts', this.baseUrl),
        {
          applicationId,
          initializationParams,
          protocol,
        },
      ),
    );
  }

  async deleteContext(contextId: string): ApiResponse<DeleteContextResponse> {
    return withResponseData(() =>
      this.client.delete<DeleteContextResponse>(
        this.buildUrl(`admin-api/contexts/${contextId}`, this.baseUrl),
      ),
    );
  }

  async fetchContextIdentities(
    contextId: string,
  ): ApiResponse<FetchContextIdentitiesResponse> {
    return withResponseData(() =>
      this.client.get<FetchContextIdentitiesResponse>(
        this.buildUrl(
          `admin-api/contexts/${contextId}/identities-owned`,
          this.baseUrl,
        ),
      ),
    );
  }

  async createNewIdentity(): ApiResponse<NodeIdentity> {
    return withResponseData(() =>
      this.client.post<NodeIdentity>(
        this.buildUrl('admin-api/identity/context', this.baseUrl),
      ),
    );
  }

  async contextInvite(
    contextId: string,
    inviterPublicKey: string,
    inviteePublicKey: string,
  ): ApiResponse<string> {
    return withResponseData(() =>
      this.client.post<string>(
        this.buildUrl('admin-api/contexts/invite', this.baseUrl),
        {
          contextId: contextId,
          inviterId: inviterPublicKey,
          inviteeId: inviteePublicKey,
        },
      ),
    );
  }

  async contextInviteByOpenInvitation(
    contextId: string,
    inviterId: string,
    validForBlocks: number,
  ): ApiResponse<ContextInviteByOpenInvitationResponse> {
    return withResponseData(() =>
      this.client.post<ContextInviteByOpenInvitationResponse>(
        this.buildUrl(
          'admin-api/contexts/invite_by_open_invitation',
          this.baseUrl,
        ),
        {
          contextId,
          inviterId,
          validForBlocks,
        },
      ),
    );
  }

  async joinContextByOpenInvitation(
    invitation: SignedOpenInvitation,
    newMemberPublicKey: string,
  ): ApiResponse<JoinContextResponse> {
    return withResponseData(() =>
      this.client.post<JoinContextResponse>(
        this.buildUrl(
          'admin-api/contexts/join_by_open_invitation',
          this.baseUrl,
        ),
        {
          invitation,
          newMemberPublicKey,
        },
      ),
    );
  }

  async joinContext(
    invitationPayload: string,
  ): ApiResponse<JoinContextResponse> {
    return withResponseData(() =>
      this.client.post<JoinContextResponse>(
        this.buildUrl('admin-api/contexts/join', this.baseUrl),
        {
          invitationPayload,
        },
      ),
    );
  }

  // Application Management
  async getInstalledApplications(): ApiResponse<GetInstalledApplicationsResponse> {
    return withResponseData(() =>
      this.client.get<GetInstalledApplicationsResponse>(
        this.buildUrl('admin-api/applications', this.baseUrl),
      ),
    );
  }

  async getInstalledApplicationDetails(
    appId: string,
  ): ApiResponse<InstalledApplication> {
    return withResponseData(() =>
      this.client.get<InstalledApplication>(
        this.buildUrl(`admin-api/applications/${appId}`, this.baseUrl),
      ),
    );
  }

  async installApplication(
    url: string,
    metadata?: Uint8Array,
    hash?: string,
  ): ApiResponse<InstallApplicationResponse> {
    const requestBody: any = {
      url,
      metadata: metadata ? Array.from(metadata) : [],
      ...(hash ? { hash } : {}),
    };

    return withResponseData(() =>
      this.client.post<InstallApplicationResponse>(
        this.buildUrl('admin-api/install-application', this.baseUrl),
        requestBody,
      ),
    );
  }

  async uninstallApplication(
    applicationId: string,
  ): ApiResponse<UninstallApplicationResponse> {
    return withResponseData(() =>
      this.client.delete<UninstallApplicationResponse>(
        this.buildUrl(`admin-api/applications/${applicationId}`, this.baseUrl),
      ),
    );
  }

  // Context Management Extended
  async getContextClientKeys(
    contextId: string,
  ): ApiResponse<ContextClientKeysList> {
    return withResponseData(() =>
      this.client.get<ContextClientKeysList>(
        this.buildUrl(
          `admin-api/contexts/${contextId}/client-keys`,
          this.baseUrl,
        ),
      ),
    );
  }

  async getContextUsers(contextId: string): ApiResponse<ContextUsersList> {
    return withResponseData(() =>
      this.client.get<ContextUsersList>(
        this.buildUrl(
          `admin-api/contexts/${contextId}/identities`,
          this.baseUrl,
        ),
      ),
    );
  }

  async getContextStorageUsage(contextId: string): ApiResponse<ContextStorage> {
    return withResponseData(() =>
      this.client.get<ContextStorage>(
        this.buildUrl(`admin-api/contexts/${contextId}/storage`, this.baseUrl),
      ),
    );
  }

  async grantCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void> {
    return withResponseData(() =>
      this.client.post<void>(
        this.buildUrl(
          `admin-api/contexts/${contextId}/capabilities/grant`,
          this.baseUrl,
        ),
        request,
      ),
    );
  }

  async revokeCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void> {
    return withResponseData(() =>
      this.client.post<void>(
        this.buildUrl(
          `admin-api/contexts/${contextId}/capabilities/revoke`,
          this.baseUrl,
        ),
        request,
      ),
    );
  }

  async checkAuth(): ApiResponse<CheckAuthResponse> {
    return withResponseData(() =>
      this.client.get<CheckAuthResponse>(
        this.buildUrl('admin-api/is-authed', this.baseUrl),
      ),
    );
  }
}
