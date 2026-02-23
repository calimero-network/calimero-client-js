import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '@calimero-network/mero-js';
import { withResponseData } from '../http-utils';
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

      // Strip hash fragment from callback URL - auth service will add tokens to hash
      // This prevents issues with existing hash fragments interfering with token processing
      const callbackUrlWithoutHash = request.callbackUrl.split('#')[0];

      const loginUrl = new URL('auth/login', request.url);
      loginUrl.searchParams.set('callback-url', callbackUrlWithoutHash);
      loginUrl.searchParams.set('permissions', request.permissions.join(','));

      // Set mode if provided (determines auth flow and token scoping)
      if (request.mode) {
        loginUrl.searchParams.set('mode', request.mode);
      }

      // Prefer manifest-url (package-based) over application-id (legacy)
      if (request.manifestUrl) {
        loginUrl.searchParams.set('manifest-url', request.manifestUrl);
      } else if (request.applicationId) {
        loginUrl.searchParams.set(APPLICATION_ID, request.applicationId);
      }

      // Only set application-path if provided (optional for package-based and admin flows)
      if (request.applicationPath) {
        loginUrl.searchParams.set('application-path', request.applicationPath);
      }

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
    return withResponseData(() =>
      this.client.post<RefreshTokenResponse>(
        this.buildUrl('auth/refresh', this.baseUrl),
        request,
      ),
    );
  }

  async getProviders(): ApiResponse<ProvidersResponse> {
    return withResponseData(() =>
      this.client.get<ProvidersResponse>(
        this.buildUrl('auth/providers', this.baseUrl),
      ),
    );
  }

  async requestToken(
    requestBody: BaseTokenRequest,
  ): ApiResponse<TokenResponse> {
    return withResponseData(() =>
      this.client.post<TokenResponse>(
        this.buildUrl('auth/token', this.baseUrl),
        requestBody,
      ),
    );
  }

  async getChallenge(): ApiResponse<ChallengeResponse> {
    return withResponseData(() =>
      this.client.get<ChallengeResponse>(
        this.buildUrl('auth/challenge', this.baseUrl),
      ),
    );
  }

  async generateClientKey(
    request: GenerateClientKeyRequest,
  ): ApiResponse<TokenResponse> {
    const nodeBaseUrl = getAppEndpointKey();
    if (!nodeBaseUrl) {
      return {
        error: {
          code: 400,
          message: 'Node URL not configured. Please set the app endpoint key.',
        },
      };
    }
    const url = this.buildUrl('admin/client-key', nodeBaseUrl);
    return withResponseData(() =>
      this.client.post<TokenResponse>(url, request),
    );
  }
}
