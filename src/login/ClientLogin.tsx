import React, { useCallback, useEffect, useState } from 'react';

import {
  clearAccessToken,
  clearAppEndpoint,
  clearApplicationId,
  clearContextId,
  clearExecutorPublicKey,
  getAppEndpointKey,
  getApplicationId,
  setAccessToken,
  setApplicationId,
  setContextId,
  setExecutorPublicKey,
  setRefreshToken,
} from '../storage/storage';
import {
  ErrorMessage,
  LoginButton,
  LoginHeader,
  LoginHeaderSpan,
  Button,
  ModalOverlay,
  ModalContent,
} from './Components';
import {
  Context,
  FetchContextIdentitiesResponse,
  GetContextsResponse,
} from '../api/nodeApi';
import { ResponseData } from '../types';
import { apiClient } from '../api';
import Spinner from '../components/loader/Spinner';
import { SetupSpinnerContainer } from '../setup/Components';
import { SelectContext } from './noAuth/SelectContext';
import { SelectContextIdentity } from './noAuth/SelectContextIdentity';

interface ClientLoginProps {
  permissions: string[];
  authMode: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  clientApplicationId: string;
  clientApplicationPath: string;
  fetchContextApplication: () => void;
  onReset: () => void;
}

interface LoginState {
  nodeServerUrl: string;
  applicationId: string;
  selectedContextId: string;
  contexts: Context[];
  contextIdentities: string[];
  errorMessage: string;
  isLoading: boolean;
}

const initialState: LoginState = {
  nodeServerUrl: '',
  applicationId: '',
  selectedContextId: '',
  contexts: [],
  contextIdentities: [],
  errorMessage: '',
  isLoading: false,
};

export const ClientLogin: React.FC<ClientLoginProps> = ({
  permissions,
  authMode,
  setIsAuthenticated,
  clientApplicationId,
  clientApplicationPath,
  fetchContextApplication,
  onReset,
}) => {
  const [state, setState] = useState<LoginState>({
    ...initialState,
    nodeServerUrl: getAppEndpointKey() ?? '',
    applicationId: getApplicationId() ?? '',
  });

  const {
    nodeServerUrl,
    selectedContextId,
    contexts,
    contextIdentities,
    errorMessage,
    isLoading,
  } = state;

  const updateState = (newState: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const resetSetup = () => {
    clearAppEndpoint();
    clearAccessToken();
    clearContextId();
    clearExecutorPublicKey();
    clearApplicationId();
    onReset();
  };

  const fetchAvailableContexts = useCallback(async () => {
    if (errorMessage) return;

    try {
      const response: ResponseData<GetContextsResponse> = await apiClient
        .node()
        .getContexts();

      if (response.error) {
        updateState({ errorMessage: response.error.message, isLoading: false });
        return;
      }

      updateState({ contexts: response.data?.contexts, isLoading: false });
    } catch (error) {
      updateState({
        errorMessage: 'Failed to fetch contexts',
        isLoading: false,
      });
    }
  }, [errorMessage]);

  const fetchContextIdentities = useCallback(async () => {
    if (!selectedContextId) return;

    try {
      const response: ResponseData<FetchContextIdentitiesResponse> =
        await apiClient.node().fetchContextIdentities(selectedContextId);

      if (response.error) {
        updateState({ errorMessage: response.error.message });
        return;
      }

      updateState({ contextIdentities: response.data.identities });
    } catch (error) {
      updateState({ errorMessage: 'Failed to fetch context identities' });
    }
  }, [selectedContextId]);

  const handleIdentitySelection = (contextId: string, identity: string) => {
    setContextId(contextId);
    setExecutorPublicKey(identity);
    fetchContextApplication();
  };

  const login = useCallback(async () => {
    apiClient.auth().login({
      url: nodeServerUrl,
      callbackUrl: window.location.href,
      permissions: permissions,
      applicationId: clientApplicationId,
      applicationPath: clientApplicationPath,
    });
  }, [nodeServerUrl, permissions, clientApplicationId, clientApplicationPath]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedAccessToken = urlParams.get('access_token');
    const encodedRefreshToken = urlParams.get('refresh_token');

    if (encodedAccessToken && encodedRefreshToken) {
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      if (clientApplicationId) {
        setApplicationId(clientApplicationId);
        setIsAuthenticated(true);
      } else {
        fetchContextApplication();
      }
    }
  }, [nodeServerUrl]);

  useEffect(() => {
    if (authMode === false) {
      updateState({ isLoading: true });
      fetchAvailableContexts();
    }
  }, [nodeServerUrl, fetchAvailableContexts, authMode]);

  useEffect(() => {
    if (selectedContextId) {
      fetchContextIdentities();
    }
  }, [selectedContextId, fetchContextIdentities]);

  const renderLoginContent = () => {
    if (isLoading) {
      return (
        <SetupSpinnerContainer>
          <Spinner />
        </SetupSpinnerContainer>
      );
    }

    if (authMode === true) {
      return (
        <>
          <LoginButton onClick={login}>Login</LoginButton>
          <Button onClick={resetSetup} style={{ marginTop: '1rem' }}>
            Back to Setup
          </Button>
        </>
      );
    }

    return (
      <>
        <LoginHeader>
          <LoginHeaderSpan>Select Context ID and Identity</LoginHeaderSpan>
        </LoginHeader>
        {!selectedContextId ? (
          <SelectContext
            contextList={contexts}
            setSelectedContextId={(id) =>
              updateState({ selectedContextId: id })
            }
          />
        ) : (
          <SelectContextIdentity
            selectedContextId={selectedContextId}
            contextIdentities={contextIdentities}
            onSelectIdentity={handleIdentitySelection}
            backStep={() => updateState({ selectedContextId: '' })}
          />
        )}
        <Button onClick={resetSetup} style={{ marginTop: '1rem' }}>
          Back to Setup
        </Button>
      </>
    );
  };

  return (
    <ModalOverlay>
      <ModalContent>
        {errorMessage && (
          <>
            <ErrorMessage>{errorMessage}</ErrorMessage>
            <Button onClick={resetSetup} style={{ marginTop: '1rem' }}>
              Back to Setup
            </Button>
          </>
        )}
        {renderLoginContent()}
      </ModalContent>
    </ModalOverlay>
  );
};
