import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import Spinner from '../components/loader/Spinner';
import CalimeroLogo from './CalimeroLogo';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const OverlayBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const OverlayContent = styled.div`
  position: relative;
  background: var(--background-color);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  animation: ${slideIn} 0.4s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const OverlayHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;

  h1 {
    margin: 0;
    font-size: 24px;
    color: var(--text-color);
  }
`;

const StyledCalimeroLogo = styled(CalimeroLogo)`
  width: 40px;
  height: 40px;
  margin-bottom: 0;
  color: var(--text-color);
`;

const InfoText = styled.p`
  margin-bottom: 20px;
  color: var(--text-secondary-color);
`;

const LocalNodeInfo = styled.p`
  color: var(--text-secondary-color);
  margin: 12px 0;
`;

const ErrorMessage = styled.p`
  color: #ff4d4d;
  margin-bottom: 20px;
`;

const RadioGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text-color);
  }
`;

const InputContainer = styled.div`
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
  width: 100%;

  input {
    padding: 12px;
    width: 100%;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-sizing: border-box;
    background-color: var(--background-input);
    color: var(--text-color-input);
    transition:
      border-color 0.3s,
      box-shadow 0.3s;

    &:focus {
      border-color: var(--success-color);
      box-shadow: 0 0 0 2px rgba(168, 230, 64, 0.2);
      outline: none;
    }
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const StyledButton = styled.button`
  padding: 12px 24px;
  border: 1px solid var(--primary-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition:
    background-color 0.3s,
    color 0.3s;

  &.connect-button {
    background-color: var(--success-color);
    color: var(--background-color);
    border-color: var(--success-color);

    &:hover {
      background-color: var(--success-hover-color);
      border-color: var(--success-hover-color);
    }

    &:disabled {
      background-color: var(--disabled-color);
      border-color: var(--disabled-color);
      cursor: not-allowed;
    }
  }

  &.help-button {
    background-color: var(--background-color);
    color: var(--text-color);
    border-color: var(--border-color);

    &:hover {
      background-color: var(--primary-color);
      color: var(--background-color);
      border-color: var(--primary-color);
    }
  }
`;

const CloseIconButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary-color);
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: var(--text-color);
  }
`;

const isValidUrl = (urlString: string): boolean => {
  if (!urlString || urlString.trim() === '') {
    return false;
  }

  try {
    // Add protocol if missing
    const urlToTest = urlString.startsWith('http://') || urlString.startsWith('https://') 
      ? urlString 
      : `https://${urlString}`;
    
    const url = new URL(urlToTest);
    
    // Check if it's a valid HTTP/HTTPS URL with a proper hostname
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    if (!url.hostname || url.hostname === '') {
      return false;
    }
    
    // Check for valid hostname patterns: localhost, IP address, or domain name
    const hostname = url.hostname;
    
    // Allow localhost
    if (hostname === 'localhost') {
      return true;
    }
    
    // Check for valid IP address (IPv4)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      // Validate each octet is 0-255
      const octets = hostname.split('.').map(Number);
      return octets.every(octet => octet >= 0 && octet <= 255);
    }
    
    // Check for valid domain name (at least one dot, valid characters)
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(hostname) && hostname.includes('.');
    
  } catch {
    return false;
  }
};

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
      setIsValid(isValidUrl(nodeUrl));
    } else {
      setIsValid(true);
    }
  }, [nodeUrl, nodeType]);

  const handleConnect = useCallback(async () => {
    if (isValid) {
      setLoading(true);
      setError(null);
      const finalUrl = nodeType === 'local' ? `http://localhost` : nodeUrl;

      try {
        const response = await fetch(`${finalUrl}/admin-api/is-authed`);

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
  }, [isValid, nodeType, nodeUrl, onConnect]);

  return (
    <OverlayBackdrop onClick={onClose}>
      <OverlayContent onClick={(e) => e.stopPropagation()}>
        <CloseIconButton onClick={onClose}>&times;</CloseIconButton>
        <OverlayHeader>
          <StyledCalimeroLogo />
          <h1>Calimero Connect</h1>
        </OverlayHeader>
        {loading ? (
          <SpinnerContainer>
            <p>Connecting to node...</p>
            <Spinner />
          </SpinnerContainer>
        ) : (
          <>
            <InfoText>Select your Calimero node type to continue.</InfoText>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            <RadioGroup>
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
            </RadioGroup>
            <InputContainer>
              {nodeType === 'remote' ? (
                <input
                  type="text"
                  value={nodeUrl}
                  onChange={(e) => setNodeUrl(e.target.value)}
                  placeholder="https://your-node-url.calimero.network"
                />
              ) : (
                <LocalNodeInfo>
                  Using default local node: http://localhost
                </LocalNodeInfo>
              )}
            </InputContainer>
            <ButtonGroup>
              <StyledButton
                onClick={handleConnect}
                disabled={!isValid || loading}
                className="connect-button"
              >
                Connect
              </StyledButton>
            </ButtonGroup>
          </>
        )}
      </OverlayContent>
    </OverlayBackdrop>
  );
};

export default CalimeroLoginModal;
