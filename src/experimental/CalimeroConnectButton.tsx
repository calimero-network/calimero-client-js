import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCalimero } from './CalimeroProvider';
import CalimeroLogo from './CalimeroLogo';
import './CalimeroConnectButton.css';

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
      <div className="connected-container" ref={dropdownRef}>
        <button
          className="calimero-connect-button connected"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <CalimeroLogo className="calimero-logo" />
          Connected
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-info-item" title={appUrl || ''}>
              {appUrl}
            </div>
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
      <CalimeroLogo className="calimero-logo" />
      Connect
    </button>
  );
};

export default CalimeroConnectButton;
