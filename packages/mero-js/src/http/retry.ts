// Retry helper for HTTP requests
export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error, attempt: number) => boolean;
}

// Default retry condition - retry on network errors and 5xx status codes
function defaultRetryCondition(error: Error, attempt: number): boolean {
  // Don't retry on the last attempt
  if (attempt <= 0) return false;
  
  // Retry on network errors (AbortError, etc.)
  if (error.name === 'AbortError' || error.name === 'TypeError') {
    return true;
  }
  
  // Retry on HTTP errors with 5xx status codes
  if ('status' in error && typeof error.status === 'number') {
    return error.status >= 500;
  }
  
  return false;
}

// Calculate delay with exponential backoff
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number, backoffFactor: number): number {
  const delay = baseDelayMs * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelayMs);
}

// Extract Retry-After header value
function getRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) return null;
  
  // If it's a number, treat as seconds
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  
  // If it's a date, calculate the difference
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  
  return null;
}

// Retry helper function
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    retryCondition = defaultRetryCondition,
  } = options;

  let lastError: Error;
  
  for (let attempt = attempts - 1; attempt >= 0; attempt--) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (!retryCondition(lastError, attempt)) {
        throw lastError;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === 0) {
        throw lastError;
      }
      
      // Calculate delay
      let delayMs = calculateDelay(attempts - attempt - 1, baseDelayMs, maxDelayMs, backoffFactor);
      
      // Check for Retry-After header if it's an HTTP error
      if ('response' in lastError && lastError.response instanceof Response) {
        const retryAfterMs = getRetryAfterMs(lastError.response);
        if (retryAfterMs !== null) {
          delayMs = Math.max(delayMs, retryAfterMs);
        }
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError!;
}

// Helper to create a retry-enabled HTTP client method
export function createRetryableMethod<T extends any[], R>(
  method: (...args: T) => Promise<R>,
  retryOptions: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    return withRetry(() => method(...args), retryOptions);
  };
}
