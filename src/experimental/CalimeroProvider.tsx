import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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
  AppConfig,
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

/**
 * CalimeroProvider props - uses discriminated union for type safety
 *
 * See AppConfig type in types.ts for valid prop combinations.
 */
export type CalimeroProviderProps = AppConfig & {
  children: React.ReactNode;
  /**
   * Event streaming mode for real-time subscriptions.
   * Defaults to WebSocket for backwards compatibility.
   */
  eventStreamMode?: EventStreamMode;
};

const getPermissionsForMode = (mode: AppMode): string[] => {
  switch (mode) {
    case AppMode.SingleContext:
      // Single-context applications: auth flow handles context selection/creation
      // The application only needs to execute inside the granted context
      return ['context:execute'];
    case AppMode.MultiContext:
      // Multi-context applications: user can manage multiple contexts at runtime
      // Token is scoped to the application, not a specific context
      // - create: Create new contexts dynamically
      // - list: List user's contexts
      // - execute: Execute methods within any context
      return ['context:create', 'context:list', 'context:execute'];
    case AppMode.Admin:
      // Admin applications: full administrative access
      return ['admin'];
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
  const [resolvedApplicationId, setResolvedApplicationId] = useState<
    string | null
  >(() => {
    // For package-based: resolved ID from auth callback is source of truth
    // For legacy: clientApplicationId prop is the ID
    return (
      localStorage.getItem('calimero-application-id') ||
      clientApplicationId ||
      null
    );
  });

  // Track previous packageName to detect actual changes
  const prevPackageNameRef = useRef(packageName);

  // Clear resolved ID only when packageName actually changes
  useEffect(() => {
    if (packageName && packageName !== prevPackageNameRef.current) {
      // Package changed - clear old resolved ID to force re-resolution
      const storedId = localStorage.getItem('calimero-application-id');
      if (storedId) {
        localStorage.removeItem('calimero-application-id');
        setResolvedApplicationId(null);
      }
      prevPackageNameRef.current = packageName;
    } else if (clientApplicationId) {
      // Legacy: prop is the source of truth, update if different
      if (resolvedApplicationId !== clientApplicationId) {
        setResolvedApplicationId(clientApplicationId);
      }
    }
  }, [packageName, clientApplicationId, resolvedApplicationId]);

  const performLogin = useCallback(
    (url: string) => {
      const permissions = getPermissionsForMode(mode);

      // Prefer package-based approach over legacy application ID
      if (packageName) {
        // Pass package-name directly - auth frontend will fetch latest version from registry
        // Strip hash fragment from callback URL - auth service will add tokens to hash
        const callbackUrlWithoutHash = window.location.href.split('#')[0];
        const authParams = new URLSearchParams();
        authParams.append('callback-url', callbackUrlWithoutHash);
        authParams.append('permissions', permissions.join(','));
        authParams.append('mode', mode); // Explicitly pass mode to auth service
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

        // Store auth params in sessionStorage so auth-frontend can recover them
        try {
          sessionStorage.setItem(
            'calimero-auth-params',
            JSON.stringify({
              'package-name': packageName,
              'package-version': packageVersion || null,
              'registry-url': registryUrl || null,
              'callback-url': callbackUrlWithoutHash,
              permissions: permissions.join(','),
              mode,
              'application-path': applicationPath || null,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.warn('Failed to persist auth params in sessionStorage', err);
        }

        // Redirect to auth service
        window.location.href = finalUrl;
        return;
      } else if (clientApplicationId) {
        // Legacy: use application ID (requires applicationPath)
        if (!applicationPath) {
          throw new Error(
            'applicationPath is required when using clientApplicationId',
          );
        }

        try {
          sessionStorage.setItem(
            'calimero-auth-params',
            JSON.stringify({
              'application-id': clientApplicationId,
              'application-path': applicationPath,
              'callback-url': window.location.href,
              permissions: permissions.join(','),
              mode,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.warn(
            'Failed to persist legacy auth params in sessionStorage',
            err,
          );
        }
        apiClient.auth().login({
          url,
          callbackUrl: window.location.href,
          applicationId: clientApplicationId,
          permissions,
          applicationPath,
          mode, // Pass mode for proper flow detection
        });
        return;
      } else if (mode === AppMode.Admin) {
        // Strip hash fragment from callback URL - auth service will add tokens to hash
        const callbackUrlWithoutHash = window.location.href.split('#')[0];
        const authParams = new URLSearchParams();
        authParams.append('callback-url', callbackUrlWithoutHash);
        authParams.append('permissions', permissions.join(','));
        authParams.append('mode', mode);

        try {
          sessionStorage.setItem(
            'calimero-auth-params',
            JSON.stringify({
              'callback-url': window.location.href,
              permissions: permissions.join(','),
              mode,
              timestamp: Date.now(),
            }),
          );
        } catch (err) {
          console.warn(
            'Failed to persist admin auth params in sessionStorage',
            err,
          );
        }

        const finalUrl = `${url}/auth/login?${authParams.toString()}`;
        console.log('🚀 Redirecting to:', finalUrl);
        window.location.href = finalUrl;
        return;
      } else {
        throw new Error(
          'Either packageName or clientApplicationId must be provided',
        );
      }
    },
    [
      packageName,
      packageVersion,
      registryUrl,
      clientApplicationId,
      mode,
      applicationPath,
    ],
  );

  const logout = useCallback(() => {
    clientLogout();
    localStorage.removeItem('calimero-application-id'); // Clear stored app ID
    setResolvedApplicationId(null);
    setIsAuthenticated(false);
    setIsOnline(true);
  }, []);

  const processHashParams = useCallback(() => {
    const fragment = window.location.hash.substring(1); // Remove the leading #
    if (!fragment) {
      return; // No fragment, nothing to do
    }

    const fragmentParams = new URLSearchParams(fragment);
    const encodedAccessToken = fragmentParams.get('access_token');
    const encodedRefreshToken = fragmentParams.get('refresh_token');
    const applicationId = fragmentParams.get('application_id');

    if (encodedAccessToken && encodedRefreshToken) {
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);

      // Store resolved application ID from auth callback
      if (applicationId) {
        setResolvedApplicationId(applicationId);
        // Persist to localStorage for subsequent page loads
        localStorage.setItem('calimero-application-id', applicationId);
      }

      // Clean up URL by removing hash tokens (keep other hash params if any)
      fragmentParams.delete('access_token');
      fragmentParams.delete('refresh_token');
      const newFragment = fragmentParams.toString();
      const cleanUrl =
        window.location.pathname +
        window.location.search +
        (newFragment ? `#${newFragment}` : '');
      window.history.replaceState({}, document.title, cleanUrl);

      // Clean up sessionStorage
      try {
        sessionStorage.removeItem('calimero-auth-params');
      } catch (err) {
        console.warn(
          '[CalimeroProvider] Failed to clean up sessionStorage',
          err,
        );
      }

      const newAppUrl = getAppEndpointKey();
      setAppUrl(newAppUrl);

      // Set authenticated state immediately after processing tokens
      // This prevents race conditions where components check isAuthenticated
      // before the async verify() completes
      setIsAuthenticated(true);

      if (!newAppUrl) return;

      // Verify auth in background (non-blocking)
      const verify = async () => {
        const response = await apiClient.node().checkAuth();
        if (response.error) {
          // If verification fails, reset auth state
          console.warn(
            '[CalimeroProvider] Auth verification failed:',
            response.error,
          );
          setIsAuthenticated(false);
        }
      };
      verify();
    }
  }, [setResolvedApplicationId, setAppUrl, setIsAuthenticated]);

  useEffect(() => {
    // Process hash params on mount
    processHashParams();

    // Also listen for hash changes (in case hash is added after mount)
    const handleHashChange = () => {
      processHashParams();
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [processHashParams]);

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

  // Debug: Log isAuthenticated changes and expose on window for debugging
  useEffect(() => {
    console.log(
      '[CalimeroProvider] isAuthenticated changed to:',
      isAuthenticated,
    );
    // Expose on window for easy debugging in console
    if (typeof window !== 'undefined') {
      (window as any).__calimeroIsAuthenticated = isAuthenticated;
    }
  }, [isAuthenticated]);

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
    setAppEndpointKey(url);
    setAppUrl(url);
    performLogin(url);
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
