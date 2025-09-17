// Browser example - using native fetch
import { createBrowserHttpClient, withRetry } from '../src/http/factory';

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
  credentials: 'include', // Include cookies for CORS requests
});

// Example usage
async function example() {
  try {
    // GET request with custom parsing
    const response = await httpClient.get<{ message: string }>('/api/hello', {
      parse: 'json', // Explicitly specify parsing mode
    });
    if (response.data) {
      console.log('Success:', response.data.message);
    } else {
      console.error('Error:', response.error);
    }

    // POST request with FormData
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    
    const postResponse = await httpClient.post<{ id: number }>('/api/users', formData, {
      // FormData automatically handles Content-Type
    });

    if (postResponse.data) {
      console.log('User created:', postResponse.data.id);
    } else {
      console.error('Error creating user:', postResponse.error);
    }

    // Request with AbortController
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), 5000); // Cancel after 5 seconds
    
    const abortResponse = await httpClient.get<{ data: string }>('/api/slow-endpoint', {
      signal: abortController.signal,
    });

    // Request with retry
    const retryResponse = await withRetry(
      () => httpClient.get<{ data: string }>('/api/unreliable-endpoint'),
      {
        attempts: 3,
        baseDelayMs: 1000,
        backoffFactor: 2,
      }
    );

    if (retryResponse.data) {
      console.log('Retry success:', retryResponse.data);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

// Run example
example();
