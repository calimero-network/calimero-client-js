import { ApiResponse } from '../../types/api-response';
import {
  CreateContextResponse,
  DeleteContextResponse,
  GetContextsResponse,
  HealthRequest,
  HealthStatus,
  JwtTokenResponse,
  NodeApi,
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
      console.log('Context created:', response);
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
}
