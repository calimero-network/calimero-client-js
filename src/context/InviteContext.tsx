import React, { useState } from 'react';

export const InviteContext: React.FC = () => {
  const [contextId, setContextId] = useState<string>('');
  const [invitatorKey, setInvitatorKey] = useState<string>('');
  const [inviteeKey, setInviteeKey] = useState<string>('');

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Inviting with context:', {
      contextId,
      invitatorKey,
      inviteeKey,
    });
  };

  return (
    <div className="invite-tab">
      <h2>Invite to Context</h2>
      <p>Fill in the details to create an invitation</p>
      <form onSubmit={handleInviteSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={contextId}
            onChange={(e) => setContextId(e.target.value)}
            placeholder="Context ID"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={invitatorKey}
            onChange={(e) => setInvitatorKey(e.target.value)}
            placeholder="Invitator Public Key"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={inviteeKey}
            onChange={(e) => setInviteeKey(e.target.value)}
            placeholder="Invitee Public Key"
          />
        </div>
        <button type="submit" className="button-rounded">
          Create Invitation
        </button>
      </form>
    </div>
  );
};
