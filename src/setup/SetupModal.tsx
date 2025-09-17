import React, { useEffect } from 'react';
import { useCallback, useState } from 'react';

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
import { setAppEndpointKey } from '../storage';

/**
 * @interface SetupModalProps
 * @property {() => void} setNodeServerUrl - The function to set the app endpoint key.
 */
export interface SetupModalProps {
  setNodeServerUrl: (nodeServerUrl: string) => void;
}

interface SetupState {
  url: string;
  errors: {
    url: string;
    applicationId: string;
  };
  isLoading: boolean;
}

const initialState: SetupState = {
  url: '',
  errors: {
    url: '',
    applicationId: '',
  },
  isLoading: false,
};

const validateUrl = (url: string): boolean => {
  try {
    new URL(url).toString();
    return true;
  } catch {
    return false;
  }
};

/**
 * @component SetupModal
 * @description A modal for setting up the application.
 * @param {SetupModalProps} props - The props for the SetupModal component.
 * @returns {React.ReactNode} The SetupModal component.
 */
export const SetupModal: React.FC<SetupModalProps> = ({ setNodeServerUrl }) => {
  const [state, setState] = useState<SetupState>(initialState);
  const { url, errors, isLoading } = state;

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
    setAppEndpointKey(url);
    setNodeServerUrl(url);
  }, [url, setNodeServerUrl]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitDisabled) {
      handleSubmit();
    }
  };

  const isSubmitDisabled = !url || Boolean(errors.url);

  useEffect(() => {
    const fragment = window.location.hash.substring(1);
    const fragmentParams = new URLSearchParams(fragment);
    const nodeUrl = fragmentParams.get('node_url');

    if (nodeUrl) {
      handleUrlChange(decodeURIComponent(nodeUrl));

      fragmentParams.delete('node_url');
      const newFragment = fragmentParams.toString();
      const newUrl =
        window.location.pathname +
        window.location.search +
        (newFragment ? `#${newFragment}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    <SetupModalOverlay>
      <SetupModalContainer>
        <SetupModalContent>
          <SetupFormContainer>
            <SetupTitle>Connect to Calimero Node</SetupTitle>
            {isLoading ? (
              <SetupSpinnerContainer>
                <Spinner />
              </SetupSpinnerContainer>
            ) : (
              <form onSubmit={onFormSubmit}>
                <SetupInputGroup>
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

                  <SetupSubmitButton type="submit" disabled={isSubmitDisabled}>
                    <span>Continue</span>
                  </SetupSubmitButton>
                </SetupInputGroup>
              </form>
            )}
          </SetupFormContainer>
        </SetupModalContent>
      </SetupModalContainer>
    </SetupModalOverlay>
  );
};
