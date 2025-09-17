import { ApiResponse } from '../types';

export enum ActionScope {
  ExternalFunctionCall = 'ExternalFunctionCall',
  Transfer = 'Transfer',
  SetNumApprovals = 'SetNumApprovals',
  SetActiveProposalsLimit = 'SetActiveProposalsLimit',
  SetContextValue = 'SetContextValue',
  DeleteProposal = 'DeleteProposal',
}

export interface ExternalFunctionCallParams {
  receiver_id: string;
  method_name: string;
  args: string;
  deposit: string;
}

export interface TransferParams {
  receiver_id: string;
  amount: string;
}

export interface SetNumApprovalsParams {
  num_approvals: number;
}

export interface SetActiveProposalsLimitParams {
  active_proposals_limit: number;
}

export interface SetContextValueParams {
  key: Uint8Array;
  value: Uint8Array;
}

export interface DeleteProposalParams {
  proposal_id: string;
}

export interface ProposalAction {
  scope: ActionScope;
  params:
    | ExternalFunctionCallParams
    | TransferParams
    | SetNumApprovalsParams
    | SetActiveProposalsLimitParams
    | SetContextValueParams
    | DeleteProposalParams;
}

export interface Proposal {
  id: string;
  author_id: string;
  actions: ProposalAction[];
}

export interface User {
  identityPublicKey: String;
}

export interface Message {
  publicKey: String;
}

export interface ContextStorageEntry {
  key: string;
  value: string;
}

export interface ProposalApprovalCount {
  num_approvals: number;
}

export function createExternalFunctionCall(
  receiver_id: string,
  method_name: string,
  args: string,
  deposit: string,
): ProposalAction {
  return {
    scope: ActionScope.ExternalFunctionCall,
    params: {
      receiver_id,
      method_name,
      args,
      deposit,
    },
  };
}

export function createTransfer(
  receiver_id: string,
  amount: string,
): ProposalAction {
  return {
    scope: ActionScope.Transfer,
    params: {
      receiver_id,
      amount,
    },
  };
}

export function createSetNumApprovals(num_approvals: number): ProposalAction {
  return {
    scope: ActionScope.SetNumApprovals,
    params: {
      num_approvals,
    },
  };
}

export function createSetActiveProposalsLimit(
  active_proposals_limit: number,
): ProposalAction {
  return {
    scope: ActionScope.SetActiveProposalsLimit,
    params: {
      active_proposals_limit,
    },
  };
}

export function createSetContextValue(
  key: Uint8Array,
  value: Uint8Array,
): ProposalAction {
  return {
    scope: ActionScope.SetContextValue,
    params: {
      key,
      value,
    },
  };
}

export function createDeleteProposal(proposal_id: string): ProposalAction {
  return {
    scope: ActionScope.DeleteProposal,
    params: {
      proposal_id,
    },
  };
}

export interface GetProposalsRequest {
  offset: number;
  limit: number;
}

export interface StorageEntry {
  value: string;
}

export interface ContractApi {
  getProposals(request: GetProposalsRequest): ApiResponse<Proposal[]>;
  getProposalApprovers(proposalId: String): ApiResponse<string[]>;
  getProposalApprovalCount(
    proposalId: String,
  ): ApiResponse<ProposalApprovalCount>;
  getNumOfProposals(): ApiResponse<number>;
  getContextValue(key: string): ApiResponse<StorageEntry>;
  getContextStorageEntries(
    offset: number,
    limit: number,
  ): ApiResponse<ContextStorageEntry[]>;
}
