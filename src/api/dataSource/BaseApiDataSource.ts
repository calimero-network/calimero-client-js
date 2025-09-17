/**
 * Base class for API data sources with URL handling utilities
 */
export abstract class BaseApiDataSource {
  /**
   * Safely constructs a URL by joining a base URL with a path
   * Handles trailing slashes and prevents double slashes
   * @param path - The path to append (e.g., 'admin-api/contexts')
   * @param baseUrl - The base URL
   * @returns Complete URL string
   */
  protected buildUrl(path: string, baseUrl: string | null): string {
    if (!baseUrl) return '';
    // Remove trailing slashes to prevent double slashes when using URL constructor
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    return new URL(path, normalizedBase).toString();
  }

  /**
   * Builds an API endpoint URL
   * @param endpoint - The API endpoint (e.g., 'admin-api/contexts')
   * @param baseUrl - The base URL
   * @returns Complete API URL
   */
  protected buildApiUrl(endpoint: string, baseUrl: string | null): string {
    return this.buildUrl(endpoint, baseUrl);
  }
}
