import styled from 'styled-components';

export const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  max-width: 400px;
`;

export const LoginHeader = styled.div`
  margin-top: 1.5rem;
  display: grid;
  color: white;
  font-size: 1.25rem;
  font-weight: 500;
  text-align: center;
`;

export const LoginHeaderSpan = styled.span`
  margin-bottom: 0.5rem;
  color: #fff;
`;

export const LoginButton = styled.button`
  background-color: #ff7a00;
  color: white;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  height: 46px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: none;
  outline: none;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`;

export const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;
