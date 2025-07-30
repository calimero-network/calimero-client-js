import React, { useCallback, useEffect, useState } from 'react';
import {
  clearAccessToken,
  clearAppEndpoint,
  clearApplicationId,
  getAccessToken,
  getAppEndpointKey,
  setAccessToken,
  setApplicationId,
  setAppEndpointKey,
  setRefreshToken,
} from '../../storage/storage';
import { apiClient } from '../../api';
import CalimeroConnect from './CalimeroConnect';
import Toast from '../toast/Toast';

interface CalimeroLoginProps {
  clientApplicationId: string;
  permissions: string[];
  applicationPath: string;
}

export const CalimeroLogin: React.FC<CalimeroLoginProps> = ({
  clientApplicationId,
  permissions,
  applicationPath,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nodeUrl, setNodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const login = useCallback(
    (url: string) => {
      apiClient.auth().login({
        url,
        callbackUrl: window.location.href,
        applicationId: clientApplicationId,
        permissions,
        applicationPath,
      });
    },
    [clientApplicationId, permissions, applicationPath],
  );

  const handleLogout = () => {
    clearAccessToken();
    clearApplicationId();
    clearAppEndpoint();
    setIsAuthenticated(false);
    setIsOnline(true);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedAccessToken = urlParams.get('access_token');
    const encodedRefreshToken = urlParams.get('refresh_token');

    if (encodedAccessToken && encodedRefreshToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      const appUrl = getAppEndpointKey();

      const verifyConnection = async () => {
        if (!appUrl) {
          console.error('Application URL not found after login redirect.');
          return;
        }
        try {
          const response = await fetch(`${appUrl}/admin-api/health`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.data?.status === 'alive') {
              if (clientApplicationId) {
                setApplicationId(clientApplicationId);
              }
              setIsAuthenticated(true);
              setIsOnline(true);
            } else {
              console.error('Health check failed: Invalid response');
            }
          } else {
            console.error('Health check failed: Network response was not ok');
          }
        } catch (error) {
          console.error('Health check failed:', error);
        }
      };
      verifyConnection();
    }
  }, [clientApplicationId, setIsAuthenticated]);

  useEffect(() => {
    const checkExistingSession = async () => {
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();

      if (savedUrl && savedToken) {
        try {
          const response = await fetch(`${savedUrl}/admin-api/health`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.data?.status === 'alive') {
              setIsAuthenticated(true);
              setIsOnline(true);
            } else {
              throw new Error('Invalid health check response.');
            }
          } else if (response.status === 401) {
            // Token expired, re-login
            login(savedUrl);
          } else {
            throw new Error('Failed to verify session.');
          }
        } catch (error) {
          console.error('Session check failed:', error);
          clearAccessToken();
          clearAppEndpoint();
          clearApplicationId();
        }
      }
      setIsLoading(false);
    };

    checkExistingSession();
  }, [clientApplicationId, setIsAuthenticated, login]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(async () => {
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();

      if (savedUrl && savedToken) {
        try {
          const response = await fetch(`${savedUrl}/admin-api/health`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (!response.ok) {
            if (isOnline) {
              setToastMessage('Connection lost. Trying to reconnect...');
              setIsOnline(false);
            }
          } else {
            if (!isOnline) {
              setToastMessage('Connection restored.');
              setIsOnline(true);
              setTimeout(() => setToastMessage(''), 5000);
            }
          }
        } catch (error) {
          if (isOnline) {
            setToastMessage('Connection lost. Trying to reconnect...');
            setIsOnline(false);
          }
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated, isOnline]);

  useEffect(() => {
    if (nodeUrl) {
      login(nodeUrl);
    }
  }, [nodeUrl, login]);

  const handleConnect = (url: string) => {
    setAppEndpointKey(url);
    setNodeUrl(url);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner
  }

  return (
    <>
      <CalimeroConnect
        onConnect={handleConnect}
        isAuthenticated={isAuthenticated && isOnline}
        onLogout={handleLogout}
      />
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}
    </>
  );
};
