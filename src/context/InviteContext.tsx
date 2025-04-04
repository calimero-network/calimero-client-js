import React, { useEffect, useState } from 'react';
import Spinner from '../components/loader/Spinner';
import apiClient from '../api';
import { ResponseData } from '../types';
import { Context, GetContextsResponse } from '../api/nodeApi';
import { getApplicationId } from '../storage';

export const InviteContext: React.FC = () => {
  const applicationId = getApplicationId();
  const [contextId, setContextId] = useState<string>('');
  const [invitatorKey, setInvitatorKey] = useState<string>('');
  const [inviteeKey, setInviteeKey] = useState<string>('');
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
    const response: ResponseData<string> = await apiClient
      .node()
      .contextInvite(contextId, invitatorKey, inviteeKey);
    if (response.error) {
      setError(response.error.message);
    } else {
      if (response.data == null) {
        setError('Failed to invite to context.');
        setIsLoading(false);
        return;
      }
      setInvitation(response.data);
    }
    setIsLoading(false);
  };

  return (
    <div className="invite-tab">
      <h2>Invite to Context</h2>
      <p>Fill in the details to create an invitation</p>
      <form onSubmit={handleInviteSubmit}>
        <div className="form-group">
          <div className="context-selector">
            <label>Select Context:</label>
            {contextLoading ? (
              <div>Loading contexts...</div>
            ) : (
              <select
                id="context-select"
                className="dropdown-selector"
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
              </select>
            )}
          </div>
        </div>
        <div className="form-group">
          <input
            type="text"
            value={invitatorKey}
            onChange={(e) => setInvitatorKey(e.target.value)}
            placeholder="Inviter Public Key"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={inviteeKey}
            onChange={(e) => setInviteeKey(e.target.value)}
            placeholder="Invitee Public Key"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {invitation && (
          <div className="success-message">
            <p>Invitation created successfully</p>
            <div>
              invitation payload: <span className="payload">{invitation}</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="button-rounded button-size-md"
          disabled={isLoading || !invitatorKey || !inviteeKey}
        >
          {isLoading ? <Spinner /> : 'Create Invitation'}
        </button>
      </form>
    </div>
  );
};
