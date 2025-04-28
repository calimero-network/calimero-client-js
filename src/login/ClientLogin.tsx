import React, { useCallback, useEffect, useState } from 'react';

import {
  clearAppEndpoint,
  clearApplicationId,
  getAppEndpointKey,
  getApplicationId,
  setAccessToken,
  setContextId,
  setExecutorPublicKey,
  setRefreshToken,
} from '../storage/storage';
import {
  ErrorMessage,
  LoginButton,
  LoginContainer,
  LoginHeader,
  LoginHeaderSpan,
} from './Components';
import {
  Context,
  FetchContextIdentitiesResponse,
  GetContextsResponse,
} from '../api/nodeApi';
import { ResponseData } from '../types';
import apiClient from '../api';
import SelectContextStep from './noAuth/SelectContext';
import { SetupModal } from '../setup/SetupModal';
import SelectIdentityStep from './noAuth/SelectContextIdentity';
import { Button } from '../context/Components';

interface ClientLoginProps {
  successRedirect: () => void;
  authMode?: boolean;
}

interface LoginState {
  nodeServerUrl: string;
  applicationId: string;
  selectedContextId: string;
  contexts: Context[];
  contextIdentities: string[];
  errorMessage: string;
}

const initialState: LoginState = {
  nodeServerUrl: '',
  applicationId: '',
  selectedContextId: '',
  contexts: [],
  contextIdentities: [],
  errorMessage: '',
};

export const ClientLogin: React.FC<ClientLoginProps> = ({
  successRedirect,
  authMode = true,
}) => {
  const [state, setState] = useState<LoginState>({
    ...initialState,
    nodeServerUrl: getAppEndpointKey() ?? '',
    applicationId: getApplicationId() ?? '',
  });

  const {
    nodeServerUrl,
    applicationId,
    selectedContextId,
    contexts,
    contextIdentities,
    errorMessage,
  } = state;

  const updateState = (newState: Partial<LoginState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const resetSetup = () => {
    clearAppEndpoint();
    clearApplicationId();
    updateState({
      nodeServerUrl: '',
      applicationId: '',
    });
  };

  const redirectToDashboardLogin = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    const redirectUrl = `${nodeServerUrl}/admin-dashboard/?application_id=${applicationId}&callback_url=${callbackUrl}`;
    window.location.href = redirectUrl;
  };

  const fetchAvailableContexts = useCallback(async () => {
    if (errorMessage) return;

    try {
      const response: ResponseData<GetContextsResponse> = await apiClient
        .node()
        .getContexts();

      if (response.error) {
        updateState({ errorMessage: response.error.message });
        return;
      }

      const filteredContexts =
        response.data?.contexts.filter(
          (context) => context.applicationId === applicationId,
        ) ?? [];

      updateState({ contexts: filteredContexts });
    } catch (error) {
      updateState({ errorMessage: 'Failed to fetch contexts' });
    }
  }, [applicationId, errorMessage]);

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
    successRedirect();
  };

  useEffect(() => {
    if (nodeServerUrl && applicationId && !authMode) {
      fetchAvailableContexts();
    }
  }, [nodeServerUrl, applicationId, authMode, fetchAvailableContexts]);

  useEffect(() => {
    if (selectedContextId) {
      fetchContextIdentities();
    }
  }, [selectedContextId, fetchContextIdentities]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedAccessToken = urlParams.get('access_token');
    const encodedRefreshToken = urlParams.get('refresh_token');

    if (encodedAccessToken && encodedRefreshToken) {
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      successRedirect();
    }
  }, [successRedirect]);

  if (!nodeServerUrl || !applicationId) {
    return (
      <LoginContainer>
        <SetupModal
          setAppId={(id) => updateState({ applicationId: id })}
          setNodeServerUrl={(url) => updateState({ nodeServerUrl: url })}
        />
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      {authMode ? (
        <>
          <LoginHeader>
            <LoginHeaderSpan>Login with Admin Dashboard</LoginHeaderSpan>
          </LoginHeader>
          <LoginButton onClick={redirectToDashboardLogin}>Login</LoginButton>
        </>
      ) : (
        <>
          <LoginHeader>
            <LoginHeaderSpan>Select Context ID and Identity</LoginHeaderSpan>
          </LoginHeader>
          {!selectedContextId ? (
            <SelectContextStep
              applicationId={applicationId}
              contextList={contexts}
              setSelectedContextId={(id) =>
                updateState({ selectedContextId: id })
              }
              updateLoginStep={() => {}}
            />
          ) : (
            <SelectIdentityStep
              applicationId={applicationId}
              selectedContextId={selectedContextId}
              contextIdentities={contextIdentities}
              updateLoginStep={handleIdentitySelection}
              backStep={() => updateState({ selectedContextId: '' })}
            />
          )}
        </>
      )}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <Button onClick={resetSetup} style={{ marginTop: '1rem' }}>
        Back to Setup
      </Button>
    </LoginContainer>
  );
};
