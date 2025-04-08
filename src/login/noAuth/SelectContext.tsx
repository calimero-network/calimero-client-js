import React from 'react';
import { Context } from '../../api/nodeApi';
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
import ListItem from './ListItem';

interface SelectContextStepProps {
  applicationId: string;
  contextList: Context[];
  setSelectedContextId: (selectedContextId: string) => void;
  updateLoginStep: () => void;
}

export default function SelectContextStep({
  applicationId,
  contextList,
  setSelectedContextId,
  updateLoginStep,
}: SelectContextStepProps) {

  const handleContextSelection = (selectedContextId: string) => {
    setSelectedContextId(selectedContextId);
    updateLoginStep();
  };

  return (
    <ContextModal>
      <ContextTitle>Select context</ContextTitle>
      <ContextWrapper>
        <ContextSubtitle separator color="#fff">
          <span>Currently selected:</span>
        </ContextSubtitle>
        <ContextSubtitle>
          App ID
          <AppIdContainer>
            <span>{applicationId}</span>
          </AppIdContainer>
        </ContextSubtitle>
      </ContextWrapper>
      <ContextWrapper>
        <ContextSubtitle color="#fff">
          <span>Select a context to join:</span>
        </ContextSubtitle>
        {contextList.length > 0 ? (
          <ContextListContainer>
            {contextList.map((context, i) => (
              <ListItem
                key={context.id}
                item={context.id}
                id={i}
                count={contextList.length}
                onRowItemClick={handleContextSelection}
              />
            ))}
          </ContextListContainer>
        ) : (
          <NoContextWrapper>
            <NoContextMessage>No contexts found</NoContextMessage>
          </NoContextWrapper>
        )}
      </ContextWrapper>
    </ContextModal>
  );
}
