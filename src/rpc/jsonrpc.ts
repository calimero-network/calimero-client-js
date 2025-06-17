import {
  RpcRequestId,
  RpcClient,
  RpcQueryResponse,
  RpcQueryParams,
  RequestConfig,
  RpcResult,
  RpcError,
} from '../types/rpc';
import { HttpClient } from '../api/httpClient';
import { getAppEndpointKey } from '../storage';

type JsonRpcVersion = '2.0';

type JsonRpcErrorType =
  | 'UnknownServerError'
  | 'RpcExecutionError'
  | 'FunctionCallError'
  | 'CallError'
  | 'MissmatchedRequestIdError'
  | 'InvalidRequestError'
  | 'ParseError';

const errorTypes: JsonRpcErrorType[] = [
  'UnknownServerError',
  'RpcExecutionError',
  'FunctionCallError',
  'CallError',
  'MissmatchedRequestIdError',
  'InvalidRequestError',
  'ParseError',
];

interface JsonRpcRequest<Params> {
  jsonrpc: JsonRpcVersion;
  id: RpcRequestId | null;
  method: string;
  params: Params;
}

type DataType = {
  type: string;
  [key: string]: any;
};

interface ErrorData {
  data: {
    data: string | DataType;
    type: string;
  };
  type: string;
}

interface JsonRpcResponse<Result> {
  jsonrpc: JsonRpcVersion;
  id: RpcRequestId | null;
  result?: Result;
  error?: ErrorData;
}

/**
 * @class JsonRpcClient
 * @description A client for the JSON RPC.
 */
export class JsonRpcClient implements RpcClient {
  private readonly path = '/jsonrpc';
  private httpClient: HttpClient;

  public constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  private handleRpcError(error: RpcError): RpcError {
    // For 401 errors, check the specific error type from header
    if (error.code === 401) {
      // Get the auth error from the header
      const authError = error.headers?.['x-auth-error'];

      switch (authError) {
        case 'token_expired':
          // This should never happen as the HttpClient should handle token refresh
          return {
            ...error,
            error: {
              name: 'AuthenticationError',
              cause: {
                name: 'AuthenticationError',
                info: {
                  message: 'Token expired. Please try again.',
                },
              },
            },
          };
        case 'token_revoked':
          return {
            ...error,
            error: {
              name: 'AuthenticationError',
              cause: {
                name: 'AuthenticationError',
                info: {
                  message: 'Your session was revoked. Please log in again.',
                },
              },
            },
          };
        case 'invalid_token':
          return {
            ...error,
            error: {
              name: 'AuthenticationError',
              cause: {
                name: 'AuthenticationError',
                info: {
                  message: 'Invalid authentication. Please log in again.',
                },
              },
            },
          };
        default:
          return {
            ...error,
            error: {
              name: 'AuthenticationError',
              cause: {
                name: 'AuthenticationError',
                info: {
                  message: 'Authentication required. Please log in.',
                },
              },
            },
          };
      }
    }

    // Handle other known error types
    const errorType = error?.error?.name;
    if (errorTypes.includes(errorType as JsonRpcErrorType)) {
      return error;
    }

    // Handle unknown errors
    return {
      ...error,
      error: {
        name: 'UnknownServerError',
        cause: {
          name: 'UnknownServerError',
          info: {
            message: 'Server Error: Something went wrong. Please try again.',
          },
        },
      },
    };
  }

  /**
   * @function execute
   * @description Executes a JSON RPC request - query or mutate.
   * @param {RpcQueryParams<Args>} params - The parameters for the JSON RPC request.
   * @param {RequestConfig} config - The configuration for the JSON RPC request.
   * @returns {Promise<RpcResult<RpcQueryResponse<Output>>>} The result of the JSON RPC request.
   */
  public async execute<Args, Output>(
    params: RpcQueryParams<Args>,
    config?: RequestConfig,
  ): Promise<RpcResult<RpcQueryResponse<Output>>> {
    return await this.request<RpcQueryParams<Args>, RpcQueryResponse<Output>>(
      'execute',
      params,
      config,
    );
  }

  async request<Params, Result>(
    method: string,
    params: Params,
    config?: RequestConfig,
  ): Promise<RpcResult<Result>> {
    const requestId = this.getRandomRequestId();
    const data: JsonRpcRequest<Params> = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params,
    };
    const baseUrl = getAppEndpointKey();
    try {
      const response = await this.httpClient.post<JsonRpcResponse<Result>>(
        `${baseUrl}${this.path}`,
        data,
        config?.headers ? [config.headers] : undefined,
        true, // Set isJsonRpc flag to true
      );
      console.log('response', response);

      if (!response.error) {
        const jsonRpcResponse = response.data;
        if (jsonRpcResponse.id !== requestId) {
          const error = {
            code: 400,
            id: jsonRpcResponse.id,
            jsonrpc: jsonRpcResponse.jsonrpc,
            headers: {},
            error: {
              name: 'MissmatchedRequestIdError',
              cause: {
                name: 'MissmatchedRequestIdError',
                info: {
                  message: `Missmatched RequestId expected ${requestId}, got ${jsonRpcResponse.id}`,
                },
              },
            },
          };
          return { error: this.handleRpcError(error) };
        }

        if (jsonRpcResponse.error) {
          let messageData = jsonRpcResponse.error.data;
          let errorMessage = '';
          if (typeof messageData === 'string') {
            errorMessage = messageData;
          } else {
            errorMessage = messageData.type;
          }
          const error = {
            code: 400,
            id: jsonRpcResponse.id,
            jsonrpc: jsonRpcResponse.jsonrpc,
            headers: {},
            error: {
              name: jsonRpcResponse.error.type,
              cause: {
                name:
                  jsonRpcResponse.error.data?.type ??
                  jsonRpcResponse.error.type,
                info: {
                  message: errorMessage,
                },
              },
            },
          };
          return { error: this.handleRpcError(error) };
        }

        return {
          result: jsonRpcResponse.result,
        };
      } else {
        const rpcError = {
          id: requestId,
          jsonrpc: '2.0',
          code: response.error.code ?? 500,
          headers: {},
          error: {
            name: 'UnknownServerError',
            cause: {
              name: 'UnknownServerError',
              info: {
                message:
                  response.error.message ??
                  'Server Error: Something went wrong. Please try again.',
              },
            },
          },
        };
        return { error: this.handleRpcError(rpcError) };
      }
    } catch (error: any) {
      const rpcError = {
        id: requestId,
        jsonrpc: '2.0',
        code: error?.response?.status ?? 500,
        headers: Object.fromEntries(
          Object.entries(error?.response?.headers || {}).map(([key, value]) => [
            key,
            String(value),
          ]),
        ),
        error: {
          name: 'UnknownServerError',
          cause: {
            name: 'UnknownServerError',
            info: {
              message: `${error.message ?? error?.response?.data}.\n Verify that the node server is running.`,
            },
          },
        },
      };
      return { error: this.handleRpcError(rpcError) };
    }
  }

  getRandomRequestId(): number {
    return Math.floor(Math.random() * Math.pow(2, 32));
  }
}
