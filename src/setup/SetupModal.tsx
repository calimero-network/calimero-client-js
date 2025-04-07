import React from 'react';
import { useCallback, useEffect, useState } from 'react';

import apiClient from '../api';
import Spinner from '../components/loader/Spinner';
import {
  getAppEndpointKey,
  getApplicationId,
  setAppEndpointKey,
  setApplicationId,
} from '../storage';
import {
  SetupErrorText,
  SetupFormContainer,
  SetupInputField,
  SetupInputGroup,
  SetupModalContainer,
  SetupModalContent,
  SetupModalOverlay,
  SetupSpinnerContainer,
  SetupSubmitButton,
  SetupTitle,
} from './Components';

/**
 * @interface SetupModalProps
 * @property {() => void} successRoute - The route to redirect to after the setup is successful.
 */
export interface SetupModalProps {
  successRoute: () => void;
}

/**
 * @component SetupModal
 * @description A modal for setting up the application.
 * @param {SetupModalProps} props - The props for the SetupModal component.
 * @returns {React.ReactNode} The SetupModal component.
 */
export const SetupModal: React.FC<SetupModalProps> = (
  props: SetupModalProps,
) => {
  const [error, setError] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(true);
  const MINIMUM_LOADING_TIME_MS = 1000;

  useEffect(() => {
    setUrl(getAppEndpointKey());
    setAppId(getApplicationId());
  }, [props]);

  function validateUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  function validateContext(value: string) {
    if (value.length < 32 || value.length > 44) {
      setApplicationError(
        'Application ID must be between 32 and 44 characters long.',
      );
      return;
    }
    const validChars =
      /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;

    if (!validChars.test(value)) {
      setApplicationError(
        'Application ID must contain only base58 characters.',
      );
      return;
    }
  }

  const handleChange = (urlValue: string) => {
    setError('');
    setUrl(urlValue);
  };

  const handleChangeContextId = (value: string) => {
    setApplicationError('');
    setAppId(value);
    validateContext(value);
  };

  const checkConnection = useCallback(async () => {
    if (!url) return;
    if (validateUrl(url.toString())) {
      setLoading(true);
      const timer = new Promise((resolve) =>
        setTimeout(resolve, MINIMUM_LOADING_TIME_MS),
      );

      const fetchData = apiClient.node().health({ url: url });
      Promise.all([timer, fetchData]).then(([, response]) => {
        if (response.data) {
          setError('');
          setAppEndpointKey(url);
          setApplicationId(appId || '');
          props.successRoute();
        } else {
          setError('Connection failed. Please check if node url is correct.');
        }
        setLoading(false);
      });
    } else {
      setError('Connection failed. Please check if node url is correct.');
    }
  }, [props, url, appId]);

  useEffect(() => {
    let status = !url || !appId || !!applicationError;
    setIsDisabled(status);
  }, [url, appId, applicationError]);

  return (
    <SetupModalOverlay>
      <SetupModalContainer>
        <SetupModalContent>
          <SetupFormContainer>
            <SetupTitle>App setup</SetupTitle>
            {loading ? (
              <SetupSpinnerContainer>
                <Spinner />
              </SetupSpinnerContainer>
            ) : (
              <SetupInputGroup>
                <SetupInputField
                  type="text"
                  placeholder="application id"
                  value={appId || ''}
                  onChange={(e) => handleChangeContextId(e.target.value)}
                  aria-invalid={!!applicationError}
                  aria-describedby="appIdError"
                />
                <SetupErrorText>{applicationError}</SetupErrorText>

                <SetupInputField
                  type="text"
                  placeholder="node url"
                  inputMode="url"
                  value={url || ''}
                  onChange={(e) => handleChange(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby="urlError"
                />
                <SetupErrorText>{error}</SetupErrorText>

                <SetupSubmitButton
                  disabled={isDisabled}
                  onClick={checkConnection}
                >
                  <span>Set values</span>
                </SetupSubmitButton>
              </SetupInputGroup>
            )}
          </SetupFormContainer>
        </SetupModalContent>
      </SetupModalContainer>
    </SetupModalOverlay>
  );
};
