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

### Dependencies

The SDK has the following peer dependencies:
- `@near-wallet-selector/modal-ui`: ^8.9.7

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
  getRefreshToken 
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
  JsonRpcClient 
} from '@calimero-network/calimero-client';

// 1. Set your token
setAccessToken('your-jwt-token-here');

// 2. Get contextId and executorPublicKey from the token
const jwt = getJWTObject();
const contextId = jwt?.context_id;
const executorPublicKey = jwt?.executor_public_key;

// 3. Initialize the client
const rpcClient = new JsonRpcClient(
  'your-api-url',
  '/jsonrpc'
);

// 4. Make queries - Two options:

// Option 1: Let the SDK handle authorization (recommended)
const params = {
  contextId,
  method: 'your-method',
  argsJson: { /* your args */ },
  executorPublicKey
};
const response = await rpcClient.query(params);

// Option 2: Manually provide authorization header
const config = {
  headers: {
    authorization: `Bearer your-jwt-token-here`
  }
};
const response = await rpcClient.query(params, config);
```

**Important Notes:**
- The token must be valid and not expired
- Without a refresh token, the SDK won't be able to automatically refresh expired tokens
- Make sure your token has the necessary permissions for the operations you're trying to perform
- The `contextId` and `executorPublicKey` are required for queries and are extracted from your JWT token

## Usage Examples

### 1. RPC Client

The `JsonRpcClient` allows you to make RPC calls to your server:

```typescript
import { JsonRpcClient } from '@calimero-network/calimero-client';

// Initialize the client
const rpcClient = new JsonRpcClient(
  process.env['NEXT_PUBLIC_API_URL'],
  '/jsonrpc',
  5000 // optional timeout in ms
);

// Make a query
const queryParams = {
  applicationId: process.env['NEXT_PUBLIC_APPLICATION_ID'],
  method: 'get_posts',
  argsJson: { limit: 10 }
};
const queryResponse = await rpcClient.query(queryParams);

// Make a mutation
const mutateParams = {
  applicationId: process.env['NEXT_PUBLIC_APPLICATION_ID'],
  method: 'create_post',
  argsJson: { 
    title: 'My First Post', 
    text: 'This is my first post' 
  }
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
  '/ws'
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
