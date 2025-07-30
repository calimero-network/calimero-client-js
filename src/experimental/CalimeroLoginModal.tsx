import React, { useState, useEffect, useRef } from 'react';
import Spinner from '../components/loader/Spinner';
import calimeroLogo from '../assets/calimero-logo.png';
import './CalimeroLoginModal.css';

const URL_REGEX =
  /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|localhost|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[-a-z\d_]*)?$/i;

interface CalimeroLoginModalProps {
  onConnect: (url: string) => void;
  onClose: () => void;
}

const CalimeroLoginModal: React.FC<CalimeroLoginModalProps> = ({
  onConnect,
  onClose,
}) => {
  const [nodeType, setNodeType] = useState<'local' | 'remote'>('local');
  const [nodeUrl, setNodeUrl] = useState<string>('');
  const [isValid, setIsValid] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
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
      const finalUrl = nodeType === 'local' ? `http://localhost` : nodeUrl;

      try {
        const response = await fetch(`${finalUrl}/admin-api/health`);

        if (response.ok || response.status === 401) {
          setLoading(false);
          onConnect(finalUrl);
        } else {
          throw new Error(
            `Network response was not ok: ${response.statusText}`,
          );
        }
      } catch (err) {
        console.error('Connection failed:', err);
        setError('Failed to connect. Please check the URL and try again.');
        setLoading(false);
      }
    }
  };

  return (
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
            <button onClick={onClose} className="close-button">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CalimeroLoginModal;
