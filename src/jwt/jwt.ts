import { getAccessToken, getJWTObject, JsonWebToken } from '../storage';
import { ErrorResponse, RequestConfig } from '../types';

/**
 * @interface AxiosHeader
 * @description Axios header interface for json rpc.
 */
export interface AxiosHeader {
  [key: string]: string;
}

/**
 * @interface RequestConfigResponse
 * @description Response interface for request configuration.
 */
export interface RequestConfigResponse {
  publicKey?: string;
  contextId?: string;
  config?: RequestConfig;
  error?: ErrorResponse;
}

/**
 * Retrieves the JWT, creates authorization headers, and prepares the request configuration.
 * Extracts public key and context ID from the JWT.
 * @returns An object containing the public key, context ID, and request config, or an error object.
 */
export const prepareAuthenticatedRequestConfig = () => {
  const jwtObject: JsonWebToken | null = getJWTObject();
  const headers: AxiosHeader | null = createJwtHeader();
  if (!headers) {
    return {
      error: { message: 'Failed to create auth headers', code: 500 },
    };
  }
  if (!jwtObject) {
    return {
      error: { message: 'Failed to get JWT token', code: 500 },
    };
  }
  if (jwtObject.executor_public_key === null) {
    return {
      error: { message: 'Failed to get executor public key', code: 500 },
    };
  }

  const config: RequestConfig = {
    headers: headers,
    timeout: 10000,
  };

  return {
    publicKey: jwtObject.executor_public_key,
    contextId: jwtObject.context_id,
    config,
  };
};

/**
 * Creates an authorization header for JSON RPC requests.
 * @returns An Axios header object with the authorization token, or null if no token is available.
 */
export function createJwtHeader(): AxiosHeader | null {
  const token: string | null = getAccessToken();

  if (!token) {
    return null;
  }

  const headers: AxiosHeader = {
    authorization: `Bearer ${token}`,
  };
  return headers;
}
