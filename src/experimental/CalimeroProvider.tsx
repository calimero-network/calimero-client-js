import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { ApiClient, apiClient } from '../api';
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
} from '../storage/storage';
import CalimeroLoginModal from './CalimeroLoginModal';
import Toast from './Toast';

interface CalimeroContextValue {
  client: ApiClient | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const CalimeroContext = createContext<CalimeroContextValue>({
  client: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useCalimero = () => useContext(CalimeroContext);

interface CalimeroProviderProps {
  children: React.ReactNode;
  clientApplicationId: string;
  permissions: string[];
  applicationPath: string;
}

export const CalimeroProvider: React.FC<CalimeroProviderProps> = ({
  children,
  clientApplicationId,
  permissions,
  applicationPath,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const performLogin = useCallback(
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

  const logout = () => {
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
      if (!appUrl) return;

      const verify = async () => {
        const response = await fetch(`${appUrl}/admin-api/health`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          setIsAuthenticated(true);
        }
      };
      verify();
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();
      if (savedUrl && savedToken) {
        try {
          const response = await fetch(`${savedUrl}/admin-api/health`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (response.ok) {
            setIsAuthenticated(true);
            setIsOnline(true);
          } else if (response.status === 401) {
            performLogin(savedUrl);
          }
        } catch (error) {
          logout();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, [performLogin]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const intervalId = setInterval(async () => {
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();
      if (savedUrl && savedToken) {
        try {
          const response = await fetch(`${savedUrl}/admin-api/health`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          if (!response.ok && isOnline) {
            setToastMessage('Connection lost. Trying to reconnect...');
            setIsOnline(false);
          } else if (response.ok && !isOnline) {
            setToastMessage('Connection restored.');
            setIsOnline(true);
            setTimeout(() => setToastMessage(''), 5000);
          }
        } catch (error) {
          if (isOnline) {
            setToastMessage('Connection lost. Trying to reconnect...');
            setIsOnline(false);
          }
        }
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isOnline]);

  const handleConnect = (url: string) => {
    setAppEndpointKey(url);
    performLogin(url);
  };

  const login = () => setIsLoginOpen(true);
  const client = isAuthenticated && isOnline ? apiClient : null;

  return (
    <CalimeroContext.Provider
      value={{ client, isAuthenticated, login, logout }}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {children}
          {isLoginOpen && (
            <CalimeroLoginModal
              onConnect={handleConnect}
              onClose={() => setIsLoginOpen(false)}
            />
          )}
          {toastMessage && (
            <Toast message={toastMessage} onClose={() => setToastMessage('')} />
          )}
        </>
      )}
    </CalimeroContext.Provider>
  );
};
