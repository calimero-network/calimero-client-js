// Node.js example - using undici fetch (recommended for Node.js)
import { createNodeHttpClient } from '../src/http/factory';

// For Node.js, you need to provide a fetch implementation
// Option 1: Use undici (recommended)
// npm install undici
// import { fetch as undiciFetch } from 'undici';

// Option 2: Use Node.js 18+ native fetch
// const nodeFetch = globalThis.fetch;

// Option 3: Use node-fetch
// npm install node-fetch
// import fetch from 'node-fetch';

// Create HTTP client for Node.js environment
const httpClient = createNodeHttpClient({
  baseUrl: 'https://api.example.com',
  // fetch: undiciFetch, // Uncomment if using undici
  getAuthToken: async () => {
    // Get token from environment variables, database, or wherever you store it
    return process.env.ACCESS_TOKEN || null;
  },
  onTokenRefresh: async (newToken: string) => {
    // Update stored token when it's refreshed
    process.env.ACCESS_TOKEN = newToken;
    console.log('Token refreshed:', newToken);
  },
  defaultHeaders: {
    'User-Agent': 'MyNodeApp/1.0',
  },
  timeoutMs: 15000, // 15 seconds
});

// Example usage
async function example() {
  try {
    // GET request
    const response = await httpClient.get<{ message: string }>('/api/hello');
    if (response.data) {
      console.log('Success:', response.data.message);
    } else {
      console.error('Error:', response.error);
    }

    // POST request
    const postResponse = await httpClient.post<{ id: number }>('/api/users', {
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    if (postResponse.data) {
      console.log('User created:', postResponse.data.id);
    } else {
      console.error('Error creating user:', postResponse.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run example
example();
