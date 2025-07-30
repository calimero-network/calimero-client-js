import React from 'react';
import ReactDOM from "react-dom/client";
import { CalimeroLogin } from "../../src";
import "../../src/components/calimero-connect/palette.css";

function App() {
  return (
    <CalimeroLogin
      clientApplicationId="4E2WejHpXRY1EMhvfiaCthZrAfzszv7HmEQ8Sugrr3XH"
      permissions={["context:execute","application"]}
      applicationPath="https://calimero-only-peers-dev.s3.amazonaws.com/uploads/a02e562d4e7916570ddf2244d43b284e.wasm"
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
