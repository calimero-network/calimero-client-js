import React from 'react';
import ListItem from './ListItem';
import {
  ContextModal,
  ContextTitle,
  ContextWrapper,
  ContextSubtitle,
  AppIdContainer,
  ContextListContainer,
  NoContextWrapper,
  NoContextMessage,
} from '../Components';

interface SelectIdentityStepProps {
  applicationId: string;
  contextIdentities: string[];
  selectedContextId: string;
  updateLoginStep: (contextId: string, identity: string) => void;
  backStep: () => void;
}

export default function SelectIdentityStep({
  applicationId,
  contextIdentities,
  selectedContextId,
  updateLoginStep,
  backStep,
}: SelectIdentityStepProps) {
  const truncateText = (text: string): string => {
    return `${text.substring(0, 4)}...${text.substring(
      text.length - 4,
      text.length,
    )}`;
  };

  return (
    <ContextModal>
      <ContextTitle>Select Context Identity</ContextTitle>
      <ContextWrapper>
        <ContextSubtitle separator color="#fff">
          <span>Currently selected:</span>
        </ContextSubtitle>
        <ContextSubtitle>
          <span>Application ID</span>
          <AppIdContainer>
            <span>{truncateText(applicationId)}</span>
          </AppIdContainer>
        </ContextSubtitle>
        <ContextSubtitle>
          <span>Context ID</span>
          <AppIdContainer>
            <span>{truncateText(selectedContextId)}</span>
          </AppIdContainer>
        </ContextSubtitle>
      </ContextWrapper>
      <ContextWrapper>
        <ContextSubtitle color="#fff">
          <span>Select an identity to login:</span>
        </ContextSubtitle>
        {contextIdentities.length > 0 ? (
          <ContextListContainer>
            {contextIdentities.map((identity, i) => (
              <ListItem
                key={i}
                item={identity}
                id={i}
                count={contextIdentities.length}
                onRowItemClick={() => updateLoginStep(selectedContextId, identity)}
              />
            ))}
          </ContextListContainer>
        ) : (
          <NoContextWrapper>
            <NoContextMessage>No identities found</NoContextMessage>
          </NoContextWrapper>
        )}
      </ContextWrapper>
      <ContextWrapper>
        <div onClick={backStep} style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.875rem', margin: '0 auto' }}>
          Back to context selection
        </div>
      </ContextWrapper>
    </ContextModal>
  );
}
