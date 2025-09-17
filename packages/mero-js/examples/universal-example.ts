// Universal example - works in both browser and Node.js
import { createUniversalHttpClient } from '../src/http/factory';

// Create HTTP client that works in both environments
const httpClient = createUniversalHttpClient({
  baseUrl: 'https://api.example.com',
  // fetch: customFetch, // Optional: provide custom fetch implementation
  getAuthToken: async () => {
    // Environment-specific token retrieval
    if (typeof window !== 'undefined') {
      // Browser environment
      return localStorage.getItem('access_token');
    } else {
      // Node.js environment
      return process.env.ACCESS_TOKEN || null;
    }
  },
  onTokenRefresh: async (newToken: string) => {
    // Environment-specific token storage
    if (typeof window !== 'undefined') {
      // Browser environment
      localStorage.setItem('access_token', newToken);
    } else {
      // Node.js environment
      process.env.ACCESS_TOKEN = newToken;
      console.log('Token refreshed:', newToken);
    }
  },
  defaultHeaders: {
    'User-Agent': 'MyUniversalApp/1.0',
  },
  timeoutMs: 12000, // 12 seconds
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

    // POST request with custom headers
    const postResponse = await httpClient.post<{ id: number }>(
      '/api/users',
      {
        name: 'Universal User',
        email: 'user@example.com',
      },
      {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      },
    );

    if (postResponse.data) {
      console.log('User created:', postResponse.data.id);
    } else {
      console.error('Error creating user:', postResponse.error);
    }

    // PUT request
    const putResponse = await httpClient.put<{ updated: boolean }>(
      '/api/users/123',
      {
        name: 'Updated User',
        email: 'updated@example.com',
      },
    );

    if (putResponse.data) {
      console.log('User updated:', putResponse.data.updated);
    } else {
      console.error('Error updating user:', putResponse.error);
    }

    // DELETE request
    const deleteResponse = await httpClient.delete<{ deleted: boolean }>(
      '/api/users/123',
    );

    if (deleteResponse.data) {
      console.log('User deleted:', deleteResponse.data.deleted);
    } else {
      console.error('Error deleting user:', deleteResponse.error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run example
example();
