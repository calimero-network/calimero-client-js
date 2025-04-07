import React, { useState } from 'react';
import { JoinContext } from './JoinContext';
import { InviteContext } from './InviteContext';
import { CreateContext } from './CreateContext';
import { Identity } from './Identity';
import { ContextModalWrapper, TabButton, TabContent, Tabs } from './Components';

const contextActions = [
  {
    label: 'Join Context',
    id: 'join',
  },
  {
    label: 'Invite to Context',
    id: 'invite',
  },
  {
    label: 'Create Context',
    id: 'create',
  },
  {
    label: 'Identity',
    id: 'identity',
  },
];

export const ContextModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('join');

  return (
    <ContextModalWrapper>
      <Tabs>
        {contextActions.map((item, i) => (
          <TabButton
            key={i}
            onClick={() => setActiveTab(item.id)}
            className={activeTab === item.id ? 'active' : ''}
          >
            {item.label}
          </TabButton>
        ))}
      </Tabs>
      <TabContent>
        {activeTab === 'join' && <JoinContext />}
        {activeTab === 'invite' && <InviteContext />}
        {activeTab === 'create' && <CreateContext />}
        {activeTab === 'identity' && <Identity />}
      </TabContent>
    </ContextModalWrapper>
  );
};
