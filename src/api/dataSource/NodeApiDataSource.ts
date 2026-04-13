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
  InviteToContextResponse,
  SignedOpenInvitation,
  CreateGroupRequest,
  CreateGroupResponse,
  ListGroupsResponse,
  GroupInfoResponse,
  ListGroupMembersResponse,
  AddGroupMembersRequest,
  RemoveGroupMembersRequest,
  ListGroupContextsResponse,
  GroupInvitationResponse,
  JoinGroupRequest,
  JoinGroupResponse,
  MemberCapabilities,
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
  ): ApiResponse<CreateContextResponse> {
    const initializationParams =
      jsonParams === '' ? [] : Array.from(new TextEncoder().encode(jsonParams));

    try {
      const response = await this.client.post<CreateContextResponse>(
        this.buildUrl('admin-api/contexts', this.baseUrl),
        {
          applicationId,
          initializationParams,
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
    inviterId: string,
    validForSeconds: number,
  ): ApiResponse<InviteToContextResponse> {
    try {
      const response = await this.client.post<InviteToContextResponse>(
        this.buildUrl('admin-api/contexts/invite', this.baseUrl),
        {
          contextId,
          inviterId,
          validForSeconds,
        },
      );
      return response;
    } catch (error) {
      console.error('Error inviting to context:', error);
      return { error: { code: 500, message: 'Failed to invite to context.' } };
    }
  }

  async joinContext(
    invitation: SignedOpenInvitation,
    newMemberPublicKey: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      const response = await this.client.post<JoinContextResponse>(
        this.buildUrl('admin-api/contexts/join', this.baseUrl),
        {
          invitation,
          newMemberPublicKey,
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

  // ── Group Management ──

  async listGroups(): ApiResponse<ListGroupsResponse> {
    try {
      return await this.client.get<ListGroupsResponse>(
        this.buildUrl('admin-api/groups', this.baseUrl),
      );
    } catch (error) {
      console.error('Error listing groups:', error);
      return { error: { code: 500, message: 'Failed to list groups.' } };
    }
  }

  async createGroup(
    request: CreateGroupRequest,
  ): ApiResponse<CreateGroupResponse> {
    try {
      return await this.client.post<CreateGroupResponse>(
        this.buildUrl('admin-api/groups', this.baseUrl),
        request,
      );
    } catch (error) {
      console.error('Error creating group:', error);
      return { error: { code: 500, message: 'Failed to create group.' } };
    }
  }

  async getGroupInfo(groupId: string): ApiResponse<GroupInfoResponse> {
    try {
      return await this.client.get<GroupInfoResponse>(
        this.buildUrl(`admin-api/groups/${groupId}`, this.baseUrl),
      );
    } catch (error) {
      console.error('Error getting group info:', error);
      return { error: { code: 500, message: 'Failed to get group info.' } };
    }
  }

  async deleteGroup(groupId: string): ApiResponse<void> {
    try {
      return await this.client.delete<void>(
        this.buildUrl(`admin-api/groups/${groupId}`, this.baseUrl),
      );
    } catch (error) {
      console.error('Error deleting group:', error);
      return { error: { code: 500, message: 'Failed to delete group.' } };
    }
  }

  async listGroupMembers(
    groupId: string,
  ): ApiResponse<ListGroupMembersResponse> {
    try {
      return await this.client.get<ListGroupMembersResponse>(
        this.buildUrl(`admin-api/groups/${groupId}/members`, this.baseUrl),
      );
    } catch (error) {
      console.error('Error listing group members:', error);
      return { error: { code: 500, message: 'Failed to list group members.' } };
    }
  }

  async addGroupMembers(
    groupId: string,
    request: AddGroupMembersRequest,
  ): ApiResponse<void> {
    try {
      return await this.client.post<void>(
        this.buildUrl(`admin-api/groups/${groupId}/members`, this.baseUrl),
        request,
      );
    } catch (error) {
      console.error('Error adding group members:', error);
      return { error: { code: 500, message: 'Failed to add group members.' } };
    }
  }

  async removeGroupMembers(
    groupId: string,
    request: RemoveGroupMembersRequest,
  ): ApiResponse<void> {
    try {
      return await this.client.post<void>(
        this.buildUrl(
          `admin-api/groups/${groupId}/members/remove`,
          this.baseUrl,
        ),
        request,
      );
    } catch (error) {
      console.error('Error removing group members:', error);
      return {
        error: { code: 500, message: 'Failed to remove group members.' },
      };
    }
  }

  async listGroupContexts(
    groupId: string,
  ): ApiResponse<ListGroupContextsResponse> {
    try {
      return await this.client.get<ListGroupContextsResponse>(
        this.buildUrl(`admin-api/groups/${groupId}/contexts`, this.baseUrl),
      );
    } catch (error) {
      console.error('Error listing group contexts:', error);
      return {
        error: { code: 500, message: 'Failed to list group contexts.' },
      };
    }
  }

  async joinGroupContext(
    groupId: string,
    contextId: string,
  ): ApiResponse<JoinContextResponse> {
    try {
      return await this.client.post<JoinContextResponse>(
        this.buildUrl(`admin-api/groups/${groupId}/join-context`, this.baseUrl),
        { contextId },
      );
    } catch (error) {
      console.error('Error joining group context:', error);
      return {
        error: { code: 500, message: 'Failed to join group context.' },
      };
    }
  }

  async createGroupInvitation(
    groupId: string,
  ): ApiResponse<GroupInvitationResponse> {
    try {
      return await this.client.post<GroupInvitationResponse>(
        this.buildUrl(`admin-api/groups/${groupId}/invite`, this.baseUrl),
        {},
      );
    } catch (error) {
      console.error('Error creating group invitation:', error);
      return {
        error: { code: 500, message: 'Failed to create group invitation.' },
      };
    }
  }

  async joinGroup(request: JoinGroupRequest): ApiResponse<JoinGroupResponse> {
    try {
      return await this.client.post<JoinGroupResponse>(
        this.buildUrl('admin-api/groups/join', this.baseUrl),
        request,
      );
    } catch (error) {
      console.error('Error joining group:', error);
      return { error: { code: 500, message: 'Failed to join group.' } };
    }
  }

  async setMemberCapabilities(
    groupId: string,
    memberId: string,
    capabilities: number,
  ): ApiResponse<void> {
    try {
      return await this.client.put<void>(
        this.buildUrl(
          `admin-api/groups/${groupId}/members/${memberId}/capabilities`,
          this.baseUrl,
        ),
        { capabilities },
      );
    } catch (error) {
      console.error('Error setting member capabilities:', error);
      return {
        error: { code: 500, message: 'Failed to set member capabilities.' },
      };
    }
  }

  async getMemberCapabilities(
    groupId: string,
    memberId: string,
  ): ApiResponse<MemberCapabilities> {
    try {
      return await this.client.get<MemberCapabilities>(
        this.buildUrl(
          `admin-api/groups/${groupId}/members/${memberId}/capabilities`,
          this.baseUrl,
        ),
      );
    } catch (error) {
      console.error('Error getting member capabilities:', error);
      return {
        error: { code: 500, message: 'Failed to get member capabilities.' },
      };
    }
  }
}
