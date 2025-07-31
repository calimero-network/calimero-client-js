import {
  Context,
  CalimeroApp,
  Protocol,
  ProtocolID,
  ExecutionResponse,
} from './types';
import { SubscriptionsClient } from '../subscriptions';
import { ApiClient } from '../api';
import { getAppEndpointKey } from '../storage';
import { WsSubscriptionsClient } from '../subscriptions/ws';
import { NodeEvent } from '../subscriptions/subscriptions';

export class CalimeroApplication implements CalimeroApp {
  private apiClient: ApiClient;
  private clientApplicationId: string;
  private subscriptionsClient: SubscriptionsClient;

  constructor(apiClient: ApiClient, clientApplicationId: string) {
    this.apiClient = apiClient;
    this.clientApplicationId = clientApplicationId;
    this.subscriptionsClient = this.createSubscriptionsClient();
  }

  private createSubscriptionsClient(): SubscriptionsClient {
    const baseUrl = getAppEndpointKey();
    if (!baseUrl) {
      throw new Error('Application endpoint URL is not set.');
    }
    const wsUrl = new URL(baseUrl);
    const protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return new WsSubscriptionsClient(`${protocol}//${wsUrl.host}`, '/ws');
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

  public async uploadBlob(
    file: File,
    onProgress?: (p: number) => void,
  ): Promise<{ blobId: string }> {
    const response = await this.apiClient.blob().uploadBlob(file, onProgress);
    if (response.error) {
      throw new Error(`Error uploading blob: ${response.error.message}`);
    }
    return response.data;
  }

  public async downloadBlob(blobId: string): Promise<Blob> {
    return this.apiClient.blob().downloadBlob(blobId);
  }

  public async listBlobs(): Promise<any> {
    const response = await this.apiClient.blob().listBlobs();
    if (response.error) {
      throw new Error(`Error listing blobs: ${response.error.message}`);
    }
    return response.data;
  }

  public async deleteBlob(blobId: string): Promise<void> {
    const response = await this.apiClient.blob().deleteBlob(blobId);
    if (response.error) {
      throw new Error(`Error deleting blob: ${response.error.message}`);
    }
  }

  // Subscription methods
  connect(connectionId?: string): Promise<void> {
    return this.subscriptionsClient.connect(connectionId);
  }

  disconnect(connectionId?: string): void {
    this.subscriptionsClient.disconnect(connectionId);
  }

  subscribe(contexts: Context[], connectionId?: string): void {
    const contextIds = contexts.map((c) => c.contextId);
    this.subscriptionsClient.subscribe(contextIds, connectionId);
  }

  unsubscribe(contexts: Context[], connectionId?: string): void {
    const contextIds = contexts.map((c) => c.contextId);
    this.subscriptionsClient.unsubscribe(contextIds, connectionId);
  }

  addCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void {
    this.subscriptionsClient.addCallback(callback, connectionId);
  }

  removeCallback(
    callback: (event: NodeEvent) => void,
    connectionId?: string,
  ): void {
    this.subscriptionsClient.removeCallback(callback, connectionId);
  }
}
