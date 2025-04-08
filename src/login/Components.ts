import styled from 'styled-components';

export const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
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

// Context Selection Modal Components
export const ContextModal = styled.div`
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem;
  border-radius: 0.375rem;
  align-items: center;
  background-color: #17191b;
`;

export const ContextTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 2rem;
  color: #fff;
  text-align: center;
`;

export const ContextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.25rem;
  color: #fff;
  width: 100%;
`;

export const ContextSubtitle = styled.div<{
  separator?: boolean;
  color?: string;
}>`
  color: ${(props) => props.color || '#6b7280'};
  font-weight: 500;
  font-size: 0.875rem;
  word-break: break-all;
  display: flex;
  gap: 0.5rem;
  ${({ separator }) =>
    separator &&
    `
    border-bottom: 1px solid #23262d;
  `}
`;

export const AppIdContainer = styled.div`
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ContextListContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
`;

export const NoContextWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const NoContextMessage = styled.div`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
`;
