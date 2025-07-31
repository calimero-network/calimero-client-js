import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useCalimero } from './CalimeroProvider';
import CalimeroLogo from './CalimeroLogo';

const StyledButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background-color: var(--background-color);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  color: var(--text-color);
  transition: background-color 0.3s;
  min-width: 150px;
  justify-content: center;

  .calimero-logo {
    width: 24px;
    height: 24px;
    color: var(--text-color);
  }

  &:hover:not(.connected) {
    background-color: var(--accent-hover-color);
    border-color: var(--accent-hover-color);
  }

  &.connected {
    background-color: var(--success-color);
    color: var(--background-color);
    border-color: var(--success-color);

    .calimero-logo {
      color: var(--background-color);
    }
  }
`;

const ConnectedContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-top: 0;
  padding: 0;
  z-index: 1001;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
`;

const DropdownItem = styled.a`
  display: block;
  width: 100%;
  padding: 10px 20px;
  background: none;
  border: none;
  color: var(--text-color);
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;

  &:hover,
  &:active {
    background-color: var(--success-color);
    color: var(--background-color);
  }
`;

const DropdownInfoItem = styled.div`
  padding: 10px 20px;
  color: var(--text-secondary-color);
  font-size: 14px;
  border-bottom: 1px solid var(--border-color);
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
`;

const CalimeroConnectButton: React.FC = () => {
  const { isAuthenticated, login, logout, appUrl } = useCalimero();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const dashboardUrl = useMemo(() => {
    if (!isAuthenticated || !appUrl) return '#';
    const baseUrl = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
    return `${baseUrl}admin-dashboard/`;
  }, [isAuthenticated, appUrl]);

  if (isAuthenticated) {
    return (
      <ConnectedContainer ref={dropdownRef}>
        <StyledButton
          className="connected"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <CalimeroLogo className="calimero-logo" />
          Connected
        </StyledButton>
        {isDropdownOpen && (
          <DropdownMenu>
            <DropdownInfoItem title={appUrl || ''}>{appUrl}</DropdownInfoItem>
            <DropdownItem
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Dashboard
            </DropdownItem>
            <DropdownItem as="button" onClick={logout}>
              Log out
            </DropdownItem>
          </DropdownMenu>
        )}
      </ConnectedContainer>
    );
  }

  return (
    <StyledButton onClick={login}>
      <CalimeroLogo className="calimero-logo" />
      Connect
    </StyledButton>
  );
};

export default CalimeroConnectButton;
