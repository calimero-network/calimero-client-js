import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '@calimero-network/mero-js';
import { withResponseData } from '../http-utils';
import {
  ContextStorageEntry,
  ContractApi,
  GetProposalsRequest,
  Proposal,
  ProposalApprovalCount,
  StorageEntry,
} from '../contractApi';
import { getAppEndpointKey, getContextId } from '../../storage/storage';
import { BaseApiDataSource } from './BaseApiDataSource';

export class ContractApiDataSource
  extends BaseApiDataSource
  implements ContractApi
{
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
    return getAppEndpointKey();
  }

  private validateBaseUrl(): ApiResponse<never> | null {
    if (!this.baseUrl) {
      return Promise.resolve({
        data: null,
        error: {
          code: 400,
          message: 'Node URL not configured. Please set the app endpoint key.',
        },
      });
    }
    return null;
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
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.post<Proposal[]>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals`,
          this.baseUrl!,
        ),
        request,
      ),
    );
  }

  async getProposalApprovers(proposalId: string): ApiResponse<string[]> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<string[]>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/users`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getProposalApprovalCount(
    proposalId: string,
  ): ApiResponse<ProposalApprovalCount> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<ProposalApprovalCount>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}/approvals/count`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getNumOfProposals(): ApiResponse<number> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<number>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals/count`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getProposalDetails(proposalId: string): ApiResponse<Proposal> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.get<Proposal>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals/${proposalId}`,
          this.baseUrl!,
        ),
      ),
    );
  }

  async getContextValue(key: string): ApiResponse<StorageEntry> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.post<StorageEntry>(
        this.buildUrl(`admin-api/contexts/${this.contextId}`, this.baseUrl!),
        {
          key,
        },
      ),
    );
  }

  async getContextStorageEntries(
    offset: number,
    limit: number,
  ): ApiResponse<ContextStorageEntry[]> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.post<ContextStorageEntry[]>(
        this.buildUrl(
          `admin-api/contexts/${this.contextId}/proposals/context-storage-entries`,
          this.baseUrl!,
        ),
        {
          offset,
          limit,
        },
      ),
    );
  }
}
