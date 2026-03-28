import React, { useState } from 'react';
import Spinner from '../components/loader/Spinner';
import { apiClient } from '../api';
import { JoinContextResponse, SignedOpenInvitation } from '../api/nodeApi';
import { ResponseData } from '../types';
import {
  Button,
  ErrorMessage,
  FormGroup,
  FormInput,
  Heading2,
  Paragraph,
  SuccessMessage,
} from './Components';

export const JoinContext: React.FC = () => {
  const [newMemberPublicKey, setNewMemberPublicKey] = useState<string>('');
  const [joinPayload, setJoinPayload] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setJoinError('');
    setIsSuccess(false);

    let invitation: SignedOpenInvitation;
    try {
      invitation = JSON.parse(joinPayload);
    } catch {
      setJoinError('Invalid invitation payload — must be valid JSON.');
      setIsLoading(false);
      return;
    }

    const response: ResponseData<JoinContextResponse> = await apiClient
      .node()
      .joinContext(invitation, newMemberPublicKey);
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
      <Heading2>Join Existing Context</Heading2>
      <Paragraph>
        To join a context you need an invitation payload and your public key.
      </Paragraph>
      <form onSubmit={handleJoinSubmit}>
        <FormGroup>
          <FormInput
            type="text"
            value={newMemberPublicKey}
            onChange={(e) => setNewMemberPublicKey(e.target.value)}
            placeholder="Enter your public key"
          />
        </FormGroup>
        <FormGroup>
          <FormInput
            type="text"
            value={joinPayload}
            onChange={(e) => setJoinPayload(e.target.value)}
            placeholder="Paste invitation payload (JSON)"
          />
        </FormGroup>
        {joinError && <ErrorMessage>{joinError}</ErrorMessage>}
        {isSuccess && (
          <SuccessMessage>Successfully joined context</SuccessMessage>
        )}
        <Button
          type="submit"
          className="button-rounded button-size-md"
          disabled={isLoading || !newMemberPublicKey || !joinPayload}
        >
          {isLoading ? <Spinner /> : 'Join'}
        </Button>
      </form>
    </div>
  );
};
