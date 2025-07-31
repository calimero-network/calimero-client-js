import { ApiClient } from '../api';
import {
  Context as ApiContext,
  FetchContextIdentitiesResponse,
} from '../api/nodeApi';
import {
  Context,
  CalimeroApp,
  Protocol,
  ProtocolID,
  ExecutionResponse,
} from './types';
import { RpcResult, RpcQueryResponse } from '../types';

export class CalimeroApplication implements CalimeroApp {
  private apiClient: ApiClient;
  private clientApplicationId: string;

  constructor(apiClient: ApiClient, clientApplicationId: string) {
    this.apiClient = apiClient;
    this.clientApplicationId = clientApplicationId;
  }

  private async getContext(context: Context): Promise<ApiContext | undefined> {
    const contextsResponse = await this.apiClient.node().getContexts();
    if (contextsResponse.error) {
      throw new Error(
        `Error fetching contexts: ${contextsResponse.error.message}`,
      );
    }
    return contextsResponse.data?.contexts.find(
      (c) => c.id === context.contextId,
    );
  }

  async fetchContexts(): Promise<Context[]> {
    const contextsResponse = await this.apiClient.node().getContexts();
    if (contextsResponse.error) {
      throw new Error(
        `Error fetching contexts: ${contextsResponse.error.message}`,
      );
    }

    const filteredApiContexts = contextsResponse.data
      ? contextsResponse.data.contexts.filter(
          (apiContext) => apiContext.applicationId === this.clientApplicationId,
        )
      : [];

    const contexts = await Promise.all(
      filteredApiContexts.map(async (apiContext) => {
        const identitiesResponse = await this.apiClient
          .node()
          .fetchContextIdentities(apiContext.id);

        if (identitiesResponse.error || !identitiesResponse.data) {
          throw new Error(
            `Could not fetch identity for context ${apiContext.id}, or no identities found.`,
          );
        }

        return {
          contextId: apiContext.id,
          executorId: identitiesResponse.data.identities[0], // Assuming the first identity is the executor
          applicationId: apiContext.applicationId,
        };
      }),
    );
    return contexts;
  }

  async execute(
    context: Context,
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<ExecutionResponse> {
    const response = await this.apiClient.rpc().execute({
      contextId: context.contextId,
      method,
      argsJson: params || {},
      executorPublicKey: context.executorId,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.error?.cause?.info?.message,
      };
    }
    return { success: true, result: response.result?.output };
  }

  async createContext(
    protocol: ProtocolID = Protocol.NEAR,
    initParams?: Record<string, unknown>,
  ): Promise<Context> {
    const response = await this.apiClient
      .node()
      .createContext(
        this.clientApplicationId,
        JSON.stringify(initParams || {}),
        protocol,
      );

    if (response.error) {
      throw new Error(`Error creating context: ${response.error.message}`);
    }
    return {
      contextId: response.data.contextId,
      executorId: response.data.memberPublicKey,
      applicationId: this.clientApplicationId,
    };
  }

  async deleteContext(context: Context): Promise<void> {
    const response = await this.apiClient
      .node()
      .deleteContext(context.contextId);
    if (response.error) {
      throw new Error(`Error deleting context: ${response.error.message}`);
    }
  }
}
