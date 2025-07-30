import { ApiClient } from '../api';
import {
  CalimeroApp,
  Context,
  ExecutionResponse,
  ProtocolID,
  Protocol,
} from './types';

export class CalimeroApplication implements CalimeroApp {
  private apiClient: ApiClient;
  private applicationId: string;

  constructor(apiClient: ApiClient, applicationId: string) {
    this.apiClient = apiClient;
    this.applicationId = applicationId;
  }

  async fetchContexts(): Promise<Context[]> {
    const contextsResponse = await this.apiClient.node().getContexts();
    if (contextsResponse.error) {
      throw contextsResponse.error;
    }

    const filteredApiContexts = contextsResponse.data.contexts.filter(
      (apiContext) => apiContext.applicationId === this.applicationId,
    );

    const contextsWithIdentities = await Promise.all(
      filteredApiContexts.map(async (apiContext) => {
        const identitiesResponse = await this.apiClient
          .node()
          .fetchContextIdentities(apiContext.id);

        if (
          identitiesResponse.error ||
          identitiesResponse.data.identities.length === 0
        ) {
          console.warn(
            `Could not fetch identity for context ${apiContext.id}, or no identities found.`,
          );
          return null;
        }

        const executorId = identitiesResponse.data.identities[0];

        return {
          contextId: apiContext.id,
          executorId: executorId,
          applicationId: apiContext.applicationId,
        };
      }),
    );

    return contextsWithIdentities.filter((ctx): ctx is Context => ctx !== null);
  }

  async execute(
    context: Context,
    method: string,
    params?: Record<string, unknown>,
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
        this.applicationId,
        JSON.stringify(initParams || {}),
        protocol,
      );

    if (response.error) {
      throw response.error;
    }

    return {
      contextId: response.data.contextId,
      executorId: response.data.memberPublicKey,
      applicationId: this.applicationId,
    };
  }

  async deleteContext(context: Context): Promise<void> {
    const response = await this.apiClient
      .node()
      .deleteContext(context.contextId);
    if (response.error) {
      throw response.error;
    }
  }
}
