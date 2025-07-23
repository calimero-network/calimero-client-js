import React from 'react';
import ReactDOM from 'react-dom/client';
import { CalimeroConnect } from '../../src';
import '../../src/styles/palette.css';

function App() {
  const handleConnect = (url: string) => {
    console.log('Successfully connected to:', url);
  };

  return <CalimeroConnect onConnect={handleConnect} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
