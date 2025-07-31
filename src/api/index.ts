import axios from 'axios';
import { AxiosHttpClient, HttpClient } from './httpClient';
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

const httpClient = new AxiosHttpClient(axios);

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
