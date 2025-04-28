import styled from 'styled-components';

export const SetupModalOverlay = styled.div`
  display: flex;
  justify-content: center;
  background-color: #111111;
`;

export const SetupModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const SetupModalContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #1c1c1c;
  padding: 1rem;
  border-radius: 0.5rem;
  color: white;
`;

export const SetupFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 0 2rem;
`;

export const SetupTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

export const SetupInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
`;

export const SetupInputField = styled.input`
  width: 400px;
  padding: 0.8rem;
  border-radius: 0.375rem;
  border: none;
  background-color: #333;
  color: white;
  font-size: 16px;

  &::placeholder {
    color: #888;
  }
`;

export const SetupErrorText = styled.span`
  color: #ef4444;
  font-size: 0.875rem;
  min-height: 1.2em;
`;

export const SetupSubmitButton = styled.button`
  color: white;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  height: 46px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: none;
  outline: none;
  padding: 0.5rem;
  cursor: pointer;
  background-color: #ff7a00;
  transition: background-color 0.2s ease;

  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }

  &:hover {
    background-color: #ff8c00;
  }
`;

export const SetupSpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;
