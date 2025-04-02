import apiClient from '../api';
import { JwtTokenResponse } from '../api/nodeApi';
import {
  clearAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../storage';
import { ErrorResponse, ResponseData, RpcError } from '../types';

/**
 * @interface GetNewJwtTokenProps
 * @description Props for the getNewJwtToken function, used when the access token
 * has expired or does not exist.
 * @property {string} refreshToken - The refresh token to use to get a new JWT token.
 * @property {() => string} getNodeUrl - The function to get the node URL.
 */
interface GetNewJwtTokenProps {
  refreshToken: string;
  getNodeUrl: () => string;
}

/**
 * @type JsonRpcErrorType
 * @description The type of error that can occur in the JSON RPC.
 */
type JsonRpcErrorType =
  | 'UnknownServerError'
  | 'RpcExecutionError'
  | 'FunctionCallError'
  | 'CallError'
  | 'MissmatchedRequestIdError'
  | 'InvalidRequestError'
  | 'ParseError';

/**
 * @type errorTypes
 * @description The types of errors that can occur in the JSON RPC for type checking.
 */
const errorTypes: JsonRpcErrorType[] = [
  'UnknownServerError',
  'RpcExecutionError',
  'FunctionCallError',
  'CallError',
  'MissmatchedRequestIdError',
  'InvalidRequestError',
  'ParseError',
];

/**
 * @function getNewJwtToken
 * @description Fetches a new JWT token using the refresh token.
 * @param {GetNewJwtTokenProps} props - The props for the getNewJwtToken function.
 * @returns {Promise<ResponseData<JwtTokenResponse>>} The new JWT token.
 */
export const getNewJwtToken = async ({
  refreshToken,
  getNodeUrl,
}: GetNewJwtTokenProps): Promise<ResponseData<JwtTokenResponse>> => {
  const tokenResponse: ResponseData<JwtTokenResponse> = await apiClient
    .node()
    .refreshToken(refreshToken, getNodeUrl());

  if (tokenResponse.error) {
    return { error: tokenResponse.error };
  }
  setAccessToken(tokenResponse.data.access_token);
  setRefreshToken(tokenResponse.data.refresh_token);
  return { data: tokenResponse.data };
};

/**
 * @function handleRpcError
 * @description Handles the error that can occur in the JSON RPC from the frontend.
 * @param {RpcError} error - The error that can occur in the JSON RPC.
 * @param {() => string} getNodeUrl - The function to get the node URL.
 * @returns {Promise<ErrorResponse>} The error response.
 */
export const handleRpcError = async (
  error: RpcError,
  getNodeUrl: () => string,
): Promise<ErrorResponse> => {
  const invalidSession = {
    message: 'Your session is no longer valid. Please log in again.',
    code: 401,
  };
  const expiredSession = {
    message: '',
    code: 403,
  };
  const unknownMessage = {
    message: 'Server Error: Something went wrong. Please try again.',
    code: 500,
  };

  if (error.code === 401) {
    if (error?.error?.cause?.info?.message === 'Token expired.') {
      try {
        const refreshToken = getRefreshToken();
        const response = await getNewJwtToken({ refreshToken, getNodeUrl });
        if (response?.error) {
          clearAccessToken();
          return invalidSession;
        }
        return expiredSession;
      } catch (error) {
        clearAccessToken();
        return invalidSession;
      }
    }
    clearAccessToken();
    return invalidSession;
  }
  const errorType = error?.error?.name;
  if (errorTypes.includes(errorType as JsonRpcErrorType)) {
    return {
      message: `${errorType}: ${error.error.cause.info.message}`,
      code: error.code,
    };
  } else {
    return unknownMessage;
  }
};
