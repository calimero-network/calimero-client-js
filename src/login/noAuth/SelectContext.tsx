import React from 'react';
import { Context } from '../../api/nodeApi';
import {
  ContextModal,
  ContextWrapper,
  ContextSubtitle,
  ContextListContainer,
  NoContextWrapper,
  NoContextMessage,
  Button,
} from '../Components';
import ListItem from './ListItem';

interface SelectContextProps {
  contextList: Context[];
  setSelectedContextId: (selectedContextId: string) => void;
  backStep?: () => void;
}

export const SelectContext: React.FC<SelectContextProps> = ({
  contextList,
  setSelectedContextId,
  backStep,
}) => {
  const handleContextSelection = (selectedContextId: string) => {
    setSelectedContextId(selectedContextId);
  };

  return (
    <ContextModal>
      <ContextWrapper>
        <ContextSubtitle color="#fff">
          <span>Select a context:</span>
        </ContextSubtitle>
        {contextList.length > 0 ? (
          <>
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
            {backStep && <Button onClick={backStep}>Back</Button>}
          </>
        ) : (
          <NoContextWrapper>
            <NoContextMessage>No contexts found</NoContextMessage>
          </NoContextWrapper>
        )}
      </ContextWrapper>
    </ContextModal>
  );
};
