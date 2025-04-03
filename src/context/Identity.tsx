import React, { useState } from 'react';

export const Identity: React.FC = () => {
  const [identities, setIdentities] = useState<string[]>([]);

  const handleCreateIdentity = () => {
    console.log('Creating new identity');
  };

  return (
    <div className="identity-tab">
      <h2>Identities</h2>
      <button onClick={handleCreateIdentity} className="button-rounded">
        Create New Identity
      </button>
      <div className="scrollable-list">
        {identities.map((identity, index) => (
          <div key={index} className="list-item">
            {identity}
          </div>
        ))}
      </div>
    </div>
  );
};
