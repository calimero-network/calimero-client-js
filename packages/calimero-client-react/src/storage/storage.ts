/**
 * @fileoverview This file contains utility functions for interacting with localStorage
 * to store and retrieve application-specific data like API endpoints,
 * authentication tokens, and other context information.
 */



/**
 * @constant {string} APP_URL
 * @description The key for the Node server URL in localStorage.
 */
export const APP_URL = 'app-url';

/**
 * @constant {string} CONTEXT_IDENTITY
 * @description The key for the executor public key in localStorage.
 */
export const CONTEXT_IDENTITY = 'context-identity';

/**
 * @constant {string} ACCESS_TOKEN
 * @description The key for the JWT access token in localStorage.
 */
export const ACCESS_TOKEN = 'access-token';

/**
 * @constant {string} CONTEXT_ID
 * @description The key for the context ID in localStorage.
 */
export const CONTEXT_ID = 'context-id';

/**
 * @constant {string} REFRESH_TOKEN
 * @description The key for the JWT refresh token in localStorage.
 */
export const REFRESH_TOKEN = 'refresh-token';

/**
 * @constant {string} APPLICATION_ID
 * @description The key for the application ID in localStorage.
 */
export const APPLICATION_ID = 'application-id';

/**
 * @constant {string} AUTH_ENDPOINT_URL
 * @description The key for the auth endpoint URL in localStorage.
 */
export const AUTH_ENDPOINT_URL = 'auth-url';

/**
 * @function setAppEndpointKey
 * @description Sets the Node server URL in localStorage.
 * @param {string} url - The URL of the Node server URL.
 */
export const setAppEndpointKey = (url: string): void => {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const jsonValue = JSON.stringify(url);
    localStorage.setItem(APP_URL, jsonValue);

    // Verify it was stored
    const storedValue = localStorage.getItem(APP_URL);

    if (storedValue !== jsonValue) {
      console.error('setAppEndpointKey failed to store value correctly');
    }
  } catch (error) {
    console.error('setAppEndpointKey error:', error);
  }
};

/**
 * @function getAppEndpointKey
 * @description Retrieves the Node server URL from localStorage.
 * @returns {string | null} The Node server URL or null if not found.
 */
export const getAppEndpointKey = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const urlEndpoint = localStorage.getItem(APP_URL);
      return urlEndpoint ? JSON.parse(urlEndpoint) : null;
    }
  } catch (e) {
    console.error('getAppEndpointKey error:', e);
  }
  return null;
};

/**
 * @function clearAppEndpoint
 * @description Clears the Node server URL from localStorage.
 */
export const clearAppEndpoint = (): void => {
  localStorage.removeItem(APP_URL);
};

export const setAuthEndpointURL = (url: string): void => {
  localStorage.setItem(AUTH_ENDPOINT_URL, JSON.stringify(url));
};

export const getAuthEndpointURL = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const authEndpointURL = localStorage.getItem(AUTH_ENDPOINT_URL);
      return authEndpointURL ? JSON.parse(authEndpointURL) : null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function setApplicationId
 * @description Sets the application ID in localStorage.
 * @param {string} applicationId - The ID of the application.
 */
export const setApplicationId = (applicationId: string): void => {
  localStorage.setItem(APPLICATION_ID, JSON.stringify(applicationId));
};

/**
 * @function getApplicationId
 * @description Retrieves the application ID from localStorage.
 * @returns {string | null} The application ID or null if not found.
 */
export const getApplicationId = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const applicationId = localStorage.getItem(APPLICATION_ID);
      return applicationId ? JSON.parse(applicationId) : null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clearApplicationId
 * @description Clears the application ID from localStorage.
 */
export const clearApplicationId = (): void => {
  localStorage.removeItem(APPLICATION_ID);
};

export const setContextAndIdentityFromJWT = (accessToken: string) => {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format received:', accessToken);
      throw new Error('Invalid JWT token format');
    }

    const payloadString = atob(parts[1]);
    const jwt: JsonWebToken = JSON.parse(payloadString);

    if (jwt.permissions) {
      // Find the context permission which is in format: context[context_id,context_identity]
      const contextPermission = jwt.permissions.find(
        (permission) =>
          permission.startsWith('context[') && permission.endsWith(']'),
      );

      if (contextPermission) {
        // Extract the content between brackets: context[content] -> content
        const content = contextPermission.substring(
          contextPermission.indexOf('[') + 1,
          contextPermission.lastIndexOf(']'),
        );

        // Split the content by comma to get [context_id, context_identity]
        const [contextId, contextIdentity] = content.split(',');

        if (contextId && contextIdentity) {
          setContextId(contextId);
          setExecutorPublicKey(contextIdentity);
        } else {
          console.warn(
            'Failed to extract context_id or context_identity from permissions',
          );
        }
      } else {
        console.warn('No context permission found in JWT token');
      }
    } else {
      console.warn('JWT payload missing permissions field');
    }
  } catch (error) {
    console.error('Failed to set access token or extract JWT info:', error);
  }
};

/**
 * @function setAccessToken
 * @description Sets the access token in localStorage and updates the
 * context ID and executor public key.
 * @param {string} accessToken - The access token to store.
 */
export const setAccessToken = (accessToken: string) => {
  localStorage.setItem(ACCESS_TOKEN, JSON.stringify(accessToken));
};

/**
 * @function getAccessToken
 * @description Retrieves the access token from localStorage.
 * @returns {string | null} The access token or null if not found.
 */
export const getAccessToken = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const accessToken = localStorage.getItem(ACCESS_TOKEN);
      return accessToken ? JSON.parse(accessToken) : null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clearAccessToken
 * @description Clears the access token from localStorage.
 */
export const clearAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
};

/**
 * @function setContextId
 * @description Sets the context ID in localStorage.
 * @param {string} contextId - The context ID to store.
 */
export const setContextId = (contextId: string): void => {
  localStorage.setItem(CONTEXT_ID, JSON.stringify(contextId));
};

/**
 * @function getContextId
 * @description Retrieves the context ID from localStorage.
 * @returns {string | null} The context ID or null if not found.
 */
export const getContextId = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const contextId = localStorage.getItem(CONTEXT_ID);
      return contextId ? JSON.parse(contextId) : null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clearContextId
 * @description Clears the context ID from localStorage.
 */
export const clearContextId = (): void => {
  localStorage.removeItem(CONTEXT_ID);
};

/**
 * @function setRefreshToken
 * @description Sets the refresh token in localStorage.
 * @param {string} refreshToken - The refresh token to store.
 */
export const setRefreshToken = (refreshToken: string): void => {
  localStorage.setItem(REFRESH_TOKEN, JSON.stringify(refreshToken));
};

/**
 * @function getRefreshToken
 * @description Retrieves the refresh token from localStorage.
 * @returns {string | null} The refresh token or null if not found.
 */
export const getRefreshToken = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      return refreshToken ? JSON.parse(refreshToken) : null;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clearRefreshToken
 * @description Clears the refresh token from localStorage.
 */
export const clearRefreshToken = (): void => {
  localStorage.removeItem(REFRESH_TOKEN);
};

/**
 * @function setExecutorPublicKey
 * @description Sets the executor public key in localStorage.
 * @param {string} publicKey - The public key to store.
 */
export const setExecutorPublicKey = (publicKey: string) => {
  localStorage.setItem(CONTEXT_IDENTITY, JSON.stringify(publicKey));
};

/**
 * @function getExecutorPublicKey
 * @description Retrieves the executor public key from localStorage.
 * @returns {string | null} The executor public key or null if not found.
 */
export const getExecutorPublicKey = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let contextIdentity = localStorage.getItem(CONTEXT_IDENTITY);
      return contextIdentity ? JSON.parse(contextIdentity) : null;
    }
    return null;
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clearExecutorPublicKey
 * @description Clears the executor public key from localStorage.
 */
export const clearExecutorPublicKey = (): void => {
  localStorage.removeItem(CONTEXT_IDENTITY);
};

export interface JsonWebToken {
  context_id: string;
  context_identity: string;
  token_type: string;
  exp: number;
  sub: string;
  executor_public_key: string;
  permissions: string[];
}

/**
 * @function getJWTObject
 * @description Retrieves the JWT object from the access token.
 * @returns {JsonWebToken | null} The JWT object or null if not found.
 */
export const getJWTObject = (): JsonWebToken | null => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    console.error(e);
  }
  return null;
};

/**
 * @function clientLogout
 * @description Clears the app endpoint, access token, and application ID from localStorage and refreshes the page.
 */
export const clientLogout = (): void => {
  // clearAppEndpoint();
  clearAccessToken();
  clearApplicationId();
  clearContextId();
  clearExecutorPublicKey();

  // Refresh the page to reset all application state
  window.location.reload();
};

interface AuthConfig {
  appEndpointKey: string | null;
  contextId: string | null;
  executorPublicKey: string | null;
  error: string | null;
  jwtToken: string | null;
}

const createErrorResponse = (error: string): AuthConfig => ({
  appEndpointKey: null,
  contextId: null,
  executorPublicKey: null,
  jwtToken: null,
  error,
});

/**
 * @function getAuthConfig
 * @description Retrieves the authentication configuration from localStorage.
 * @returns {AuthConfig} The authentication configuration object
 */
export const getAuthConfig = (): AuthConfig => {
  const config = {
    appEndpointKey: getAppEndpointKey(),
    contextId: getContextId(),
    executorPublicKey: getExecutorPublicKey(),
    jwtToken: getAccessToken(),
    error: null as string | null,
  };

  // appEndpointKey must always be present
  if (!config.appEndpointKey) {
    return createErrorResponse('Missing app endpoint key');
  }

  // Either jwtObject OR both contextId and executorPublicKey must be present
  const hasJwtToken = !!config.jwtToken;
  const hasContextId = !!config.contextId;
  const hasExecutorPublicKey = !!config.executorPublicKey;

  if (!hasJwtToken && !(hasContextId && hasExecutorPublicKey)) {
    return createErrorResponse(
      'Missing authentication information. Either JWT token or both context ID and executor public key must be present.',
    );
  }

  return config;
};
