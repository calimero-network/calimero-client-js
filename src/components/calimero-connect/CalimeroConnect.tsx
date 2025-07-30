import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../loader/Spinner';
import calimeroLogo from '../../assets/calimero-logo.png';
import './CalimeroConnect.css';
import {
  clearAccessToken,
  clearAppEndpoint,
  clearApplicationId,
  getAppEndpointKey,
} from '../../storage/storage';

const URL_REGEX =
  /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|localhost|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;

interface OverlayProps {
  loading: boolean;
  isValid: boolean;
  handleConnect: () => void;
  setIsOverlayOpen: (isOpen: boolean) => void;
  nodeType: 'local' | 'remote';
  setNodeType: (type: 'local' | 'remote') => void;
  nodeUrl: string;
  setNodeUrl: (url: string) => void;
  error: string | null;
}

const Overlay: React.FC<OverlayProps> = ({
  loading,
  isValid,
  handleConnect,
  setIsOverlayOpen,
  nodeType,
  setNodeType,
  nodeUrl,
  setNodeUrl,
  error,
}) => (
  <div className="overlay-backdrop">
    <div className="overlay-content">
      <img src={calimeroLogo} alt="Calimero Logo" className="overlay-logo" />
      {loading ? (
        <>
          <p>Connecting to node...</p>
          <Spinner />
        </>
      ) : (
        <>
          <h1>Calimero Connect</h1>
          <p>Select your Calimero node type to continue.</p>
          {error && <p className="error-message">{error}</p>}
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="local"
                checked={nodeType === 'local'}
                onChange={() => setNodeType('local')}
              />
              Local
            </label>
            <label>
              <input
                type="radio"
                value="remote"
                checked={nodeType === 'remote'}
                onChange={() => setNodeType('remote')}
              />
              Remote
            </label>
          </div>
          <div className="input-container">
            {nodeType === 'remote' ? (
              <input
                type="text"
                value={nodeUrl}
                onChange={(e) => setNodeUrl(e.target.value)}
                placeholder="https://your-node-url.calimero.network"
              />
            ) : (
              <p className="local-node-info">
                Using default local node: http://localhost
              </p>
            )}
          </div>
          <div className="button-group">
            <button
              onClick={handleConnect}
              disabled={!isValid || loading}
              className="connect-button"
            >
              Connect
            </button>
          </div>
          <button
            onClick={() => setIsOverlayOpen(false)}
            className="close-button"
          >
            Close
          </button>
        </>
      )}
    </div>
  </div>
);

interface CalimeroConnectProps {
  onConnect: (url: string) => void;
  isAuthenticated?: boolean;
  onLogout: () => void;
}

const CalimeroConnect: React.FC<CalimeroConnectProps> = ({
  onConnect,
  isAuthenticated = false,
  onLogout,
}) => {
  const [nodeType, setNodeType] = useState<'local' | 'remote'>('local');
  const [nodeUrl, setNodeUrl] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeType === 'remote') {
      setIsValid(URL_REGEX.test(nodeUrl));
    } else {
      setIsValid(true);
    }
  }, [nodeUrl, nodeType]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleConnect = async () => {
    if (isValid) {
      setLoading(true);
      setError(null);
      const finalUrl = nodeType === 'local' ? `http://localhost` : nodeUrl;

      try {
        const response = await fetch(`${finalUrl}/admin-api/health`);

        if (response.ok || response.status === 401) {
          setLoading(false);
          setIsOverlayOpen(false);
          onConnect(finalUrl);
        } else {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
      } catch (err) {
        console.error('Connection failed:', err);
        setError('Failed to connect. Please check the URL and try again.');
        setLoading(false);
      }
    }
  };

  if (isAuthenticated) {
    const appUrl = getAppEndpointKey();
    let dashboardUrl;
    if (appUrl === 'http://localhost') {
      dashboardUrl = 'http://localhost:5174/admin-dashboard/';
    } else if (appUrl) {
      dashboardUrl = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
    } else {
      dashboardUrl = '#';
    }
    return (
      <div className="connected-container" ref={dropdownRef}>
        <button
          className="calimero-connect-button connected"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <img
            src={calimeroLogo}
            alt="Calimero Logo"
            className="calimero-logo"
          />
          Connected
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dropdown-item"
            >
              Dashboard
            </a>
            <button onClick={onLogout} className="dropdown-item">
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOverlayOpen(true)}
        className="calimero-connect-button"
      >
        <img src={calimeroLogo} alt="Calimero Logo" className="calimero-logo" />
        Connect
      </button>
      {isOverlayOpen && (
        <Overlay
          loading={loading}
          nodeUrl={nodeUrl}
          isValid={isValid}
          setNodeUrl={setNodeUrl}
          handleConnect={handleConnect}
          setIsOverlayOpen={setIsOverlayOpen}
          nodeType={nodeType}
          setNodeType={setNodeType}
          error={error}
        />
      )}
    </>
  );
};

export default CalimeroConnect;
