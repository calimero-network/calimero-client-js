import React, { useState } from 'react';
import { JoinContext } from './JoinContext';
import { InviteContext } from './InviteContext';
import { CreateContext } from './CreateContext';
import { Identity } from './Identity';

import '../../styles/context.css';

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
    <div className="context-modal">
      <div className="tabs">
        {contextActions.map((item, i) => (
          <button
            key={i}
            className={`${activeTab === item.id ? 'active' : ''} button-tab`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab === 'join' && <JoinContext />}
        {activeTab === 'invite' && <InviteContext />}
        {activeTab === 'create' && <CreateContext />}
        {activeTab === 'identity' && <Identity />}
      </div>
    </div>
  );
};
