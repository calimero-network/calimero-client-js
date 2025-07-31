# Changelog

## [Unreleased] - 2025-01-31

### 🚀 New Features

#### Blob API Integration
- **Added blob storage methods to `CalimeroApp`**: All blob API methods are now available directly on the `app` object obtained from `useCalimero` hook
  - `app.uploadBlob(file: File, onProgress?: (progress: number) => void, expectedHash?: string)`: Upload files to blob storage
  - `app.downloadBlob(blobId: string)`: Download files from blob storage
  - `app.listBlobs()`: List all available blobs
  - `app.deleteBlob(blobId: string)`: Delete blobs from storage

#### Real-time Subscriptions API
- **Exposed WebSocket subscription methods directly on `CalimeroApp`**:
  - `app.connect(connectionId?: string)`: Connect to WebSocket server
  - `app.disconnect(connectionId?: string)`: Disconnect from WebSocket server
  - `app.subscribe(contexts: Context[], connectionId?: string)`: Subscribe to real-time events for specific contexts
  - `app.unsubscribe(contexts: Context[], connectionId?: string)`: Unsubscribe from real-time events
  - `app.addCallback(callback: (event: NodeEvent) => void, connectionId?: string)`: Add event callback
  - `app.removeCallback(callback: (event: NodeEvent) => void, connectionId?: string)`: Remove event callback

### 🔧 Improvements

#### Architecture & Performance
- **Refactored HTTP client instantiation**: All API clients now share a single `HttpClient` instance, reducing memory footprint and improving manageability
- **Made `SubscriptionsClient` injectable**: Added optional `subscriptionsClient` parameter to `CalimeroApplication` constructor for better testability
- **Improved type safety**: Enhanced TypeScript types throughout the codebase

#### Code Quality
- **Fixed linter warnings**: Resolved `useEffect` dependency warnings in React components
- **Added comprehensive comments**: Added JSDoc comments explaining dependency injection patterns
- **Enhanced error handling**: Improved error handling in blob operations with proper try-catch blocks

#### Testing
- **Added API consistency tests**: Created comprehensive test suite (`test/experimentalApi.test.ts`) that verifies:
  - Method existence and signatures
  - Correct delegation to underlying clients
  - Proper data transformation (e.g., `Context[]` → `string[]` for subscriptions)
  - Type safety through interaction testing
- **Added Jest configuration**: Created `jest.config.cjs` for TypeScript test support
- **Added browser API polyfills**: Added `File` and `Blob` polyfills for Node.js test environment

### 📦 Build & Distribution
- **Generated SDK builds**: Created distributable files in `lib/` directory:
  - `index.js` (CommonJS format, 207KB)
  - `index.mjs` (ES modules format, 198KB)
  - `index.d.ts` (TypeScript definitions)
- **Exported additional types**: Made `BlobInfo` type available for external consumption

### 🔄 Backward Compatibility
- **Preserved existing WebSocket API**: Maintained backward compatibility with existing `WsSubscriptionsClient` by adding mapping layer in `CalimeroApplication`
- **No breaking changes**: All existing public APIs remain unchanged

### 📚 Documentation
- **Added constructor documentation**: Added JSDoc comments explaining the injectability pattern for `SubscriptionsClient`
- **Updated example application**: Enhanced example to demonstrate blob API usage and real-time event handling

### 🛠️ Technical Details

#### Blob API Implementation
- Uses `XMLHttpRequest` for file uploads (`application/octet-stream`) with manual token injection
- Uses `fetch` for file downloads and metadata retrieval with manual token injection
- Maintains compatibility with server-side blob storage endpoints
- Includes progress tracking for uploads

#### Subscriptions API Implementation
- Maps `Context[]` to `string[]` internally to maintain compatibility with existing `WsSubscriptionsClient`
- Provides direct access to WebSocket methods without requiring separate client instantiation
- Supports multiple connection IDs for advanced use cases

#### Testing Strategy
- Uses interaction tests to verify internal logic and data transformations
- Mocks external dependencies for isolated testing
- Includes browser API polyfills for Node.js test environment
- Verifies method signatures to prevent accidental API breaking changes

### 🎯 Usage Examples

#### Blob Storage
```typescript
import { useCalimero } from '@calimero-network/calimero-client';

function MyComponent() {
  const { app } = useCalimero();
  
  const handleFileUpload = async (file: File) => {
    try {
      const result = await app.uploadBlob(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      console.log('Uploaded blob ID:', result.data.blobId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  const handleListBlobs = async () => {
    const blobs = await app.listBlobs();
    console.log('Available blobs:', blobs.data);
  };
}
```

#### Real-time Subscriptions
```typescript
import { useCalimero } from '@calimero-network/calimero-client';

function MyComponent() {
  const { app } = useCalimero();
  
  useEffect(() => {
    // Connect to WebSocket
    app.connect();
    
    // Add event callback
    app.addCallback((event) => {
      console.log('Received event:', event);
    });
    
    // Subscribe to contexts
    app.subscribe([context1, context2]);
    
    return () => {
      app.disconnect();
    };
  }, [app]);
}
```

### 🔗 Related Issues
- Resolves blob API access requirements
- Addresses WebSocket subscription integration needs
- Improves testability and maintainability
- Enhances developer experience with better type safety

---

## Previous Versions

*For changes in previous versions, please refer to the git history.* 