import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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
import {
  AppMode,
  CalimeroApp,
  ConnectionType,
  CustomConnectionConfig,
  EventStreamMode,
} from './types';
import { GlobalStyle } from '../styles/global';

interface CalimeroContextValue {
  app: CalimeroApp | null;
  isAuthenticated: boolean;
  login: (connectionType?: ConnectionType | CustomConnectionConfig) => void;
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

export interface CalimeroProviderProps {
  children: React.ReactNode;
  /**
   * Legacy: Hash-based application ID (for backwards compatibility)
   */
  clientApplicationId?: string;
  /**
   * Package name in reverse DNS format (e.g., 'network.calimero.meropass')
   * Preferred over clientApplicationId
   */
  packageName?: string;
  /**
   * Optional specific version. If not provided, uses latest version.
   */
  packageVersion?: string;
  /**
   * Optional registry URL for fetching package manifests
   * Defaults to production registry (https://mero-registry.vercel.app/api)
   * Override for development/testing (e.g., 'http://localhost:8082')
   * Used only when packageName is provided
   */
  registryUrl?: string;
  mode: AppMode;
  /**
   * Application path (only used for legacy clientApplicationId approach)
   */
  applicationPath?: string;
  /**
   * Event streaming mode for real-time subscriptions.
   * Defaults to WebSocket for backwards compatibility.
   */
  eventStreamMode?: EventStreamMode;
}

const getPermissionsForMode = (mode: AppMode): string[] => {
  switch (mode) {
    case AppMode.MultiContext:
      // Context-scoped permissions for multi-context applications
      // - create: Create new contexts (vaults)
      // - list: List user's contexts
      // - execute: Execute methods within contexts
      return ['context:create', 'context:list', 'context:execute'];
    default:
      throw new Error(`Unsupported application mode: ${mode}`);
  }
};

export const CalimeroProvider: React.FC<CalimeroProviderProps> = ({
  children,
  clientApplicationId,
  packageName,
  packageVersion,
  registryUrl,
  mode,
  applicationPath,
  eventStreamMode = EventStreamMode.WebSocket,
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
  const [currentConnectionType, setCurrentConnectionType] = useState<
    ConnectionType | CustomConnectionConfig | null
  >(null);
  const [resolvedApplicationId, setResolvedApplicationId] = useState<string | null>(() => {
    // Try localStorage first, then fall back to prop
    return localStorage.getItem('calimero-application-id') || clientApplicationId || null;
  });

  const performLogin = useCallback(
    (url: string) => {
      console.log('🔍 performLogin called with:', { url, packageName, packageVersion, registryUrl });
      const permissions = getPermissionsForMode(mode);
      
      // Prefer package-based approach over legacy application ID
      if (packageName) {
        // Pass package-name directly - auth frontend will fetch latest version from registry
        const authParams = new URLSearchParams();
        authParams.append('callback-url', window.location.href);
        authParams.append('permissions', permissions.join(','));
        authParams.append('package-name', packageName);
        if (packageVersion) {
          authParams.append('package-version', packageVersion);
        }
        if (registryUrl) {
          authParams.append('registry-url', registryUrl);
        }
        if (applicationPath) {
          authParams.append('application-path', applicationPath);
        }
        
        const finalUrl = `${url}/auth/login?${authParams.toString()}`;
        console.log('🚀 Redirecting to:', finalUrl);
        // Redirect to auth service
        window.location.href = finalUrl;
        return;
      } else if (clientApplicationId) {
        // Legacy: use application ID (requires applicationPath)
        if (!applicationPath) {
          throw new Error('applicationPath is required when using clientApplicationId');
        }
        apiClient.auth().login({
          url,
          callbackUrl: window.location.href,
          applicationId: clientApplicationId,
          permissions,
          applicationPath,
        });
      } else {
        throw new Error('Either packageName or clientApplicationId must be provided');
      }
    },
    [packageName, packageVersion, registryUrl, clientApplicationId, mode, applicationPath],
  );

  const logout = useCallback(() => {
    clientLogout();
    localStorage.removeItem('calimero-application-id'); // Clear stored app ID
    setResolvedApplicationId(null);
    setIsAuthenticated(false);
    setIsOnline(true);
  }, []);

  useEffect(() => {
    const fragment = window.location.hash.substring(1); // Remove the leading #
    if (!fragment) return; // No fragment, nothing to do
    
    const fragmentParams = new URLSearchParams(fragment);
    const encodedAccessToken = fragmentParams.get('access_token');
    const encodedRefreshToken = fragmentParams.get('refresh_token');
    const applicationId = fragmentParams.get('application_id');

    if (encodedAccessToken && encodedRefreshToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      
      // Store resolved application ID from auth callback
      if (applicationId) {
        console.log('✅ Resolved application ID from auth:', applicationId);
        setResolvedApplicationId(applicationId);
        // Persist to localStorage for subsequent page loads
        localStorage.setItem('calimero-application-id', applicationId);
        console.log('✅ Stored in localStorage:', localStorage.getItem('calimero-application-id'));
      }
      
      const newAppUrl = getAppEndpointKey();
      setAppUrl(newAppUrl);
      if (!newAppUrl) return;

      const verify = async () => {
        const response = await apiClient.node().checkAuth();
        if (!response.error) {
          setIsAuthenticated(true);
        }
      };
      verify();
    }
  }, []);  // Run once on mount to check for auth callback

  useEffect(() => {
    const checkSession = async () => {
      const savedUrl = getAppEndpointKey();
      const savedToken = getAccessToken();
      if (savedUrl && savedToken) {
        try {
          const response = await apiClient.node().checkAuth();
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
          const response = await apiClient.node().checkAuth();

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
    console.log('🎯 handleConnect called with url:', url);
    console.log('🎯 Will call performLogin with packageName:', packageName);
    setAppEndpointKey(url);
    setAppUrl(url);
    performLogin(url);
    console.log('🎯 performLogin should have been called');
  };

  const login = (connectionType?: ConnectionType | CustomConnectionConfig) => {
    if (!connectionType) {
      setCurrentConnectionType(ConnectionType.RemoteAndLocal);
      setIsLoginOpen(true);
      return;
    }

    // Handle Custom connection type - skip modal and connect directly
    if (
      typeof connectionType === 'object' &&
      connectionType.type === ConnectionType.Custom
    ) {
      handleConnect(connectionType.url);
      return;
    }

    setCurrentConnectionType(connectionType);
    setIsLoginOpen(true);
  };

  const app = useMemo(
    () =>
      isAuthenticated && resolvedApplicationId
        ? new CalimeroApplication(
            apiClient,
            resolvedApplicationId,
            eventStreamMode,
          )
        : null,
    [isAuthenticated, resolvedApplicationId, eventStreamMode],
  );

  useEffect(() => {
    // Closes event stream connection (WebSocket/SSE) on logout or when the component unmounts
    return () => {
      app?.close();
    };
  }, [app]);

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
          {isLoginOpen && currentConnectionType && (
            <CalimeroLoginModal
              onConnect={handleConnect}
              onClose={() => setIsLoginOpen(false)}
              connectionType={currentConnectionType}
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
