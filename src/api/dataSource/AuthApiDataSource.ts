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
  APP_URL,
  APPLICATION_ID,
  getAuthEndpointURL,
  setAuthEndpointURL,
  getAppEndpointKey,
} from '../../storage/storage';

export class AuthApiDataSource implements AuthApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAuthEndpointURL();
  }

  async login(request: LoginRequest): ApiResponse<LoginResponse> {
    try {
      setAuthEndpointURL(request.url);

      // Get the original application URL from localStorage, fallback to callbackUrl if not available
      const originalAppUrl = getAppEndpointKey() || request.callbackUrl;

      const loginUrl = new URL('auth/login', request.url);
      loginUrl.searchParams.set('callback-url', request.callbackUrl);
      loginUrl.searchParams.set('permissions', request.permissions.join(','));
      loginUrl.searchParams.set(APPLICATION_ID, request.applicationId);
      loginUrl.searchParams.set('application-path', request.applicationPath);
      loginUrl.searchParams.set(APP_URL, originalAppUrl);

      window.location.href = loginUrl.href;
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
        new URL('auth/refresh', this.baseUrl).toString(),
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
        new URL('auth/providers', this.baseUrl).toString(),
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
        new URL('auth/token', this.baseUrl).toString(),
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
        new URL('auth/challenge', this.baseUrl).toString(),
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
        new URL('admin/client-key', this.baseUrl).toString(),
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
