/**
 * Utility functions for working with mero-js HttpClient
 * Handles ResponseData wrapping and token refresh retry logic
 */

import { HTTPError } from '@calimero-network/mero-js';
import { ResponseData } from '../types/api-response';
import { clearAccessToken, clientLogout } from '../storage';

/**
 * Wraps a mero-js HTTP call with ResponseData format
 * Note: Token refresh is now handled automatically by mero-js
 */
export async function withResponseData<T>(
  httpCall: () => Promise<T>,
): Promise<ResponseData<T>> {
  try {
    const data = await httpCall();
    return { data, error: null };
  } catch (error) {
    if (error instanceof HTTPError) {
      // Handle 401 Unauthorized - mero-js already handled token_expired automatically
      if (error.status === 401) {
        const authError = error.headers.get('x-auth-error');
        const bodyText = error.bodyText;

        switch (authError) {
          case 'missing_token':
            return {
              data: null,
              error: {
                code: 401,
                message: bodyText || 'No access token found.',
              },
            };
          case 'token_expired':
            // This should rarely happen now since mero-js handles it automatically
            // But if refresh failed, we still need to handle it
            clearAccessToken();
            return {
              data: null,
              error: {
                code: 401,
                message: bodyText || 'Session expired. Please log in again.',
              },
            };
          case 'token_revoked':
            clientLogout();
            return {
              data: null,
              error: {
                code: 401,
                message: bodyText || 'Token has been revoked.',
              },
            };
          default:
            return {
              data: null,
              error: {
                code: error.status,
                message: bodyText || error.statusText || 'Unauthorized',
              },
            };
        }
      }

      // For other HTTP errors, return structured error response
      return {
        data: null,
        error: {
          code: error.status,
          message: error.bodyText || error.statusText || 'Request failed',
        },
      };
    }

    // For network errors or other unexpected errors
    return {
      data: null,
      error: {
        code: 0,
        message: error instanceof Error ? error.message : 'Network error',
      },
    };
  }
}

// Token refresh is now handled automatically by mero-js via the refreshToken callback
// This function is no longer needed

/**
 * Helper to convert Header[] format to Record<string, string>
 */
export function mergeHeaders(
  headers?: Array<Record<string, string>>,
): Record<string, string> {
  const merged: Record<string, string> = {};
  headers?.forEach((h) => {
    Object.assign(merged, h);
  });
  return merged;
}
