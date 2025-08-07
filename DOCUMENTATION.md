# Calimero JavaScript SDK Documentation

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Authentication Modes](#authentication-modes)
4. [API Methods](#api-methods)
5. [Storage Methods](#storage-methods)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Examples](#examples)

## Overview

The **Calimero JavaScript SDK** (`@calimero-network/calimero-client`) is a comprehensive TypeScript library designed to simplify interactions with Calimero P2P nodes. It provides a robust HTTP client with automatic token management and a complete set of API clients for various Calimero services.

### Key Features

- **Automatic Token Management**: Handles JWT token refresh automatically
- **Two Authentication Modes**: Supports both auth and non-auth modes
- **Type-Safe API Clients**: Full TypeScript support for all API endpoints
- **Storage Management**: Secure localStorage handling for tokens and configuration
- **Error Handling**: Comprehensive error handling with specific error types

## Installation

**Important**: Install the SDK via npm, not locally.

```bash
# Using npm
npm install @calimero-network/calimero-client

# Using yarn
yarn add @calimero-network/calimero-client

# Using pnpm
pnpm add @calimero-network/calimero-client
```

### Peer Dependencies

The SDK requires the following peer dependencies:

```json
{
  "@near-wallet-selector/modal-ui": "^8.9.7",
  "react": "^18.3.0",
  "react-dom": "^18.3.1",
  "styled-components": "^6.1.13"
}
```

## Authentication Modes

The SDK supports two authentication modes:

### 1. Auth Mode

Traditional OAuth flow with login/logout functionality. Users authenticate through the Calimero authentication system.

### 2. Non-Auth Mode

Direct context and identity selection without OAuth. Users can directly select contexts and identities without going through the authentication flow.

## API Methods

The SDK provides pre-built API methods that handle HTTP communication automatically. The underlying HTTP client includes automatic JWT token inclusion and refresh mechanisms, but you should use the provided API methods rather than calling the HTTP client directly.

### Available API Clients

The SDK exports the following API clients:

```typescript
import {
  apiClient,
  authClient,
  contractClient,
  adminClient,
  blobClient,
  rpcClient,
} from '@calimero-network/calimero-client';
```

### Node API Methods

```typescript
// Get health status
const healthResponse = await apiClient
  .node()
  .health({ url: 'https://your-node.com' });

// Get all contexts
const contextsResponse = await apiClient.node().getContexts();

// Get specific context
const contextResponse = await apiClient.node().getContext('context-id');

// Create new context
const createResponse = await apiClient
  .node()
  .createContext('application-id', 'json-params', 'protocol');

// Delete context
const deleteResponse = await apiClient.node().deleteContext('context-id');

// Fetch context identities
const identitiesResponse = await apiClient
  .node()
  .fetchContextIdentities('context-id');

// Create new identity
const identityResponse = await apiClient.node().createNewIdentity();

// Invite to context
const inviteResponse = await apiClient
  .node()
  .contextInvite('context-id', 'inviter-public-key', 'invitee-public-key');

// Join context
const joinResponse = await apiClient
  .node()
  .joinContext('private-key', 'invitation-payload');

// Get installed applications
const appsResponse = await apiClient.node().getInstalledApplications();

// Get application details
const appDetailsResponse = await apiClient
  .node()
  .getInstalledApplicationDetails('app-id');

// Install application
const installResponse = await apiClient.node().installApplication(
  'app-url',
  metadata, // Uint8Array
  'hash',
);

// Uninstall application
const uninstallResponse = await apiClient.node().uninstallApplication('app-id');

// Get context client keys
const clientKeysResponse = await apiClient
  .node()
  .getContextClientKeys('context-id');

// Get context users
const usersResponse = await apiClient.node().getContextUsers('context-id');

// Get context storage usage
const storageResponse = await apiClient
  .node()
  .getContextStorageUsage('context-id');

// Grant capabilities
const grantResponse = await apiClient.node().grantCapabilities('context-id', {
  capabilities: [['identity', 'capability']],
  signer_id: 'signer-id',
});

// Revoke capabilities
const revokeResponse = await apiClient.node().revokeCapabilities('context-id', {
  capabilities: [['identity', 'capability']],
  signer_id: 'signer-id',
});
```

### Auth API Methods

```typescript
// Login (initiates OAuth flow)
const loginResponse = await authClient.login({
  url: 'https://your-calimero-node.com',
  callbackUrl: window.location.href,
  permissions: ['read', 'write'],
  applicationId: 'your-app-id',
  applicationPath: 'https://your-app-path.com',
});

// Refresh token
const refreshResponse = await authClient.refreshToken({
  access_token: 'current-access-token',
  refresh_token: 'current-refresh-token',
});

// Get available providers
const providersResponse = await authClient.getProviders();

// Request token
const tokenResponse = await authClient.requestToken({
  auth_method: 'method',
  public_key: 'public-key',
  client_name: 'client-name',
  timestamp: Date.now(),
  permissions: ['read', 'write'],
  provider_data: {},
});

// Get challenge
const challengeResponse = await authClient.getChallenge();

// Generate client key
const clientKeyResponse = await authClient.generateClientKey({
  context_id: 'context-id',
  context_identity: 'context-identity',
  permissions: ['read', 'write'],
});
```

### Contract API Methods

```typescript
// Get proposals
const proposalsResponse = await contractClient.getProposals({
  offset: 0,
  limit: 10,
});

// Get proposal approvers
const approversResponse =
  await contractClient.getProposalApprovers('proposal-id');

// Get proposal approval count
const approvalCountResponse =
  await contractClient.getProposalApprovalCount('proposal-id');

// Get number of proposals
const proposalCountResponse = await contractClient.getNumOfProposals();

// Get context value
const contextValueResponse = await contractClient.getContextValue('key');

// Get context storage entries
const storageEntriesResponse = await contractClient.getContextStorageEntries(
  0,
  10,
);
```

### Admin API Methods

```typescript
// Get root keys
const rootKeysResponse = await adminClient.getRootKeys();

// Get client keys
const clientKeysResponse = await adminClient.getClientKeys();

// Add root key
const addKeyResponse = await adminClient.addRootKey({
  public_key: 'public-key',
  auth_method: 'method',
  provider_data: {},
});

// Revoke root key
const revokeKeyResponse = await adminClient.revokeRootKey('key-id');

// Revoke client key
const revokeClientResponse = await adminClient.revokeClientKey(
  'root-key-id',
  'client-id',
);

// Set key permissions
const permissionsResponse = await adminClient.setKeyPermissions('key-id', {
  add: ['permission1'],
  remove: ['permission2'],
});
```

### Blob API Methods

```typescript
// Upload blob with progress tracking
const uploadResponse = await blobClient.uploadBlob(
  file, // File object
  (progress) => console.log(`Upload: ${progress}%`), // Progress callback
  'expected-hash', // Optional
);

// Download blob
const blob = await blobClient.downloadBlob('blob-id');

// Get blob metadata
const metadataResponse = await blobClient.getBlobMetadata('blob-id');

// List blobs
const listResponse = await blobClient.listBlobs();

// Delete blob
const deleteResponse = await blobClient.deleteBlob('blob-id');
```

### RPC Client Methods

```typescript
// Make JSON-RPC calls
const rpcResponse = await rpcClient.call('method-name', params);
```

## Storage Methods

The SDK provides comprehensive storage management for authentication tokens and configuration. All methods handle localStorage operations safely.

### Configuration Storage

```typescript
import {
  setAppEndpointKey,
  getAppEndpointKey,
  clearAppEndpoint,
  setApplicationId,
  getApplicationId,
  clearApplicationId,
} from '@calimero-network/calimero-client';

// Set and get Node URL
setAppEndpointKey('https://your-calimero-node.com');
const nodeUrl = getAppEndpointKey();
clearAppEndpoint();

// Set and get Application ID
setApplicationId('your-application-id');
const appId = getApplicationId();
clearApplicationId();
```

### Token Storage

```typescript
import {
  setAccessToken,
  getAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearAccessToken,
  clearRefreshToken,
  clientLogout,
} from '@calimero-network/calimero-client';

// Store tokens
setAccessToken('access-token');
setRefreshToken('refresh-token');

// Retrieve tokens
const accessToken = getAccessToken();
const refreshToken = getRefreshToken();

// Clear tokens
clearAccessToken();
clearRefreshToken();
clientLogout(); // Clears all auth data and reloads page
```

### Context Storage

```typescript
import {
  setContextId,
  getContextId,
  clearContextId,
  setExecutorPublicKey,
  getExecutorPublicKey,
  clearExecutorPublicKey,
} from '@calimero-network/calimero-client';

// Store context information
setContextId('context-id');
setExecutorPublicKey('executor-public-key');

// Retrieve context information
const contextId = getContextId();
const executorKey = getExecutorPublicKey();

// Clear context information
clearContextId();
clearExecutorPublicKey();
```

### JWT Token Utilities

```typescript
import {
  getJWTObject,
  setContextAndIdentityFromJWT,
  getAuthConfig,
} from '@calimero-network/calimero-client';

// Extract JWT payload
const jwtPayload = getJWTObject();

// Set context from JWT token
setContextAndIdentityFromJWT('jwt-token');

// Get complete auth configuration
const authConfig = getAuthConfig();
```

### Storage Method Descriptions

| Method                                | Description                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| `setAppEndpointKey(url)`              | Sets the Calimero node URL in localStorage                    |
| `getAppEndpointKey()`                 | Retrieves the Calimero node URL from localStorage             |
| `clearAppEndpoint()`                  | Removes the Calimero node URL from localStorage               |
| `setApplicationId(id)`                | Sets the application ID in localStorage                       |
| `getApplicationId()`                  | Retrieves the application ID from localStorage                |
| `clearApplicationId()`                | Removes the application ID from localStorage                  |
| `setAccessToken(token)`               | Stores the JWT access token in localStorage                   |
| `getAccessToken()`                    | Retrieves the JWT access token from localStorage              |
| `setRefreshToken(token)`              | Stores the JWT refresh token in localStorage                  |
| `getRefreshToken()`                   | Retrieves the JWT refresh token from localStorage             |
| `clearAccessToken()`                  | Removes both access and refresh tokens from localStorage      |
| `clearRefreshToken()`                 | Removes only the refresh token from localStorage              |
| `setContextId(id)`                    | Stores the context ID in localStorage                         |
| `getContextId()`                      | Retrieves the context ID from localStorage                    |
| `clearContextId()`                    | Removes the context ID from localStorage                      |
| `setExecutorPublicKey(key)`           | Stores the executor public key in localStorage                |
| `getExecutorPublicKey()`              | Retrieves the executor public key from localStorage           |
| `clearExecutorPublicKey()`            | Removes the executor public key from localStorage             |
| `getJWTObject()`                      | Extracts and parses the JWT payload from the access token     |
| `setContextAndIdentityFromJWT(token)` | Extracts context ID and identity from JWT and stores them     |
| `getAuthConfig()`                     | Returns complete authentication configuration with validation |
| `clientLogout()`                      | Clears all authentication data and reloads the page           |

## Error Handling

The SDK provides comprehensive error handling with specific error types and automatic retry mechanisms.

### Response Format

All API responses follow this format:

```typescript
interface ResponseData<T> {
  data: T | null;
  error: ErrorResponse | null;
}

interface ErrorResponse {
  code: number;
  message: string;
}
```

### Error Types

```typescript
// Check for errors
const response = await apiClient.node().getContexts();

if (response.error) {
  console.error(`Error ${response.error.code}: ${response.error.message}`);
  return;
}

// Use the data
const contexts = response.data;
```

### Authentication Errors

The SDK automatically handles authentication errors:

- **401 - Missing Token**: No access token found
- **401 - Token Expired**: Automatically attempts token refresh
- **401 - Token Revoked**: Clears tokens and requires re-authentication
- **401 - Invalid Token**: Clears tokens and requires re-authentication

### When to Handle Errors

Handle errors when you need to:

- **Provide user feedback** for failed operations
- **Implement retry logic** for transient failures
- **Handle authentication failures** gracefully
- **Log errors** for debugging purposes
- **Implement fallback behavior** for critical operations

## Error Handling

The SDK provides comprehensive error handling with specific error types and automatic retry mechanisms.

### Response Format

All API responses follow this format:

```typescript
interface ResponseData<T> {
  data: T | null;
  error: ErrorResponse | null;
}

interface ErrorResponse {
  code: number;
  message: string;
}
```

### Error Types

```typescript
// Check for errors
const response = await apiClient.node().getContexts();

if (response.error) {
  console.error(`Error ${response.error.code}: ${response.error.message}`);
  return;
}

// Use the data
const contexts = response.data;
```

### Authentication Errors

The SDK automatically handles authentication errors:

- **401 - Missing Token**: No access token found
- **401 - Token Expired**: Automatically attempts token refresh
- **401 - Token Revoked**: Clears tokens and requires re-authentication
- **401 - Invalid Token**: Clears tokens and requires re-authentication

### When to Handle Errors

Handle errors when you need to:

- **Provide user feedback** for failed operations
- **Implement retry logic** for transient failures
- **Handle authentication failures** gracefully
- **Log errors** for debugging purposes
- **Implement fallback behavior** for critical operations

## Best Practices

### 1. Configuration Management

```typescript
// Use environment variables for configuration
const NODE_URL = process.env.REACT_APP_CALIMERO_NODE_URL;
const APP_ID = process.env.REACT_APP_CALIMERO_APP_ID;

if (!NODE_URL || !APP_ID) {
  throw new Error('Missing Calimero configuration');
}

setAppEndpointKey(NODE_URL);
setApplicationId(APP_ID);
```

### 2. Error Handling

```typescript
// Always check for errors in responses
const response = await apiClient.node().getContexts();

if (response.error) {
  // Handle error appropriately
  showErrorNotification(response.error.message);
  return;
}

// Use the data safely
const contexts = response.data || [];
```

### 3. Authentication State Management

```typescript
// Check authentication state before making requests
const authConfig = getAuthConfig();

if (authConfig.error) {
  // Redirect to login or show authentication required
  redirectToLogin();
  return;
}

// Proceed with authenticated requests
const response = await apiClient.node().getContexts();
```

### 4. Token Management

```typescript
// The SDK handles token refresh automatically
// But you can manually refresh if needed
const refreshResponse = await authClient.refreshToken({
  access_token: getAccessToken()!,
  refresh_token: getRefreshToken()!,
});

if (refreshResponse.error) {
  // Handle refresh failure
  clientLogout();
}
```

### 5. API Usage

```typescript
// Use the provided API methods instead of direct HTTP calls
// ✅ Correct - Use API methods
const contexts = await apiClient.node().getContexts();

// ❌ Incorrect - Don't call HTTP client directly
// const httpClient = new AxiosHttpClient(axios);
// const response = await httpClient.get('/api/contexts');
```

## Examples

### Basic Setup and Usage

```typescript
import {
  setAppEndpointKey,
  setApplicationId,
  apiClient,
  getAuthConfig,
} from '@calimero-network/calimero-client';

// Initialize configuration
setAppEndpointKey('https://your-calimero-node.com');
setApplicationId('your-application-id');

// Check authentication state
const authConfig = getAuthConfig();
if (authConfig.error) {
  console.log('Authentication required:', authConfig.error);
}

// Use API methods
const contextsResponse = await apiClient.node().getContexts();
if (!contextsResponse.error) {
  console.log('Contexts:', contextsResponse.data);
}
```

### Blob Upload with Progress

```typescript
import { blobClient } from '@calimero-network/calimero-client';

async function uploadFile(file: File) {
  const response = await blobClient.uploadBlob(
    file,
    (progress) => {
      console.log(`Upload progress: ${progress}%`);
    },
    'expected-hash', // Optional
  );

  if (response.error) {
    console.error('Upload failed:', response.error.message);
    return;
  }

  console.log('Upload successful, blob ID:', response.data?.blobId);
}
```

### Context Management

```typescript
import { apiClient } from '@calimero-network/calimero-client';

// Create a new context
const createResponse = await apiClient
  .node()
  .createContext('application-id', '{"param": "value"}', 'protocol');

if (!createResponse.error) {
  console.log('Context created:', createResponse.data?.contextId);
}

// Get context identities
const identitiesResponse = await apiClient
  .node()
  .fetchContextIdentities('context-id');
if (!identitiesResponse.error) {
  console.log('Identities:', identitiesResponse.data?.identities);
}
```

### Contract Operations

```typescript
import { contractClient } from '@calimero-network/calimero-client';

// Get proposals
const proposalsResponse = await contractClient.getProposals({
  offset: 0,
  limit: 10,
});

if (!proposalsResponse.error) {
  console.log('Proposals:', proposalsResponse.data);
}

// Get context value
const valueResponse = await contractClient.getContextValue('key');
if (!valueResponse.error) {
  console.log('Context value:', valueResponse.data?.value);
}
```

### Admin Operations

```typescript
import { adminClient } from '@calimero-network/calimero-client';

// Get root keys
const keysResponse = await adminClient.getRootKeys();
if (!keysResponse.error) {
  console.log('Root keys:', keysResponse.data);
}

// Add root key
const addKeyResponse = await adminClient.addRootKey({
  public_key: 'public-key',
  auth_method: 'method',
  provider_data: {},
});

if (!addKeyResponse.error) {
  console.log('Key added successfully');
}
```

This documentation provides a comprehensive guide to using the Calimero JavaScript SDK, focusing on the API methods and storage features. The examples and best practices should help developers integrate the SDK effectively into their applications.
