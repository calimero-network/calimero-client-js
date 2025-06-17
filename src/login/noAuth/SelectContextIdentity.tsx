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
  Button,
} from '../Components';

interface SelectContextIdentityProps {
  contextIdentities: string[];
  selectedContextId: string;
  onSelectIdentity: (contextId: string, identity: string) => void;
  backStep: () => void;
}

export const SelectContextIdentity: React.FC<SelectContextIdentityProps> = ({
  contextIdentities,
  selectedContextId,
  onSelectIdentity,
  backStep,
}) => {
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
        <ContextSubtitle separator={true} color="#fff">
          <span>Currently selected:</span>
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
                onRowItemClick={() =>
                  onSelectIdentity(selectedContextId, identity)
                }
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
        {backStep && <Button onClick={backStep}>Back to context selection</Button>}
      </ContextWrapper>
    </ContextModal>
  );
}
