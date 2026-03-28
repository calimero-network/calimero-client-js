import { ApiResponse } from '../types/api-response';

export interface HealthRequest {
  url: string;
}

export interface HealthStatus {
  status: string;
}

export interface CreateContextResponse {
  contextId: string;
  memberPublicKey: string;
}

export interface DeleteContextResponse {
  isDeleted: boolean;
}

export interface Context {
  applicationId: string;
  id: string;
  rootHash: String;
}

export interface GetContextsResponse {
  contexts: Context[];
}

export interface FetchContextIdentitiesResponse {
  identities: string[];
}

export interface NodeIdentity {
  publicKey: string;
  privateKey: string;
}

export interface InvitationFromMember {
  inviterIdentity: string;
  contextId: string;
  expirationTimestamp: number;
  secretSalt?: Uint8Array;
}

export interface SignedOpenInvitation {
  invitation: InvitationFromMember;
  inviterSignature: string;
  applicationId?: number[];
  blobId?: number[];
  source?: string;
  groupId?: number[];
}

export interface InviteToContextResponse {
  data: SignedOpenInvitation | null;
}

export interface JoinContextResponse {
  contextId: string;
  memberPublicKey: string;
}

// Application Management Interfaces
export interface InstalledApplication {
  id: string;
  blob: string;
  version: string | null;
  source: string;
  metadata: number[];
}

export interface GetInstalledApplicationsResponse {
  apps: InstalledApplication[];
}

export interface InstallApplicationResponse {
  applicationId: string;
}

export interface UninstallApplicationResponse {
  applicationId: string;
}

// Context Management Extended Interfaces
export interface ContextClientKey {
  client_id: string;
  root_key_id: string;
  name: string;
  permissions: string[];
  created_at: number;
  revoked_at?: number;
  is_valid: boolean;
}

export interface ContextClientKeysList {
  clientKeys: ContextClientKey[];
}

export interface ContextUsersList {
  identities: string[];
}

export interface ContextStorage {
  sizeInBytes: number;
}

// ── Group Management ──

export type GroupMemberRole = 'Admin' | 'Member' | 'ReadOnly';

export interface GroupInfo {
  groupId: string;
  appKey: string;
  targetApplicationId: string;
  upgradePolicy: string;
  memberCount: number;
  contextCount: number;
  alias?: string;
}

export interface GroupMember {
  identity: string;
  role: GroupMemberRole;
  alias?: string;
}

export interface GroupContext {
  contextId: string;
  alias?: string;
}

export interface CreateGroupRequest {
  applicationId: string;
  parentGroupId?: string;
  upgradePolicy?: string;
  alias?: string;
}

export interface CreateGroupResponse {
  data: { groupId: string };
}

export interface ListGroupsResponse {
  data: GroupInfo[];
}

export interface GroupInfoResponse {
  data: GroupInfo;
}

export interface ListGroupMembersResponse {
  data: GroupMember[];
  selfIdentity: string;
}

export interface ListGroupContextsResponse {
  data: GroupContext[];
}

export interface AddGroupMembersRequest {
  members: Array<{ identity: string; role: GroupMemberRole }>;
}

export interface RemoveGroupMembersRequest {
  members: string[];
}

export interface GroupInvitationResponse {
  data: SignedOpenInvitation;
}

export interface JoinGroupRequest {
  invitation: SignedOpenInvitation;
  groupAlias?: string;
}

export interface JoinGroupResponse {
  groupId: string;
  memberIdentity: string;
}

export interface MemberCapabilities {
  capabilities: number;
}

export interface CapabilitiesRequest {
  capabilities: Array<[string, string]>; // [ContextIdentity, Capability]
  signer_id: string;
}

export interface CheckAuthResponse {
  payload: Record<string, any>;
}

export interface NodeApi {
  health(request: HealthRequest): ApiResponse<HealthStatus>;
  getContext(contextId: string): ApiResponse<Context>;
  getContexts(): ApiResponse<GetContextsResponse>;
  deleteContext(contextId: string): ApiResponse<DeleteContextResponse>;
  createContext(
    applicationId: string,
    jsonParams: string,
  ): ApiResponse<CreateContextResponse>;
  fetchContextIdentities(
    contextId: string,
  ): ApiResponse<FetchContextIdentitiesResponse>;
  createNewIdentity(): ApiResponse<NodeIdentity>;
  contextInvite(
    contextId: string,
    inviterId: string,
    validForSeconds: number,
  ): ApiResponse<InviteToContextResponse>;
  joinContext(
    invitation: SignedOpenInvitation,
    newMemberPublicKey: string,
  ): ApiResponse<JoinContextResponse>;

  // Application Management
  getInstalledApplications(): ApiResponse<GetInstalledApplicationsResponse>;
  getInstalledApplicationDetails(
    appId: string,
  ): ApiResponse<InstalledApplication | null>;
  installApplication(
    url: string,
    metadata?: Uint8Array,
    hash?: string,
  ): ApiResponse<InstallApplicationResponse>;
  uninstallApplication(
    applicationId: string,
  ): ApiResponse<UninstallApplicationResponse>;

  // Context Management Extended
  getContextClientKeys(contextId: string): ApiResponse<ContextClientKeysList>;
  getContextUsers(contextId: string): ApiResponse<ContextUsersList>;
  getContextStorageUsage(contextId: string): ApiResponse<ContextStorage>;

  // Capabilities Management
  grantCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void>;
  revokeCapabilities(
    contextId: string,
    request: CapabilitiesRequest,
  ): ApiResponse<void>;
  checkAuth(): ApiResponse<CheckAuthResponse>;

  // Group Management
  listGroups(): ApiResponse<ListGroupsResponse>;
  createGroup(request: CreateGroupRequest): ApiResponse<CreateGroupResponse>;
  getGroupInfo(groupId: string): ApiResponse<GroupInfoResponse>;
  deleteGroup(groupId: string): ApiResponse<void>;
  listGroupMembers(groupId: string): ApiResponse<ListGroupMembersResponse>;
  addGroupMembers(
    groupId: string,
    request: AddGroupMembersRequest,
  ): ApiResponse<void>;
  removeGroupMembers(
    groupId: string,
    request: RemoveGroupMembersRequest,
  ): ApiResponse<void>;
  listGroupContexts(groupId: string): ApiResponse<ListGroupContextsResponse>;
  joinGroupContext(
    groupId: string,
    contextId: string,
  ): ApiResponse<JoinContextResponse>;
  createGroupInvitation(
    groupId: string,
  ): ApiResponse<GroupInvitationResponse>;
  joinGroup(request: JoinGroupRequest): ApiResponse<JoinGroupResponse>;
  setMemberCapabilities(
    groupId: string,
    memberId: string,
    capabilities: number,
  ): ApiResponse<void>;
  getMemberCapabilities(
    groupId: string,
    memberId: string,
  ): ApiResponse<MemberCapabilities>;
}
