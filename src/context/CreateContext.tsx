import React, { useEffect, useState } from 'react';
import { getApplicationId } from '../storage';
import apiClient from '../api';
import { ResponseData } from '../types';
import { Context, GetContextsResponse } from '../api/nodeApi';
import Spinner from '../components/loader/Spinner';
import { DeleteIcon } from '../components';

export const CreateContext: React.FC = () => {
  const applicationId = getApplicationId();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('near');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const fetchAvailableContexts = async () => {
    const fetchContextsResponse: ResponseData<GetContextsResponse> =
      await apiClient.node().getContexts();
    const contexts =
      fetchContextsResponse.data?.contexts.filter(
        (context) => context.applicationId === applicationId,
      ) ?? [];
    setContexts(contexts);
  };

  useEffect(() => {
    fetchAvailableContexts();
  }, [applicationId]);

  const handleCreateContext = async () => {
    setError(null);
    setIsLoading(true);
    const fetchData = await apiClient
      .node()
      .createContext(applicationId, selectedProtocol);

    if (fetchData.error) {
      setError(fetchData.error.message);
    } else {
      await fetchAvailableContexts();
    }
    setIsLoading(false);
  };

  const handleDeleteContext = async (contextId: string) => {
    setIsDeleting(true);
    const fetchData = await apiClient.node().deleteContext(contextId);
    if (fetchData.error) {
      setError(fetchData.error.message);
    } else {
      await fetchAvailableContexts();
    }
    setIsDeleting(false);
  };

  return (
    <div className="create-tab">
      <h2>Create Context</h2>
      <p>Application ID: {applicationId}</p>
      <label>Choose Protocol:</label>
      <div className="flex-container">
        <div className="protocol-selection">
          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
          >
            <option value="near">NEAR</option>
            <option value="ethereum">Ethereum</option>
            <option value="starknet">Starknet</option>
            <option value="stellar">Stellar</option>
            <option value="icp">ICP</option>
          </select>
        </div>
        <button
          disabled={isLoading}
          onClick={handleCreateContext}
          className="button-rounded btn-static"
        >
          {isLoading ? <Spinner /> : 'Create New Context'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <h3>Existing Contexts</h3>
      <div className="scrollable-list">
        {contexts.map((context, index) => (
          <div key={index} className="list-item">
            <span>
              {index + 1}. {context.id}
            </span>
            {isDeleting ? (
              <Spinner />
            ) : (
              <DeleteIcon onClick={() => handleDeleteContext(context.id)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
