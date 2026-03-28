import React, { useEffect, useState } from 'react';
import Spinner from '../components/loader/Spinner';
import { apiClient } from '../api';
import { ResponseData } from '../types';
import {
  Context,
  GetContextsResponse,
  InviteToContextResponse,
} from '../api/nodeApi';
import { getApplicationId } from '../storage';
import {
  Button,
  ContextSelector,
  DropdownSelector,
  ErrorMessage,
  FormGroup,
  FormInput,
  Heading2,
  Paragraph,
  SuccessMessage,
} from './Components';

export const InviteContext: React.FC = () => {
  const applicationId = getApplicationId();
  const [contextId, setContextId] = useState<string>('');
  const [inviterKey, setInviterKey] = useState<string>('');
  const [validForSeconds, setValidForSeconds] = useState<number>(3600);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [contextLoading, setContextLoading] = useState<boolean>(false);

  const fetchAvailableContexts = async () => {
    setContextLoading(true);
    const fetchContextsResponse: ResponseData<GetContextsResponse> =
      await apiClient.node().getContexts();
    const contexts =
      fetchContextsResponse.data?.contexts.filter(
        (context) => context.applicationId === applicationId,
      ) ?? [];
    setContexts(contexts);
    setContextId(contexts[0].id);
    setContextLoading(false);
  };

  useEffect(() => {
    fetchAvailableContexts();
  }, [applicationId]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvitation(null);
    setIsLoading(true);
    const response: ResponseData<InviteToContextResponse> = await apiClient
      .node()
      .contextInvite(contextId, inviterKey, validForSeconds);
    if (response.error) {
      setError(response.error.message);
    } else {
      if (response.data?.data == null) {
        setError('Failed to invite to context.');
        setIsLoading(false);
        return;
      }
      setInvitation(JSON.stringify(response.data.data));
    }
    setIsLoading(false);
  };

  return (
    <div className="invite-tab">
      <Heading2>Invite to Context</Heading2>
      <Paragraph>Fill in the details to create an invitation</Paragraph>
      <form onSubmit={handleInviteSubmit}>
        <FormGroup>
          <ContextSelector>
            <label>Select Context:</label>
            {contextLoading ? (
              <div>Loading contexts...</div>
            ) : (
              <DropdownSelector
                id="context-select"
                value={contextId || ''}
                onChange={(e) => {
                  const selected = contexts?.find(
                    (context) => context.id === e.target.value,
                  );
                  setContextId(selected.id || '');
                }}
              >
                {contexts?.map((context) => (
                  <option key={context.id} value={context.id}>
                    {context.id}
                  </option>
                ))}
              </DropdownSelector>
            )}
          </ContextSelector>
        </FormGroup>
        <FormGroup>
          <FormInput
            type="text"
            value={inviterKey}
            onChange={(e) => setInviterKey(e.target.value)}
            placeholder="Inviter Public Key"
          />
        </FormGroup>
        <FormGroup>
          <FormInput
            type="number"
            value={validForSeconds}
            onChange={(e) => setValidForSeconds(Number(e.target.value))}
            placeholder="Valid for (seconds)"
          />
        </FormGroup>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {invitation && (
          <SuccessMessage>
            <Paragraph>Invitation created successfully</Paragraph>
            <div>
              invitation payload: <span className="payload">{invitation}</span>
            </div>
          </SuccessMessage>
        )}
        <Button
          type="submit"
          className="button-rounded button-size-md"
          disabled={isLoading || !inviterKey}
        >
          {isLoading ? <Spinner /> : 'Create Invitation'}
        </Button>
      </form>
    </div>
  );
};
