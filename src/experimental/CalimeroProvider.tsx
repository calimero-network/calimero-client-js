import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { apiClient } from '../api';
import {
  clearAccessToken,
  clearAppEndpoint,
  clearApplicationId,
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
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('error');
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
    clearAccessToken();
    clearApplicationId();
    clearAppEndpoint();
    setIsAuthenticated(false);
    setIsOnline(true);
    setAppUrl(null);
  }, []);

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
      const newAppUrl = getAppEndpointKey();
      setAppUrl(newAppUrl);
      if (!newAppUrl) return;

      const verify = async () => {
        const response = await fetch(`${newAppUrl}/admin-api/health`, {
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
  }, [performLogin, logout]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (!isAuthenticated) return;
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();
      if (savedUrl && savedToken) {
        try {
          const response = await fetch(`${savedUrl}/admin-api/health`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (response.status === 401) {
            logout();
            setToastMessage('Session expired. Please connect again.');
            setToastType('error');
            return;
          }

          if (!response.ok && isOnline) {
            setToastMessage('Connection lost. Trying to reconnect...');
            setToastType('error');
            setIsOnline(false);
          } else if (response.ok && !isOnline) {
            setToastMessage('Connection restored.');
            setToastType('success');
            setIsOnline(true);
            setTimeout(() => setToastMessage(''), 5000);
          }
        } catch (error) {
          if (isOnline) {
            setToastMessage('Connection lost. Trying to reconnect...');
            setToastType('error');
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
          {toastMessage && (
            <Toast
              message={toastMessage}
              type={toastType}
              onClose={() => setToastMessage('')}
            />
          )}
        </>
      )}
    </CalimeroContext.Provider>
  );
};
