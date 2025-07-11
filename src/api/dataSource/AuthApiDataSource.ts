import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '../httpClient';
import {
  AuthApi,
  LoginRequest,
  LoginResponse,
  ProvidersResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  BaseTokenRequest,
  TokenResponse,
  ChallengeResponse,
  GenerateClientKeyRequest,
} from '../authApi';
import {
  getAppEndpointKey,
  APP_URL,
  APPLICATION_ID,
} from '../../storage/storage';

export class AuthApiDataSource implements AuthApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  async login(request: LoginRequest): ApiResponse<LoginResponse> {
    try {
      window.location.href = `${request.url}/auth/login?callback-url=${encodeURIComponent(request.callbackUrl)}&permissions=${encodeURIComponent(request.permissions.join(','))}&${APPLICATION_ID}=${encodeURIComponent(request.applicationId)}&application-path=${encodeURIComponent(request.applicationPath)}&${APP_URL}=${encodeURIComponent(this.baseUrl)}`;
      return { data: null }; // The response doesn't matter as we're redirecting
    } catch (error) {
      console.error('Error during login redirect:', error);
      return {
        error: {
          code: 500,
          message: 'Login redirect failed. Please try again.',
        },
      };
    }
  }

  async refreshToken(
    request: RefreshTokenRequest,
  ): ApiResponse<RefreshTokenResponse> {
    try {
      const response = await this.client.post<RefreshTokenResponse>(
        `${this.baseUrl}/auth/refresh`,
        request,
      );
      return response;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        error: {
          code: 500,
          message: 'Token refresh failed. Please try again.',
        },
      };
    }
  }

  async getProviders(): ApiResponse<ProvidersResponse> {
    try {
      const response = await this.client.get<ProvidersResponse>(
        `${this.baseUrl}/auth/providers`,
      );
      return response;
    } catch (error) {
      console.error('Error getting providers:', error);
      return { error: { code: 500, message: 'Failed to get providers.' } };
    }
  }

  async requestToken(
    requestBody: BaseTokenRequest,
  ): ApiResponse<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>(
        `${this.baseUrl}/auth/token`,
        requestBody,
      );
      return response;
    } catch (error) {
      console.error('Error requesting token:', error);
      return {
        error: {
          code: 500,
          message: 'Token request failed. Please try again.',
        },
      };
    }
  }

  async getChallenge(): ApiResponse<ChallengeResponse> {
    try {
      const response = await this.client.get<ChallengeResponse>(
        `${this.baseUrl}/auth/challenge`,
      );
      return response;
    } catch (error) {
      console.error('Error getting challenge:', error);
      return { error: { code: 500, message: 'Failed to get challenge.' } };
    }
  }

  async generateClientKey(
    request: GenerateClientKeyRequest,
  ): ApiResponse<TokenResponse> {
    try {
      const response = await this.client.post<TokenResponse>(
        `${this.baseUrl}/admin/client-key`,
        request,
      );
      return response;
    } catch (error) {
      console.error('Error generating client key:', error);
      return {
        error: { code: 500, message: 'Failed to generate client key.' },
      };
    }
  }
}
