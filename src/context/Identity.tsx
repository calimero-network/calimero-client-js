import React, { useEffect, useState } from 'react';
import { getApplicationId } from '../storage';
import { ResponseData } from '../types';
import {
  Context,
  FetchContextIdentitiesResponse,
  GetContextsResponse,
  NodeIdentity,
} from '../api/nodeApi';
import apiClient from '../api';
import Spinner from '../components/loader/Spinner';

const NEW_IDENTITY_KEY = 'new-identity';

export const Identity: React.FC = () => {
  const applicationId = getApplicationId();
  const [identities, setIdentities] = useState<string[]>([]);
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [contextLoading, setContextLoading] = useState<boolean>(true);
  const [identityLoading, setIdentityLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newIdentity, setNewIdentity] = useState<NodeIdentity | null>(null);

  const fetchAvailableContexts = async () => {
    setContextLoading(true);
    const fetchContextsResponse: ResponseData<GetContextsResponse> =
      await apiClient.node().getContexts();
    const contexts =
      fetchContextsResponse.data?.contexts.filter(
        (context) => context.applicationId === applicationId,
      ) ?? [];
    setContexts(contexts);
    setSelectedContext(contexts[0]);
    setContextLoading(false);
  };

  useEffect(() => {
    fetchAvailableContexts();
  }, [applicationId]);

  const fetchContextIdentities = async () => {
    if (!selectedContext?.id) return;

    setIdentityLoading(true);
    const fetchContextIdentitiesResponse: ResponseData<FetchContextIdentitiesResponse> =
      await apiClient.node().fetchContextIdentities(selectedContext.id);
    if (fetchContextIdentitiesResponse.error) {
      setError(fetchContextIdentitiesResponse.error.message);
    } else {
      setIdentities(fetchContextIdentitiesResponse.data.identities);
    }
    setIdentityLoading(false);
  };

  useEffect(() => {
    if (selectedContext) {
      fetchContextIdentities();
    }
  }, [selectedContext]);

  const handleCreateIdentity = async () => {
    setError(null);
    setIsLoading(true);
    const fetchData: ResponseData<NodeIdentity> = await apiClient
      .node()
      .createNewIdentity();

    if (fetchData.error) {
      setError(fetchData.error.message);
    } else {
      setNewIdentity(fetchData.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (newIdentity) {
      localStorage.setItem(NEW_IDENTITY_KEY, JSON.stringify(newIdentity));
    } else {
      const newIdentity = localStorage.getItem(NEW_IDENTITY_KEY);
      if (newIdentity) {
        setNewIdentity(JSON.parse(newIdentity));
      }
    }
  }, [newIdentity]);

  const deleteIdentity = () => {
    localStorage.removeItem(NEW_IDENTITY_KEY);
    setNewIdentity(null);
  };

  return (
    <div className="identity-tab">
      <div className="flex-container">
        <div>
          <h2>Identities</h2>
          <button
            onClick={handleCreateIdentity}
            className="button-rounded"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Create New Identity'}
          </button>
        </div>
        {newIdentity && (
          <div className="identity-container">
            <label>New Identity</label>
            <p className="text-sm">
              Public Key: <br></br>
              {newIdentity?.publicKey}
            </p>
            <p className="text-sm">
              Private Key: <br></br>
              {newIdentity?.privateKey}
            </p>
            <div className="delete-icon" onClick={deleteIdentity}>
              x
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      <div className="context-selector">
        <label>Select Context:</label>
        {contextLoading ? (
          <div>Loading contexts...</div>
        ) : (
          <select
            id="context-select"
            className="dropdown-selector"
            value={selectedContext?.id || ''}
            onChange={(e) => {
              const selected = contexts?.find(
                (context) => context.id === e.target.value,
              );
              setSelectedContext(selected || null);
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
      <label>Available Identities:</label>
      <div className="scrollable-list">
        {identityLoading ? (
          <div>Loading identities...</div>
        ) : (
          identities.length > 0 &&
          identities.map((identity, index) => (
            <div key={index} className="list-item">
              <span>
                {index + 1}. {identity}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
