# CalimeroClient API Reference

## New Features (Session 2025-01-31)

### Blob Storage API

All blob storage methods are now available directly on the `app` object from `useCalimero()`:

```typescript
const { app } = useCalimero();
```

#### `app.uploadBlob(file, onProgress?, expectedHash?)`
Upload a file to blob storage.

**Parameters:**
- `file: File` - The file to upload
- `onProgress?: (progress: number) => void` - Optional progress callback (0-100)
- `expectedHash?: string` - Optional expected file hash for validation

**Returns:** `Promise<{ data: { blobId: string }, error: null }>`

**Example:**
```typescript
const result = await app.uploadBlob(file, (progress) => {
  console.log(`Upload: ${progress}%`);
});
console.log('Blob ID:', result.data.blobId);
```

#### `app.downloadBlob(blobId)`
Download a file from blob storage.

**Parameters:**
- `blobId: string` - The ID of the blob to download

**Returns:** `Promise<Blob>`

**Example:**
```typescript
const blob = await app.downloadBlob('my-blob-id');
const url = URL.createObjectURL(blob);
```

#### `app.listBlobs()`
List all available blobs.

**Returns:** `Promise<{ data: BlobInfo[], error: null }>`

**Example:**
```typescript
const result = await app.listBlobs();
result.data.forEach(blob => {
  console.log('Blob:', blob.blobId);
});
```

#### `app.deleteBlob(blobId)`
Delete a blob from storage.

**Parameters:**
- `blobId: string` - The ID of the blob to delete

**Returns:** `Promise<{ data: null, error: null }>`

**Example:**
```typescript
await app.deleteBlob('my-blob-id');
```

### Real-time Subscriptions API

WebSocket subscription methods are now available directly on the `app` object:

#### `app.connect(connectionId?)`
Connect to the WebSocket server.

**Parameters:**
- `connectionId?: string` - Optional connection ID for multiple connections

**Example:**
```typescript
app.connect();
```

#### `app.disconnect(connectionId?)`
Disconnect from the WebSocket server.

**Parameters:**
- `connectionId?: string` - Optional connection ID

**Example:**
```typescript
app.disconnect();
```

#### `app.subscribe(contexts, connectionId?)`
Subscribe to real-time events for specific contexts.

**Parameters:**
- `contexts: Context[]` - Array of contexts to subscribe to
- `connectionId?: string` - Optional connection ID

**Example:**
```typescript
app.subscribe([context1, context2]);
```

#### `app.unsubscribe(contexts, connectionId?)`
Unsubscribe from real-time events.

**Parameters:**
- `contexts: Context[]` - Array of contexts to unsubscribe from
- `connectionId?: string` - Optional connection ID

**Example:**
```typescript
app.unsubscribe([context1, context2]);
```

#### `app.addCallback(callback, connectionId?)`
Add an event callback to handle real-time events.

**Parameters:**
- `callback: (event: NodeEvent) => void` - Function to handle events
- `connectionId?: string` - Optional connection ID

**Example:**
```typescript
app.addCallback((event) => {
  console.log('Received event:', event);
});
```

#### `app.removeCallback(callback, connectionId?)`
Remove an event callback.

**Parameters:**
- `callback: (event: NodeEvent) => void` - The callback to remove
- `connectionId?: string` - Optional connection ID

**Example:**
```typescript
const myCallback = (event) => console.log(event);
app.addCallback(myCallback);
// Later...
app.removeCallback(myCallback);
```

## Complete Example

```typescript
import { useCalimero } from '@calimero-network/calimero-client';
import { useEffect } from 'react';

function MyApp() {
  const { app, isAuthenticated } = useCalimero();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect to WebSocket
    app.connect();

    // Add event handler
    const handleEvent = (event) => {
      console.log('Real-time event:', event);
    };
    app.addCallback(handleEvent);

    // Subscribe to contexts
    app.subscribe([myContext]);

    return () => {
      app.removeCallback(handleEvent);
      app.disconnect();
    };
  }, [isAuthenticated, app]);

  const handleFileUpload = async (file) => {
    try {
      const result = await app.uploadBlob(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      console.log('File uploaded:', result.data.blobId);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleListFiles = async () => {
    const result = await app.listBlobs();
    console.log('Available files:', result.data);
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
      <button onClick={handleListFiles}>List Files</button>
    </div>
  );
}
```

## Type Definitions

```typescript
interface BlobInfo {
  blobId: string;
  // ... other properties
}

interface Context {
  contextId: string;
  executorId: string;
  applicationId: string;
}

interface NodeEvent {
  // ... event properties
}
```

## Notes

- All blob operations include automatic authentication token handling
- WebSocket connections are automatically managed by the client
- The subscription API uses `Context` objects but maps them internally to maintain compatibility
- All methods are fully typed with TypeScript
- Error handling is consistent across all new methods 