import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { apiClient } from '../api';
import {
  clientLogout,
  getAccessToken,
  getAppEndpointKey,
  setAccessToken,
  setAppEndpointKey,
  setRefreshToken,
} from '../storage/storage';
import CalimeroLoginModal from './CalimeroLoginModal';
import Toast from './Toast';
import { CalimeroApplication } from './app';
import { AppMode, CalimeroApp } from './types';
import { GlobalStyle } from '../styles/global';

interface CalimeroContextValue {
  app: CalimeroApp | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  appUrl: string | null;
  isOnline: boolean;
}

const CalimeroContext = createContext<CalimeroContextValue>({
  app: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  appUrl: null,
  isOnline: true,
});

export const useCalimero = () => useContext(CalimeroContext);

interface CalimeroProviderProps {
  children: React.ReactNode;
  clientApplicationId: string;
  mode: AppMode;
  applicationPath: string;
}

const getPermissionsForMode = (mode: AppMode): string[] => {
  switch (mode) {
    case AppMode.MultiContext:
      return ['context:execute', 'application'];
    default:
      throw new Error(`Unsupported application mode: ${mode}`);
  }
};

export const CalimeroProvider: React.FC<CalimeroProviderProps> = ({
  children,
  clientApplicationId,
  mode,
  applicationPath,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [appUrl, setAppUrl] = useState<string | null>(getAppEndpointKey());

  const performLogin = useCallback(
    (url: string) => {
      const permissions = getPermissionsForMode(mode);
      apiClient.auth().login({
        url,
        callbackUrl: window.location.href,
        applicationId: clientApplicationId,
        permissions,
        applicationPath,
      });
    },
    [clientApplicationId, mode, applicationPath],
  );

  const logout = useCallback(() => {
    clientLogout();
    setIsAuthenticated(false);
    setIsOnline(true);
    setAppUrl(null);
  }, []);

  useEffect(() => {
    const fragment = window.location.hash.substring(1); // Remove the leading #
    const fragmentParams = new URLSearchParams(fragment);
    const encodedAccessToken = fragmentParams.get('access_token');
    const encodedRefreshToken = fragmentParams.get('refresh_token');

    if (encodedAccessToken && encodedRefreshToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      const newAppUrl = getAppEndpointKey();
      setAppUrl(newAppUrl);
      if (!newAppUrl) return;

      const verify = async () => {
        const response = await apiClient.node().health({ url: newAppUrl });
        if (!response.error) {
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
          const response = await apiClient.node().health({ url: savedUrl });
          if (!response.error) {
            setIsAuthenticated(true);
            setIsOnline(true);
          } else if (response.error.code === 401) {
            performLogin(savedUrl);
          }
        } catch (error) {
          logout();
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, [performLogin, logout]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (!isAuthenticated) return;
      const savedUrl = getAppEndpointKey();
      if (savedUrl) {
        try {
          const response = await apiClient.node().health({ url: savedUrl });

          if (response.error && response.error.code === 401) {
            logout();
            setToast({
              message: 'Session expired. Please connect again.',
              type: 'error',
            });
            return;
          }

          if (response.error && isOnline) {
            setToast({
              message: 'Connection lost. Trying to reconnect...',
              type: 'error',
            });
            setIsOnline(false);
          } else if (!response.error && !isOnline) {
            setToast({ message: 'Connection restored.', type: 'success' });
            setIsOnline(true);
            setTimeout(() => setToast(null), 5000);
          }
        } catch (error) {
          if (isOnline) {
            setToast({
              message: 'Connection lost. Trying to reconnect...',
              type: 'error',
            });
            setIsOnline(false);
          }
        }
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isOnline, logout]);

  const handleConnect = (url: string) => {
    setAppEndpointKey(url);
    setAppUrl(url);
    performLogin(url);
  };

  const login = () => setIsLoginOpen(true);
  const app =
    isAuthenticated && isOnline
      ? new CalimeroApplication(apiClient, clientApplicationId)
      : null;

  return (
    <CalimeroContext.Provider
      value={{ app, isAuthenticated, login, logout, appUrl, isOnline }}
    >
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <GlobalStyle />
          {children}
          {isLoginOpen && (
            <CalimeroLoginModal
              onConnect={handleConnect}
              onClose={() => setIsLoginOpen(false)}
            />
          )}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </>
      )}
    </CalimeroContext.Provider>
  );
};
