import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '../httpClient';
import {
  ContextStorageEntry,
  ContractApi,
  GetProposalsRequest,
  Proposal,
  ProposalApprovalCount,
  StorageEntry,
} from '../contractApi';
import { getAppEndpointKey, getContextId } from '../../storage/storage';

export class ContractApiDataSource implements ContractApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  private get contextId(): string {
    const id = getContextId();
    if (!id) {
      throw new Error(
        'Context ID not available. Make sure you are properly authenticated.',
      );
    }
    return id;
  }

  async getProposals(request: GetProposalsRequest): ApiResponse<Proposal[]> {
    try {
      return await this.client.post<Proposal[]>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals`,
          this.baseUrl,
        ).toString(),
        request,
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getProposalApprovers(proposalId: string): ApiResponse<string[]> {
    try {
      return await this.client.get<string[]>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/users`,
          this.baseUrl,
        ).toString(),
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getProposalApprovalCount(
    proposalId: string,
  ): ApiResponse<ProposalApprovalCount> {
    try {
      return await this.client.get<ProposalApprovalCount>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/count`,
          this.baseUrl,
        ).toString(),
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getNumOfProposals(): ApiResponse<number> {
    try {
      return await this.client.get<number>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals/count`,
          this.baseUrl,
        ).toString(),
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getProposalDetails(proposalId: string): ApiResponse<Proposal> {
    try {
      return await this.client.get<Proposal>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}`,
          this.baseUrl,
        ).toString(),
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getContextValue(key: string): ApiResponse<StorageEntry> {
    try {
      return await this.client.post<StorageEntry>(
        new URL(
          `admin-api/contexts/${this.contextId}`,
          this.baseUrl,
        ).toString(),
        {
          key,
        },
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getContextStorageEntries(
    offset: number,
    limit: number,
  ): ApiResponse<ContextStorageEntry[]> {
    try {
      return await this.client.post<ContextStorageEntry[]>(
        new URL(
          `admin-api/contexts/${this.contextId}/proposals/context-storage-entries`,
          this.baseUrl,
        ).toString(),
        {
          offset,
          limit,
        },
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }
}
