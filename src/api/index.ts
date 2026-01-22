import { MeroHttpClientAdapter, HttpClient } from './httpClientAdapter';
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

const apiClient = new ApiClient(new MeroHttpClientAdapter());
const authClient = new AuthApiDataSource(new MeroHttpClientAdapter());
const contractClient = new ContractApiDataSource(new MeroHttpClientAdapter());
const adminClient = new AdminApiDataSource(new MeroHttpClientAdapter());
const blobClient = new BlobApiDataSource(new MeroHttpClientAdapter());
const rpcClient = new JsonRpcClient(new MeroHttpClientAdapter());

export type { ApiClient };

export {
  apiClient,
  authClient,
  contractClient,
  adminClient,
  rpcClient,
  blobClient,
};
