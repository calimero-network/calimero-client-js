import React, { useEffect, useState } from 'react';
import {
  getAppEndpointKey,
  getApplicationId,
  setAccessToken,
  setRefreshToken,
} from '../storage/storage';
import styles from './login.styles';

import '../../styles/login.css';

interface ClientLoginProps {
  sucessRedirect: () => void;
}

export const ClientLogin: React.FC<ClientLoginProps> = ({ sucessRedirect }) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const redirectToDashboardLogin = () => {
    const nodeUrl = getAppEndpointKey();
    const applicationId = getApplicationId();
    if (!nodeUrl) {
      setErrorMessage('Node URL is not set');
      return;
    }
    if (!applicationId) {
      setErrorMessage('Application ID is not set');
      return;
    }

    const callbackUrl = encodeURIComponent(window.location.href);
    const redirectUrl = `${nodeUrl}/admin-dashboard/?application_id=${applicationId}&callback_url=${callbackUrl}`;

    window.location.href = redirectUrl;
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedAccessToken = urlParams.get('access_token');
    const encodedRefreshToken = urlParams.get('refresh_token');
    if (encodedAccessToken && encodedRefreshToken) {
      const accessToken = decodeURIComponent(encodedAccessToken);
      const refreshToken = decodeURIComponent(encodedRefreshToken);
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      sucessRedirect();
    }
  }, []);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginHeader}>
        <span className={styles.loginHeaderSpan}>
          Login with Admin Dashboard
        </span>
      </div>
      <button className={styles.loginButton} onClick={redirectToDashboardLogin}>
        Login
      </button>
      <div className={styles.errorMessage}>{errorMessage}</div>
    </div>
  );
};
