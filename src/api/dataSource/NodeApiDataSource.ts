import { ApiResponse } from '../../types/api-response';
import {
  CreateContextResponse,
  DeleteContextResponse,
  FetchContextIdentitiesResponse,
  GetContextsResponse,
  HealthRequest,
  HealthStatus,
  JoinContextResponse,
  JwtTokenResponse,
  NodeApi,
  NodeIdentity,
} from '../nodeApi';
import { HttpClient } from '../httpClient';
import { getAppEndpointKey } from '../../storage';

export class NodeApiDataSource implements NodeApi {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async refreshToken(
    refreshToken: string,
    rpcBaseUrl: string,
  ): ApiResponse<JwtTokenResponse> {
    return await this.client.post<JwtTokenResponse>(
      `${rpcBaseUrl}/admin-api/refresh-jwt-token`,
      {
        refreshToken,
      },
    );
  }

  async health(request: HealthRequest): ApiResponse<HealthStatus> {
    return await this.client.get<HealthStatus>(
      `${request.url}/admin-api/health`,
    );
  }

  async getContexts(): ApiResponse<GetContextsResponse> {
    try {
      const response = await this.client.get<GetContextsResponse>(
        `${getAppEndpointKey()}/admin-api/contexts`,
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
        `${getAppEndpointKey()}/admin-api/contexts`,
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
        `${getAppEndpointKey()}/admin-api/contexts/${contextId}`,
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
        `${getAppEndpointKey()}/admin-api/contexts/${contextId}/identities-owned`,
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
        `${getAppEndpointKey()}/admin-api/identity/context`,
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
        `${getAppEndpointKey()}/admin-api/contexts/invite`,
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
        `${getAppEndpointKey()}/admin-api/contexts/join`,
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
}
