import React, { useEffect, useState } from 'react';
import {
  getAccessToken,
  getJWTObject,
  getAppEndpointKey,
  setAppEndpointKey,
  setAccessToken,
  setRefreshToken,
  setApplicationId,
  getContextId,
  setContextAndIdentityFromJWT,
} from '../storage';
import { ClientLogin } from './ClientLogin';
import { apiClient } from '../api';
import Spinner from '../components/loader/Spinner';
import { SetupSpinnerContainer } from '../setup/Components';
import { ErrorMessage, ModalOverlay, ModalContent, Button } from './Components';
import { SetupModal } from '../setup/SetupModal';

interface ProtectedRoutesWrapperProps {
  children: React.ReactNode;
  permissions?: string[];
  applicationId?: string;
  clientApplicationPath?: string;
}

export const ProtectedRoutesWrapper: React.FC<ProtectedRoutesWrapperProps> = ({
  children,
  permissions = [],
  applicationId = '',
  clientApplicationPath = '',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setAuthMode(null);
    setIsAuthenticated(false);
    setIsInitialized(false);
    setError(null);
    checkAuth();
  };

  const initializeApplication = async (
    accessToken: string,
    refreshToken: string,
    appId?: string,
  ) => {
    try {
      setIsLoading(true);
      // Store tokens
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setContextAndIdentityFromJWT(accessToken);

      if (appId) {
        // If applicationId is provided as prop, use it
        setApplicationId(appId);
        setIsInitialized(true);
        setIsAuthenticated(true);
      } else {
        // Otherwise fetch from context
        const contextId = getContextId();
        const response = await apiClient.node().getContext(contextId);

        if (response.error) {
          setError(response.error.message);
          return;
        }

        setApplicationId(response.data.applicationId);
        setIsInitialized(true);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setError('Failed to initialize application');
      setIsInitialized(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContextApplication = async () => {
    try {
      const contextId = getContextId();
      const response = await apiClient.node().getContext(contextId);
      if (response.error) {
        setError(response.error.message);
        return;
      }

      setApplicationId(response.data.applicationId);
      setAuthMode(false);
      if (getAccessToken()) {
        setAuthMode(true);
      }
      setIsInitialized(true);
      setIsAuthenticated(true);
    } catch (error) {
      setError('Failed to fetch context application');
      setIsInitialized(false);
    }
    setIsLoading(false);
  };

  const updateState = (newState: { nodeServerUrl: string }) => {
    setAppEndpointKey(newState.nodeServerUrl);
    setError(null);
    checkAuth();
  };

  const checkAuthMode = async () => {
    const nodeUrl = getAppEndpointKey();
    if (!nodeUrl) {
      setError('Missing node URL configuration');
      setAuthMode(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.node().health({ url: nodeUrl });
      if (response.error?.code === 401) {
        setAuthMode(true);
      } else if (response.error) {
        setError(response.error.message);
      } else {
        setAuthMode(false);
      }
    } catch (error) {
      setError('Failed to check auth mode');
    }
    setIsLoading(false);
  };

  const checkAuth = async () => {
    setIsLoading(true);

    // Check if we have a valid token
    const token = getAccessToken();
    const jwt = getJWTObject();

    if (token && jwt) {
      // Token exists, let checkAuthMode verify if it's valid
      // The httpClient will handle token refresh if needed
      await checkAuthMode();
      if (!error) {
        await fetchContextApplication(); // This will set both isAuthenticated and isInitialized
      }
    } else {
      // No token, check if we need auth
      await checkAuthMode();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Check for tokens in URL
    const urlParams = new URLSearchParams(window.location.search);
    const encodedAccessToken = urlParams.get('access_token');
    const encodedRefreshToken = urlParams.get('refresh_token');

    if (encodedAccessToken && encodedRefreshToken) {
      // Initialize application with tokens and optional applicationId
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      initializeApplication(
        accessToken,
        refreshToken,
        applicationId || undefined,
      );

      // Clean up URL by removing the tokens
      urlParams.delete('access_token');
      urlParams.delete('refresh_token');
      const newUrl =
        window.location.pathname +
        (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      checkAuth();
    }
  }, [applicationId]);

  if (isLoading) {
    return (
      <ModalOverlay>
        <ModalContent>
          <SetupSpinnerContainer>
            <Spinner />
          </SetupSpinnerContainer>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (!getAppEndpointKey()) {
    return (
      <ModalOverlay>
        <ModalContent>
          <SetupModal
            setNodeServerUrl={(url) => {
              // Clear error since we're setting up the URL
              setError(null);
              // Update the node URL in storage
              updateState({ nodeServerUrl: url });
              // Recheck auth after URL is set
              checkAuth();
            }}
          />
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay>
        <ModalContent>
          <ErrorMessage>{error}</ErrorMessage>
          <Button onClick={handleReset}>Reset</Button>
        </ModalContent>
      </ModalOverlay>
    );
  }

  // If not authenticated or not initialized, show login with current authMode state
  if (authMode !== null && (!isAuthenticated || !isInitialized)) {
    return (
      <ClientLogin
        permissions={permissions}
        authMode={authMode}
        setIsAuthenticated={setIsAuthenticated}
        clientApplicationId={applicationId}
        clientApplicationPath={clientApplicationPath}
        fetchContextApplication={fetchContextApplication}
        onReset={handleReset}
      />
    );
  }

  // Only render children when both authenticated and initialized
  return isAuthenticated && isInitialized ? <>{children}</> : null;
};
