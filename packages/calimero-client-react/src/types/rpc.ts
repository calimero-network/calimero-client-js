import { ContextId } from './context';

export type RpcRequestId = string | number;

export interface RpcClient {
  execute<Args, Out>(
    params: RpcQueryParams<Args>,
    config?: RequestConfig,
  ): Promise<RpcResult<RpcQueryResponse<Out>>>;
}

interface Headers {
  [key: string]: string;
}

export interface RequestConfig {
  timeout?: number;
  headers?: Headers;
}

export type RpcResult<Result> =
  | {
      result: Result;
      error?: null;
    }
  | {
      result?: null;
      error: RpcError;
    };

export interface RpcErrorInfo {
  name: string;
  cause: {
    name: string;
    info?: {
      message: string;
    };
  };
}

export interface RpcError {
  id: RpcRequestId;
  jsonrpc: string;
  code?: number;
  error: RpcErrorInfo;
  headers?: {
    [key: string]: string;
  };
}

export interface RpcQueryParams<Args> {
  contextId: ContextId;
  method: string;
  argsJson: Args;
  executorPublicKey: string;
}

export interface RpcQueryResponse<Output> {
  output?: Output;
}
