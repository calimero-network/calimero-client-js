import React, { useEffect, useState } from 'react';
import { getApplicationId } from '../storage';
import apiClient from '../api';
import { ResponseData } from '../types';
import { Context, GetContextsResponse } from '../api/nodeApi';
import Spinner from '../components/loader/Spinner';
import { DeleteIcon } from '../components';
import {
  Button,
  DropdownSelector,
  ErrorMessage,
  FlexContainer,
  Heading2,
  Heading3,
  ListItem,
  Paragraph,
  ScrollableList,
} from './Components';

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
      <Heading2>Create Context</Heading2>
      <Paragraph>Application ID: {applicationId}</Paragraph>
      <label>Choose Protocol:</label>
      <FlexContainer>
        <div>
          <DropdownSelector
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
          >
            <option value="near">NEAR</option>
            <option value="ethereum">Ethereum</option>
            <option value="starknet">Starknet</option>
            <option value="stellar">Stellar</option>
            <option value="icp">ICP</option>
          </DropdownSelector>
        </div>
        <Button
          disabled={isLoading}
          onClick={handleCreateContext}
          className="button-rounded"
          style={{ width: '177px' }}
        >
          {isLoading ? <Spinner /> : 'Create New Context'}
        </Button>
      </FlexContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Heading3>Existing Contexts</Heading3>
      <ScrollableList>
        {contexts.map((context, index) => (
          <ListItem key={index}>
            <span>
              {index + 1}. {context.id}
            </span>
            {isDeleting ? (
              <Spinner />
            ) : (
              <DeleteIcon onClick={() => handleDeleteContext(context.id)} />
            )}
          </ListItem>
        ))}
      </ScrollableList>
    </div>
  );
};
