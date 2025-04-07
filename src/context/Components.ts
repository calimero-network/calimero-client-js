import styled from 'styled-components';

export const ContextModalWrapper = styled.div`
  width: 600px;
  max-width: 100%;
  background: #1c1c1c;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

export const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
`;

export const TabButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;

  &.active {
    border-bottom: 2px solid #ff7a00;
  }
`;

export const TabContent = styled.div`
  padding: 1.25rem;
`;

export const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

export const FormInput = styled.input`
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 1rem;
  height: 46px;
`;

export const ProtocolSelection = styled.div`
  padding: 0.625rem 1rem;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  font-size: 1rem;
  height: 46px;
`;

export const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0;
  margin: 0;
`;

export const Button = styled.button`
  background: #ff7a00;
  color: white;
  border: none;
  padding: 0.625rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.3s;
  height: 46px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  &.button-rounded {
    border-radius: 0.375rem;
  }

  &.button-tab:hover {
    color: #e56e00;
  }

  &:disabled {
    background-color: #6b7280;
    cursor: not-allowed;
  }

  &.button-size-md {
    width: 150px;
  }

  &.button-static {
    width: !important 177px;
  }
`;

export const ScrollableList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border-radius: 4px;
  margin-top: 15px;
`;

export const ListItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #eee;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    border-bottom: none;
  }
`;

export const Heading2 = styled.h2`
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
`;

export const Heading3 = styled.h3`
  margin-top: 20px;
  margin-bottom: 10px;
`;

export const Paragraph = styled.p`
  margin-top: 0;
  color: #666;
  font-size: 14px;

  &.text-sm {
    font-size: 12px;
  }
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  width: 100%;
`;

export const BtnStatic = styled.div`
  width: 177px;
`;

export const CursorPointer = styled.div`
  cursor: pointer;
`;

export const ContextSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
  margin-top: 10px;
`;

export const DropdownSelector = styled.select`
  padding: 0.625rem 1rem;
`;

export const TextSm = styled.div`
  font-size: 12px;
`;

export const IdentityContainer = styled.div`
  position: relative;
`;

export const DeleteIcon = styled.div`
  position: absolute;
  right: -10px;
  top: -10px;
  cursor: pointer;
  font-size: 18px;

  &:hover {
    color: #ef4444;
  }
`;

export const SuccessMessage = styled.div`
  padding-right: 10px;
  white-space: pre-wrap;
  display: flex;
  flex-direction: column;
  overflow-wrap: break-word;
  padding-bottom: 10px;
`;

export const Payload = styled.div`
  font-size: 12px;
  color: #666;
`;
