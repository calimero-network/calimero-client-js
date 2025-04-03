import React, { useState } from 'react';

export const JoinContext: React.FC = () => {
  const [joinPayload, setJoinPayload] = useState<string>('');
  const [joinError, setJoinError] = useState<string>('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinPayload.trim()) {
      setJoinError('Invitation payload is required');
      return;
    }
    console.log('Joining with payload:', joinPayload);
    setJoinError('');
  };

  return (
    <div className="join-tab">
      <h2>Join Existing Context</h2>
      <p>To join context you need to have invitation payload.</p>
      <form onSubmit={handleJoinSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={joinPayload}
            onChange={(e) => setJoinPayload(e.target.value)}
            placeholder="Paste invitation payload"
          />
          {joinError && <div className="error-message">{joinError}</div>}
        </div>
        <button type="submit" className="button-rounded">
          Join
        </button>
      </form>
    </div>
  );
};
