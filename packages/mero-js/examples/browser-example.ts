// Browser example - using native fetch
import { createBrowserHttpClient } from '../src/http/factory';

// Create HTTP client for browser environment
const httpClient = createBrowserHttpClient({
  baseUrl: 'https://api.example.com',
  getAuthToken: async () => {
    // Get token from localStorage, sessionStorage, or wherever you store it
    return localStorage.getItem('access_token');
  },
  onTokenRefresh: async (newToken: string) => {
    // Update stored token when it's refreshed
    localStorage.setItem('access_token', newToken);
  },
  defaultHeaders: {
    'User-Agent': 'MyApp/1.0',
  },
  timeoutMs: 10000, // 10 seconds
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
      name: 'John Doe',
      email: 'john@example.com',
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
