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

class ApiClient {
  private nodeApi: NodeApi;
  private authApi: AuthApi;
  private contractApi: ContractApi;
  private adminApi: AdminApi;
  private jsonRpcClient: RpcClient;

  constructor(httpClient: HttpClient) {
    this.nodeApi = new NodeApiDataSource(httpClient);
    this.authApi = new AuthApiDataSource(httpClient);
    this.contractApi = new ContractApiDataSource(httpClient);
    this.adminApi = new AdminApiDataSource(httpClient);
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

  rpc(): RpcClient {
    return this.jsonRpcClient;
  }
}

const apiClient = new ApiClient(new AxiosHttpClient(axios));
const authClient = new AuthApiDataSource(new AxiosHttpClient(axios));
const contractClient = new ContractApiDataSource(new AxiosHttpClient(axios));
const adminClient = new AdminApiDataSource(new AxiosHttpClient(axios));
const rpcClient = new JsonRpcClient(new AxiosHttpClient(axios));

export { apiClient, authClient, contractClient, adminClient, rpcClient };
