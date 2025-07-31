import React from 'react';
import styled, { keyframes } from 'styled-components';

const slideInUp = keyframes`
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #ff4d4d;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2000;
  animation:
    ${slideInUp} 0.5s ease-out,
    ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

const ToastMessage = styled.div`
  margin-right: 15px;
`;

const ToastCloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
`;

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  return (
    <ToastContainer>
      <ToastMessage>{message}</ToastMessage>
      <ToastCloseButton onClick={onClose}>&times;</ToastCloseButton>
    </ToastContainer>
  );
};

export default Toast;
