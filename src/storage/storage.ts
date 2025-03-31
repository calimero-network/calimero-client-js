/**
 * @fileoverview This file contains utility functions for interacting with localStorage
 * to store and retrieve application-specific data like API endpoints,
 * authentication tokens, and other context information.
 */

export const APP_URL = 'app-url';
export const CONTEXT_IDENTITY = 'context-identity';
export const ACCESS_TOKEN = 'access-token';
export const CONTEXT_ID = 'context-id';
export const REFRESH_TOKEN = 'refresh-token';
export const APPLICATION_ID = 'application-id';

/**
 * @function setAppEndpointKey
 * @description Sets the Node server URL in localStorage.
 * @param {string} url - The URL of the Node server URL.
 */
export const setAppEndpointKey = (url: string): void => {
  localStorage.setItem(APP_URL, JSON.stringify(url));
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
    console.error(e);
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

/**
 * @function setAccessToken
 * @description Sets the access token in localStorage and updates the
 * context ID and executor public key.
 * @param {string} accessToken - The access token to store.
 */
export const setAccessToken = (accessToken: string) => {
  try {
    localStorage.setItem(ACCESS_TOKEN, accessToken);

    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format received:', accessToken);
      throw new Error('Invalid JWT token format');
    }

    const payloadString = atob(parts[1]);
    const jwt: JsonWebToken = JSON.parse(payloadString);

    if (jwt.context_id) {
      localStorage.setItem(CONTEXT_ID, JSON.stringify(jwt.context_id));
    } else {
      console.warn('JWT payload missing context_id');
    }
    if (jwt.executor_public_key) {
      localStorage.setItem(
        CONTEXT_IDENTITY,
        JSON.stringify(jwt.executor_public_key),
      );
    } else {
      console.warn('JWT payload missing executor_public_key');
    }
  } catch (error) {
    console.error('Failed to set access token or extract JWT info:', error);
  }
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
      return accessToken ? accessToken : null;
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
 * @function resetRefreshToken
 * @description Clears the refresh token from localStorage.
 */
export const resetRefreshToken = (): void => {
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
export const getExecutorPublicKey = (): String | null => {
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
  token_type: string;
  exp: number;
  sub: string;
  executor_public_key: string;
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
 * @description Clears the app endpoint, access token, and application ID from localStorage.
 */
export const clientLogout = (): void => {
  clearAppEndpoint();
  clearAccessToken();
  clearApplicationId();
};
