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
      throw new Error('Context ID not available. Make sure you are properly authenticated.');
    }
    return id;
  }

  async getProposals(request: GetProposalsRequest): ApiResponse<Proposal[]> {
    try {
      return await this.client.post<Proposal[]>(
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals`,
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
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/users`,
      );
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  async getProposalApprovalCount(proposalId: string): ApiResponse<ProposalApprovalCount> {
    try {
      return await this.client.get<ProposalApprovalCount>(
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/count`,
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
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals/count`,
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
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals/${proposalId}`,
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
        `${this.baseUrl}/admin-api/contexts/${this.contextId}`,
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

  async getContextStorageEntries(offset: number, limit: number): ApiResponse<ContextStorageEntry[]> {
    try {
      return await this.client.post<ContextStorageEntry[]>(
        `${this.baseUrl}/admin-api/contexts/${this.contextId}/proposals/context-storage-entries`,
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
