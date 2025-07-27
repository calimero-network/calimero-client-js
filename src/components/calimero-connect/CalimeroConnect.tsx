import React, { useState, useEffect } from 'react';
import Spinner from '../loader/Spinner';
import calimeroLogo from '../../assets/calimero-logo.png';
import './CalimeroConnect.css';

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
}

const CalimeroConnect: React.FC<CalimeroConnectProps> = ({ onConnect }) => {
  const [nodeType, setNodeType] = useState<'local' | 'remote'>('local');
  const [nodeUrl, setNodeUrl] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (nodeType === 'remote') {
      setIsValid(URL_REGEX.test(nodeUrl));
    } else {
      setIsValid(true);
    }
  }, [nodeUrl, nodeType]);

  const handleConnect = async () => {
    if (isValid) {
      setLoading(true);
      setError(null);
      const finalUrl =
        nodeType === 'local' ? `http://localhost` : nodeUrl;

      try {
        const response = await fetch(`${finalUrl}/admin-api/health`);

        if (response.ok) {
          const data = await response.json();
          if (data?.data?.status === 'alive') {
            setLoading(false);
            setConnected(true);
            setIsOverlayOpen(false);
            onConnect(finalUrl);
          } else {
            throw new Error('Invalid health check response.');
          }
        } else if (response.status === 401) {
          // A 401 response means the endpoint is protected, but alive.
          setLoading(false);
          setConnected(true);
          setIsOverlayOpen(false);
          onConnect(finalUrl);
        } else {
          throw new Error(
            `Network response was not ok: ${response.statusText}`
          );
        }
      } catch (err) {
        console.error('Connection failed:', err);
        setError('Failed to connect. Please check the URL and try again.');
        setLoading(false);
      }
    }
  };

  if (connected) {
    return (
      <button className="calimero-connect-button connected" disabled>
        <img src={calimeroLogo} alt="Calimero Logo" className="calimero-logo" />
        Connected
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOverlayOpen(true)}
        className="calimero-connect-button"
      >
        <img src={calimeroLogo} alt="Calimero Logo" className="calimero-logo" />
        Connect Node
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
