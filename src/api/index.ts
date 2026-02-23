import { createBrowserHttpClient, HttpClient } from '@calimero-network/mero-js';
import {
  getAppEndpointKey,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getAuthEndpointURL,
  clearAccessToken,
  clearRefreshToken,
} from '../storage';
import { RefreshTokenResponse } from './authApi';
import { NodeApi } from './nodeApi';
import { NodeApiDataSource } from './dataSource/NodeApiDataSource';
import { AuthApi } from './authApi';
import { AuthApiDataSource } from './dataSource/AuthApiDataSource';
import { ContractApi } from './contractApi';
import { ContractApiDataSource } from './dataSource/ContractApiDataSource';
import { JsonRpcClient } from '../rpc/jsonrpc';
import { RpcClient } from '../types/rpc';
import { AdminApi } from './adminApi';
import { AdminApiDataSource } from './dataSource/AdminApiDataSource';
import { BlobApi } from './blobApi';
import { BlobApiDataSource } from './dataSource/BlobApiDataSource';

class ApiClient {
  private nodeApi: NodeApi;
  private authApi: AuthApi;
  private contractApi: ContractApi;
  private adminApi: AdminApi;
  private blobApi: BlobApi;
  private jsonRpcClient: RpcClient;

  constructor(httpClient: HttpClient) {
    this.nodeApi = new NodeApiDataSource(httpClient);
    this.authApi = new AuthApiDataSource(httpClient);
    this.contractApi = new ContractApiDataSource(httpClient);
    this.adminApi = new AdminApiDataSource(httpClient);
    this.blobApi = new BlobApiDataSource(httpClient);
    this.jsonRpcClient = new JsonRpcClient(httpClient);
  }

  node(): NodeApi {
    return this.nodeApi;
  }

  auth(): AuthApi {
    return this.authApi;
  }

  contract(): ContractApi {
    return this.contractApi;
  }

  admin(): AdminApi {
    return this.adminApi;
  }

  blob(): BlobApi {
    return this.blobApi;
  }

  rpc(): RpcClient {
    return this.jsonRpcClient;
  }
}

// Create mero-js HTTP client with token support and automatic refresh
// Note: mero-js handles request queuing internally - if multiple requests get 401 simultaneously,
// it caches the refreshToken promise and all requests wait for the same refresh to complete.
// This prevents race conditions and multiple redundant refresh API calls.
const httpClient = createBrowserHttpClient({
  baseUrl: getAppEndpointKey() || 'http://localhost',
  getAuthToken: async () => {
    const token = getAccessToken();
    return token || undefined;
  },
  onTokenRefresh: async (newToken: string) => {
    setAccessToken(newToken);
  },
  refreshToken: async (): Promise<string> => {
    // This is called automatically by mero-js when a 401 with 'token_expired' is detected.
    // mero-js ensures this callback is only invoked once even if multiple requests fail with 401 simultaneously.
    const refreshTokenValue = getRefreshToken();
    const accessToken = getAccessToken();

    if (!refreshTokenValue || !accessToken) {
      // Clear tokens if they're missing to prevent retry loops
      clearAccessToken();
      clearRefreshToken();
      throw new Error('Missing tokens for refresh');
    }

    const authEndpoint = getAuthEndpointURL();
    if (!authEndpoint) {
      throw new Error('Auth endpoint not configured');
    }

    try {
      // Create a temporary client for refresh (avoid circular dependency)
      const { createBrowserHttpClient: createRefreshClient } = await import(
        '@calimero-network/mero-js'
      );
      const refreshClient = createRefreshClient({
        baseUrl: authEndpoint,
      });

      const refreshUrl = new URL('auth/refresh', authEndpoint).toString();
      const response = await refreshClient.post<RefreshTokenResponse>(
        refreshUrl,
        {
          access_token: accessToken,
          refresh_token: refreshTokenValue,
        },
      );

      // Update stored tokens
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);

      // Return the new access token
      return response.access_token;
    } catch (error) {
      // If refresh fails, clear tokens to prevent infinite retry loops
      console.error('[ApiClient] Token refresh failed:', error);
      clearAccessToken();
      clearRefreshToken();
      // Re-throw to let mero-js handle the error (will trigger re-authentication)
      throw error;
    }
  },
});

const apiClient = new ApiClient(httpClient);
const authClient = new AuthApiDataSource(httpClient);
const contractClient = new ContractApiDataSource(httpClient);
const adminClient = new AdminApiDataSource(httpClient);
const blobClient = new BlobApiDataSource(httpClient);
const rpcClient = new JsonRpcClient(httpClient);

export type { ApiClient };

export {
  apiClient,
  authClient,
  contractClient,
  adminClient,
  rpcClient,
  blobClient,
};
