import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCalimero } from './CalimeroProvider';
import calimeroLogo from '../assets/calimero-logo.png';
import './CalimeroConnectButton.css';
import { getAppEndpointKey } from '../storage/storage';

const CalimeroConnectButton: React.FC = () => {
  const { isAuthenticated, login, logout } = useCalimero();
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
    if (!isAuthenticated) return '#';
    const appUrl = getAppEndpointKey();
    if (appUrl === 'http://localhost') {
      return 'http://localhost:5174/admin-dashboard/';
    }
    if (appUrl) {
      return appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
    }
    return '#';
  }, [isAuthenticated]);

  if (isAuthenticated) {
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
            <button onClick={logout} className="dropdown-item">
              Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={login} className="calimero-connect-button">
      <img src={calimeroLogo} alt="Calimero Logo" className="calimero-logo" />
      Connect
    </button>
  );
};

export default CalimeroConnectButton;
