import React, { useState } from 'react';
import Spinner from '../components/loader/Spinner';
import apiClient from '../api';
import { JoinContextResponse } from '../api/nodeApi';
import { ResponseData } from '../types';

export const JoinContext: React.FC = () => {
  const [identityPrivateKey, setIdentityPrivateKey] = useState<string>('');
  const [joinPayload, setJoinPayload] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setJoinError('');
    setIsSuccess(false);
    const response: ResponseData<JoinContextResponse> = await apiClient
      .node()
      .joinContext(identityPrivateKey, joinPayload);
    if (response.error) {
      setJoinError(response.error.message);
    } else {
      if (response.data.contextId && response.data.memberPublicKey) {
        setIsSuccess(true);
        setJoinError('');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="join-tab">
      <h2>Join Existing Context</h2>
      <p>To join context you need to have invitation payload.</p>
      <form onSubmit={handleJoinSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={identityPrivateKey}
            onChange={(e) => setIdentityPrivateKey(e.target.value)}
            placeholder="Enter your identity private key"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={joinPayload}
            onChange={(e) => setJoinPayload(e.target.value)}
            placeholder="Paste invitation payload"
          />
        </div>
        {joinError && <div className="error-message">{joinError}</div>}
        {isSuccess && (
          <div className="success-message">Successfully joined context</div>
        )}
        <button
          type="submit"
          className="button-rounded button-size-md"
          disabled={isLoading || !identityPrivateKey || !joinPayload}
        >
          {isLoading ? <Spinner /> : 'Join'}
        </button>
      </form>
    </div>
  );
};
