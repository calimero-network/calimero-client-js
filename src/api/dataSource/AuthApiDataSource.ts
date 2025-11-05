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
import { BaseApiDataSource } from './BaseApiDataSource';

export class AuthApiDataSource extends BaseApiDataSource implements AuthApi {
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
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

      // Prefer manifest-url (package-based) over application-id (legacy)
      if (request.manifestUrl) {
        loginUrl.searchParams.set('manifest-url', request.manifestUrl);
      } else if (request.applicationId) {
        loginUrl.searchParams.set(APPLICATION_ID, request.applicationId);
      }

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
        this.buildUrl('auth/refresh', this.baseUrl),
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
        this.buildUrl('auth/providers', this.baseUrl),
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
        this.buildUrl('auth/token', this.baseUrl),
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
        this.buildUrl('auth/challenge', this.baseUrl),
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
        this.buildUrl('admin/client-key', this.baseUrl),
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
