import React from 'react';
import { useCallback, useState } from 'react';

import apiClient from '../api';
import Spinner from '../components/loader/Spinner';

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
import { setApplicationId, setAppEndpointKey } from '../storage';

/**
 * @interface SetupModalProps
 * @property {() => void} redirectCallback - The function to call after the setup is successful.
 */
export interface SetupModalProps {
  redirectCallback: () => void;
}

interface SetupState {
  url: string;
  applicationId: string;
  errors: {
    url: string;
    applicationId: string;
  };
  isLoading: boolean;
}

const MINIMUM_LOADING_TIME_MS = 1000;

const initialState: SetupState = {
  url: '',
  applicationId: '',
  errors: {
    url: '',
    applicationId: '',
  },
  isLoading: false,
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateApplicationId = (value: string): string => {
  if (value.length < 32 || value.length > 44) {
    return 'Application ID must be between 32 and 44 characters long.';
  }

  const validChars =
    /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  if (!validChars.test(value)) {
    return 'Application ID must contain only base58 characters.';
  }

  return '';
};

/**
 * @component SetupModal
 * @description A modal for setting up the application.
 * @param {SetupModalProps} props - The props for the SetupModal component.
 * @returns {React.ReactNode} The SetupModal component.
 */
export const SetupModal: React.FC<SetupModalProps> = ({
  redirectCallback,
}) => {
  const [state, setState] = useState<SetupState>(initialState);
  const { url, applicationId, errors, isLoading } = state;

  const updateState = (newState: Partial<SetupState>) => {
    setState((prev) => ({ ...prev, ...newState }));
  };

  const updateError = (field: keyof SetupState['errors'], message: string) => {
    setState((prev) => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: message,
      },
    }));
  };

  const handleUrlChange = (value: string) => {
    updateState({
      url: value,
      errors: {
        ...state.errors,
        url: '',
      },
    });
  };

  const handleApplicationIdChange = (value: string) => {
    const error = validateApplicationId(value);
    updateState({
      applicationId: value,
      errors: {
        ...state.errors,
        applicationId: error,
      },
    });
  };

  const handleSubmit = useCallback(async () => {
    if (!url) return;

    if (!validateUrl(url)) {
      updateError(
        'url',
        'Connection failed. Please check if node url is correct.',
      );
      return;
    }

    updateState({ isLoading: true });

    try {
      const [, response] = await Promise.all([
        new Promise((resolve) => setTimeout(resolve, MINIMUM_LOADING_TIME_MS)),
        apiClient.node().health({ url }),
      ]);

      if (response.data) {
        setAppEndpointKey(url);
        setApplicationId(applicationId);
        redirectCallback();
      } else {
        updateError(
          'url',
          'Connection failed. Please check if node url is correct.',
        );
      }
    } catch (error) {
      updateError('url', 'Connection failed. Please try again.');
    } finally {
      updateState({ isLoading: false });
    }
  }, [url, applicationId, setAppEndpointKey]);

  const isSubmitDisabled =
    !url || !applicationId || Boolean(errors.url || errors.applicationId);

  return (
    <SetupModalOverlay>
      <SetupModalContainer>
        <SetupModalContent>
          <SetupFormContainer>
            <SetupTitle>App setup</SetupTitle>
            {isLoading ? (
              <SetupSpinnerContainer>
                <Spinner />
              </SetupSpinnerContainer>
            ) : (
              <SetupInputGroup>
                <SetupInputField
                  type="text"
                  placeholder="Application ID"
                  value={applicationId}
                  onChange={(e) => handleApplicationIdChange(e.target.value)}
                  aria-invalid={!!errors.applicationId}
                  aria-describedby="appIdError"
                />
                <SetupErrorText>{errors.applicationId}</SetupErrorText>

                <SetupInputField
                  type="text"
                  placeholder="Node URL"
                  inputMode="url"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  aria-invalid={!!errors.url}
                  aria-describedby="urlError"
                />
                <SetupErrorText>{errors.url}</SetupErrorText>

                <SetupSubmitButton
                  disabled={isSubmitDisabled}
                  onClick={handleSubmit}
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
