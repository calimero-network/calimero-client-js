# Calimero TypeScript Client SDK

[![SDK publish gh action](https://github.com/calimero-network/calimero-client-js/actions/workflows/calimero_sdk_publish.yml/badge.svg)](https://github.com/calimero-network/core/actions/workflows/calimero_sdk_publish.yml)
[![npm version](https://badge.fury.io/js/@calimero-network%2Fcalimero-client.svg)](https://badge.fury.io/js/@calimero-network%2Fcalimero-client)

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets-global.website-files.com/6256e0ccf395021e66e913b6/65cb5711287e06754d171147_calimero_logo_white.svg">
    <img alt="Calimero logo" style="" src="https://assets-global.website-files.com/6256e0ccf395021e66e913b6/65cb5711287e06754d171147_calimero_logo_white.svg" width="40%">
  </picture>
</div>

## Overview

The **Calimero TypeScript Client SDK** helps developers interact with decentralized apps by handling server communication. It simplifies the process, letting you focus on building your app while the SDK manages the technical details. Built with TypeScript, it ensures a smoother development experience with reliable tools.

The SDK has two main components:

- `RpcClient`: For sending queries and updates to the server
- `SubscriptionsClient`: For subscribing to real-time updates

## Installation

```bash
# Using npm
npm install @calimero-network/calimero-client

# Using yarn
yarn add @calimero-network/calimero-client

# Using pnpm
pnpm add @calimero-network/calimero-client
```

## ABI Conformance Client

The package includes a pre-built ABI conformance client for testing and development:

```typescript
import { AbiClient } from '@calimero-network/calimero-client/abi-conformance';

// Use the client with your CalimeroApp and Context
const client = new AbiClient(app, context);

// Test basic operations
const result = await client.optU32({ value: 42 });
const listResult = await client.listU32({ values: [1, 2, 3] });
const mapResult = await client.mapU32({ data: { test: 123 } });
```

### Dependencies

The SDK has the following peer dependencies:

- `@near-wallet-selector/modal-ui`: ^8.9.7

## Setting Up Node URL and Application ID

Before using the ClientLogin component or making any API calls, you must configure two essential values:

### Basic Configuration

```typescript
import {
  setAppEndpointKey,
  setApplicationId,
} from '@calimero-network/calimero-client';

// Set the Node URL (your Calimero endpoint)
setAppEndpointKey('https://your-calimero-node-url.com');

// Set the Application ID
setApplicationId('your-calimero-application-id');
```

### Where to Get These Values

- **Node URL**: The base URL of your Calimero node deployment. You can obtain this from your Calimero admin dashboard or deployment documentation.
- **Application ID**: The unique identifier for your application in the Calimero system. This is also available in your Calimero admin dashboard.

### Best Practices for Configuration

#### Using Environment Variables (Recommended)

For better security and configuration management, use environment variables:

1. Create a `.env` file in your project root:

```
# For Next.js
NEXT_PUBLIC_CALIMERO_NODE_URL=https://your-calimero-node-url.com
NEXT_PUBLIC_CALIMERO_APP_ID=your-calimero-application-id

# For Create React App
REACT_APP_CALIMERO_NODE_URL=https://your-calimero-node-url.com
REACT_APP_CALIMERO_APP_ID=your-calimero-application-id
```

2. Use these environment variables in your code:

```typescript
import {
  setAppEndpointKey,
  setApplicationId,
} from '@calimero-network/calimero-client';

// For Next.js
setAppEndpointKey(process.env.NEXT_PUBLIC_CALIMERO_NODE_URL);
setApplicationId(process.env.NEXT_PUBLIC_CALIMERO_APP_ID);

// For Create React App
setAppEndpointKey(process.env.REACT_APP_CALIMERO_NODE_URL);
setApplicationId(process.env.REACT_APP_CALIMERO_APP_ID);
```

#### When to Call These Functions

These values should be set early in your application's lifecycle, before rendering any Calimero components or making API calls:

```typescript
import React, { useEffect } from 'react';
import {
  ClientLogin,
  setAppEndpointKey,
  setApplicationId
} from '@calimero-network/calimero-client';

function App() {
  // Set configuration values on component mount
  useEffect(() => {
    setAppEndpointKey('https://your-calimero-node-url.com');
    setApplicationId('your-calimero-application-id');
  }, []);

  const handleLoginSuccess = () => {
    // Handle successful login
  };

  return (
    <div>
      <h1>Login</h1>
      <ClientLogin sucessRedirect={handleLoginSuccess} />
    </div>
  );
}
```

#### Verifying Configuration

You can check if these values are properly set using the getter functions:

```typescript
import {
  getAppEndpointKey,
  getApplicationId,
} from '@calimero-network/calimero-client';

function checkConfiguration() {
  const nodeUrl = getAppEndpointKey();
  const appId = getApplicationId();

  console.log('Node URL:', nodeUrl);
  console.log('Application ID:', appId);

  return nodeUrl && appId;
}
```

## Authorization

The SDK uses JWT (JSON Web Token) for authentication. Here's how the authorization flow works:

1. **Initial Login**: Use the `ClientLogin` component to handle user authentication:

```typescript
import { ClientLogin } from '@calimero-network/calimero-client';

const App = () => {
  const handleLoginSuccess = () => {
    // Handle successful login
  };

  return <ClientLogin sucessRedirect={handleLoginSuccess} />;
};
```

2. **Token Management**: The SDK automatically handles:

   - Token storage in localStorage
   - Token refresh when expired
   - Authorization headers for API requests

3. **Manual Token Handling**: You can also manage tokens manually:

```typescript
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
} from '@calimero-network/calimero-client';

// Set tokens
setAccessToken(accessToken);
setRefreshToken(refreshToken);

// Get tokens
const currentAccessToken = getAccessToken();
const currentRefreshToken = getRefreshToken();
```

### Manual Token Usage

If you already have a JWT token (for example, obtained from another source), you can bypass the login flow and use it directly:

```typescript
import {
  setAccessToken,
  getJWTObject,
  JsonRpcClient,
} from '@calimero-network/calimero-client';

// 1. Set your token
setAccessToken('your-jwt-token-here');

// 2. Get contextId and executorPublicKey from the token
const jwt = getJWTObject();
const contextId = jwt?.context_id;
const executorPublicKey = jwt?.executor_public_key;

// 3. Initialize the client
const rpcClient = new JsonRpcClient('your-api-url', '/jsonrpc');

// 4. Make queries - Two options:

// Option 1: Let the SDK handle authorization (recommended)
const params = {
  contextId,
  method: 'your-method',
  argsJson: {
    /* your args */
  },
  executorPublicKey,
};
const response = await rpcClient.query(params);

// Option 2: Manually provide authorization header
const config = {
  headers: {
    authorization: `Bearer your-jwt-token-here`,
  },
};
const response = await rpcClient.query(params, config);
```

**Important Notes:**

- The token must be valid and not expired
- Without a refresh token, the SDK won't be able to automatically refresh expired tokens
- Make sure your token has the necessary permissions for the operations you're trying to perform
- The `contextId` and `executorPublicKey` are required for queries and are extracted from your JWT token

## Using SetupModal for Authorization

The Calimero SDK includes a `SetupModal` component that streamlines the authorization process by allowing users to configure the required node URL and application ID. This component is demonstrated in the [demo-blockchain-integrations](https://github.com/calimero-network/demo-blockchain-integrations) repository, where it's used as the **first step** in the authentication flow.

### Basic Integration

To use the `SetupModal` in your application:

```typescript
import { SetupModal } from '@calimero-network/calimero-client';

function App() {
  const handleSetupComplete = () => {
    // Handle successful setup completion
    // Navigate to your app's authenticated section or perform other actions
    window.location.href = '/dashboard';
  };

  return (
    <div>
      <SetupModal successRoute={handleSetupComplete} />
    </div>
  );
}
```

### Setup Process with SetupModal

The `SetupModal` component provides a user interface for:

1. **Entering Application ID**: Input field for the Calimero application ID
2. **Entering Node URL**: Input field for the Calimero node URL
3. **Validation**: Automatic validation of both fields
4. **Connection Check**: Testing the connection to ensure the provided details are correct
5. **Configuration Storage**: Storing the valid configuration in local storage

### Complete Authorization Flow: SetupModal, ClientLogin, and AccessTokenWrapper

For a complete authorization flow, combine `SetupModal` for configuration, `ClientLogin` for authentication, and `AccessTokenWrapper` for automatic token management. This follows the pattern used in the [demo application](https://github.com/calimero-network/demo-blockchain-integrations/blob/master/app/src/App.tsx):

```typescript
import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import {
  AccessTokenWrapper,
  SetupModal,
  ClientLogin
} from '@calimero-network/calimero-client';
import HomePage from './pages/Home';

// Utility to get the node URL for the AccessTokenWrapper
const getNodeUrl = () => {
  return localStorage.getItem('node_url') || '';
};

export default function App() {
  return (
    <AccessTokenWrapper getNodeUrl={getNodeUrl}>
      <BrowserRouter>
        <Routes>
          {/* Step 1: Setup - Configure node URL and application ID */}
          <Route path="/" element={<SetupPage />} />

          {/* Step 2: Authentication - Handle user login */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Step 3: Home - Show authenticated content */}
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AccessTokenWrapper>
  );
}

// Setup page component - first step in the flow
function SetupPage() {
  const navigate = useNavigate();

  const handleSetupComplete = () => {
    navigate('/auth');
  };

  return <SetupModal successRoute={handleSetupComplete} />;
}

// Auth page component - second step in the flow
function AuthPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate('/home');
  };

  return <ClientLogin sucessRedirect={handleLoginSuccess} />;
}
```

#### Understanding the AccessTokenWrapper

The `AccessTokenWrapper` component simplifies token management by:

1. **Automatic Token Refresh**: Handling JWT token refresh when tokens expire
2. **Authorization Headers**: Adding authorization headers to API requests
3. **Consistent Authorization State**: Maintaining authentication state across the application

This wrapper should be placed at a high level in your component tree to ensure all child components have access to the authentication context.

## Working with Multiple Blockchain Protocols

The Calimero SDK supports multiple blockchain protocols including NEAR, Ethereum, Starknet, Stellar, and ICP. To work with these different protocols, you'll need to understand contexts and how the authentication flow works.

### Understanding Contexts and Protocols

A "context" in Calimero represents an environment configured for a specific blockchain protocol. Here's how to create and work with contexts:

#### 1. Creating a Context for a Specific Protocol

```typescript
import { apiClient } from '@calimero-network/calimero-client';

// Create a new context for the NEAR protocol
async function createNearContext() {
  const applicationId = getApplicationId();
  const protocol = 'near'; // Options: 'near', 'ethereum', 'starknet', 'stellar', 'icp'

  const response = await apiClient
    .node()
    .createContext(applicationId, protocol);

  if (response.error) {
    console.error('Failed to create context:', response.error.message);
    return null;
  }

  return response.data;
}

// Example usage
const context = await createNearContext();
console.log('Created context:', context.contextId);
```

#### 2. Listing Available Contexts

```typescript
import { apiClient, getApplicationId } from '@calimero-network/calimero-client';

async function listContexts() {
  const applicationId = getApplicationId();
  const response = await apiClient.node().getContexts();

  if (response.error) {
    console.error('Failed to fetch contexts:', response.error.message);
    return [];
  }

  // Filter contexts for your application
  return response.data.contexts.filter(
    (context) => context.applicationId === applicationId,
  );
}

// Example usage
const contexts = await listContexts();
contexts.forEach((context) => {
  console.log(`Context ID: ${context.id}, Protocol: ${context.protocol}`);
});
```

#### 3. Deleting a Context

```typescript
import { apiClient } from '@calimero-network/calimero-client';

async function deleteContext(contextId) {
  const response = await apiClient.node().deleteContext(contextId);

  if (response.error) {
    console.error('Failed to delete context:', response.error.message);
    return false;
  }

  return true;
}
```

### Complete Authentication Flow with Admin Dashboard

The `ClientLogin` component handles authentication through the Calimero Admin Dashboard. Here's the complete flow explained:

1. **Initialization**: When you render the `ClientLogin` component, it prepares the login flow:

```typescript
import { ClientLogin } from '@calimero-network/calimero-client';

function LoginPage() {
  const handleLoginSuccess = () => {
    // Navigate to your app's authenticated section
    window.location.href = '/dashboard';
  };

  return <ClientLogin sucessRedirect={handleLoginSuccess} />;
}
```

2. **Redirect to Admin Dashboard**: When the user clicks the login button, they are redirected to the Calimero Admin Dashboard:

```typescript
// What happens inside ClientLogin when the button is clicked:
const redirectToDashboardLogin = () => {
  const nodeUrl = getAppEndpointKey();
  const applicationId = getApplicationId();

  // URL parameters for the Admin Dashboard
  const callbackUrl = encodeURIComponent(window.location.href);
  const redirectUrl = `${nodeUrl}/admin-dashboard/?application_id=${applicationId}&callback_url=${callbackUrl}`;

  // Redirect the user
  window.location.href = redirectUrl;
};
```

3. **Admin Dashboard Authentication**: In the Admin Dashboard, the user:

   - Selects the blockchain protocol they want to use
   - Authenticates with their credentials for that protocol
   - Grants necessary permissions

4. **Return to Your Application**: After successful authentication, the Admin Dashboard redirects back to your application with tokens:

   - The URL includes `access_token` and `refresh_token` parameters
   - The `ClientLogin` component automatically extracts these tokens
   - Tokens are stored in localStorage using `setAccessToken` and `setRefreshToken`
   - Your `sucessRedirect` callback is called to complete the process

5. **Automatic Token Handling**: After authentication, the SDK:
   - Automatically includes tokens in API requests
   - Refreshes tokens when they expire
   - Provides access to the context ID and executor public key for operations

### Example: Complete Multi-Protocol Implementation

Here's a complete example showing how to integrate multiple protocols:

```typescript
import React, { useState, useEffect } from 'react';
import {
  ClientLogin,
  apiClient,
  getApplicationId,
  getAccessToken,
  setAppEndpointKey,
  setApplicationId
} from '@calimero-network/calimero-client';

function MultiProtocolApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contexts, setContexts] = useState([]);
  const [selectedProtocol, setSelectedProtocol] = useState('near');
  const [loading, setLoading] = useState(false);

  // Set up required configuration
  useEffect(() => {
    setAppEndpointKey('https://your-calimero-node-url.com');
    setApplicationId('your-application-id');

    // Check if already authenticated
    if (getAccessToken()) {
      setIsAuthenticated(true);
      fetchContexts();
    }
  }, []);

  // Fetch available contexts
  const fetchContexts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.node().getContexts();
      if (!response.error && response.data) {
        const applicationId = getApplicationId();
        const filteredContexts = response.data.contexts.filter(
          context => context.applicationId === applicationId
        );
        setContexts(filteredContexts);
      }
    } catch (error) {
      console.error('Failed to fetch contexts:', error);
    }
    setLoading(false);
  };

  // Create a new context with selected protocol
  const createContext = async () => {
    setLoading(true);
    try {
      const applicationId = getApplicationId();
      const response = await apiClient.node().createContext(
        applicationId,
        selectedProtocol
      );

      if (!response.error && response.data) {
        // Refresh the contexts list
        fetchContexts();
      }
    } catch (error) {
      console.error('Failed to create context:', error);
    }
    setLoading(false);
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchContexts();
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <h1>Login to Your Application</h1>
        <ClientLogin sucessRedirect={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1>Your Multi-Protocol Application</h1>

      <div className="context-creator">
        <h2>Create New Context</h2>
        <select
          value={selectedProtocol}
          onChange={(e) => setSelectedProtocol(e.target.value)}
        >
          <option value="near">NEAR</option>
          <option value="ethereum">Ethereum</option>
          <option value="starknet">Starknet</option>
          <option value="stellar">Stellar</option>
          <option value="icp">ICP</option>
        </select>
        <button
          onClick={createContext}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Context'}
        </button>
      </div>

      <div className="contexts-list">
        <h2>Your Contexts</h2>
        {contexts.length === 0 ? (
          <p>No contexts found. Create one to get started.</p>
        ) : (
          <ul>
            {contexts.map(context => (
              <li key={context.id}>
                <strong>ID:</strong> {context.id}<br />
                <strong>Protocol:</strong> {context.protocol}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default MultiProtocolApp;
```

## Usage Examples

### 1. RPC Client

The `JsonRpcClient` allows you to make RPC calls to your server:

```typescript
import { JsonRpcClient } from '@calimero-network/calimero-client';

// Initialize the client
const rpcClient = new JsonRpcClient(
  process.env['NEXT_PUBLIC_API_URL'],
  '/jsonrpc',
  5000, // optional timeout in ms
);

// Make a query
const queryParams = {
  applicationId: process.env['NEXT_PUBLIC_APPLICATION_ID'],
  method: 'get_posts',
  argsJson: { limit: 10 },
};
const queryResponse = await rpcClient.query(queryParams);

// Make a mutation
const mutateParams = {
  applicationId: process.env['NEXT_PUBLIC_APPLICATION_ID'],
  method: 'create_post',
  argsJson: {
    title: 'My First Post',
    text: 'This is my first post',
  },
};
const mutateResponse = await rpcClient.mutate(mutateParams);
```

### 2. WebSocket Subscriptions

The `WsSubscriptionsClient` enables real-time updates through WebSocket connections:

```typescript
import { WsSubscriptionsClient } from '@calimero-network/calimero-client';

// Initialize the client
const subscriptionsClient = new WsSubscriptionsClient(
  process.env['NEXT_PUBLIC_API_URL'],
  '/ws',
);

// Connect and subscribe
await subscriptionsClient.connect();

// Subscribe to specific contexts
subscriptionsClient.subscribe([process.env['NEXT_PUBLIC_APPLICATION_ID']]);

// Handle incoming events
subscriptionsClient.addCallback((event) => {
  console.log('Received event:', event);
});

// Clean up
subscriptionsClient.removeCallback(callbackFunction);
subscriptionsClient.disconnect();
```

### 3. Multiple Connections

You can manage multiple WebSocket connections using connection IDs:

```typescript
const client = new WsSubscriptionsClient(baseUrl, '/ws');

// Create separate connections
await client.connect('connection1');
await client.connect('connection2');

// Subscribe to different contexts on each connection
client.subscribe(['context1'], 'connection1');
client.subscribe(['context2'], 'connection2');

// Add callbacks for each connection
client.addCallback(handleConnection1Events, 'connection1');
client.addCallback(handleConnection2Events, 'connection2');

// Cleanup specific connections
client.disconnect('connection1');
client.disconnect('connection2');
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const response = await rpcClient.query(params);
  if (response.error) {
    // Handle RPC error
    console.error('RPC Error:', response.error.message);
  } else {
    // Process successful response
    console.log('Result:', response.result);
  }
} catch (error) {
  // Handle network or other errors
  console.error('Request failed:', error);
}
```

## Best Practices

1. **Token Management**

   - Use the `AccessTokenWrapper` component to automatically handle token refresh
   - Store sensitive information in environment variables
   - Never expose tokens in client-side code

2. **Connection Management**

   - Always clean up WebSocket connections when they're no longer needed
   - Use unique connection IDs for multiple WebSocket connections
   - Implement reconnection logic for production applications

3. **Error Handling**
   - Always check for errors in RPC responses
   - Implement proper error boundaries in React applications
   - Log errors appropriately for debugging

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
