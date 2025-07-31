import { ApiResponse } from '../../types/api-response';
import {
  BlobApi,
  BlobUploadResponse,
  RawBlobUploadResponse,
  BlobMetadataResponse,
  BlobListResponseData,
  RawBlobListResponseData,
} from '../blobApi';
import { getAppEndpointKey, getAccessToken } from '../../storage';
import { HttpClient } from '../httpClient';

export class BlobApiDataSource implements BlobApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  /**
   * UPLOADING BLOBS
   *
   * We use a direct XMLHttpRequest here instead of the standard HttpClient because
   * it provides a more reliable and straightforward way to handle raw file uploads
   * as a stream of bytes (`application/octet-stream`). This approach also gives
   * us access to the `onProgress` event, which is essential for tracking upload
   * progress in the UI. The standard HttpClient, built on Axios, abstracts away
   * some of this low-level control, making progress tracking more complex to
   * implement reliably for this specific use case.
   */
  async uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
  ): ApiResponse<BlobUploadResponse> {
    const fileArrayBuffer = await file.arrayBuffer();
    const token = getAccessToken();

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const rawResponse: RawBlobUploadResponse = JSON.parse(
              xhr.responseText,
            );
            const transformedResponse: BlobUploadResponse = {
              blobId: rawResponse.blob_id,
              size: rawResponse.size,
            };
            resolve({
              data: transformedResponse,
              error: null,
            });
          } else {
            const errorResponse = JSON.parse(xhr.responseText);
            resolve({
              data: null,
              error: {
                code: xhr.status,
                message:
                  errorResponse.error ||
                  `HTTP ${xhr.status}: ${xhr.statusText}`,
              },
            });
          }
        } catch (error) {
          resolve({
            data: null,
            error: {
              code: xhr.status || 500,
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to parse response',
            },
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          data: null,
          error: {
            code: 500,
            message: 'Network error occurred during upload',
          },
        });
      });

      let url = `${this.baseUrl}/admin-api/blobs`;
      if (expectedHash) {
        url += `?hash=${encodeURIComponent(expectedHash)}`;
      }

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(fileArrayBuffer);
    });
  }

  /**
   * DOWNLOADING AND METADATA
   *
   * For downloading blobs and fetching their metadata, a simple `fetch` call is
   * sufficient and avoids the overhead of the full HttpClient. The primary reason
   * for using `fetch` directly is its native support for handling Blob responses
   * and for making `HEAD` requests to get headers, which is how we retrieve
   * metadata. The authentication token is added manually to the headers to ensure
   * these requests are authorized.
   */
  async downloadBlob(blobId: string): Promise<Blob> {
    const token = getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/admin-api/blobs/${blobId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download blob: ${response.status} ${response.statusText}`,
      );
    }

    return response.blob();
  }

  async getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse> {
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${this.baseUrl}/admin-api/blobs/${blobId}`,
        {
          method: 'HEAD',
          headers,
        },
      );

      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : 0;
        const fileType =
          response.headers.get('X-Blob-MIME-Type') ||
          response.headers.get('content-type') ||
          'unknown';
        const returnedBlobId = response.headers.get('X-Blob-ID');

        return {
          data: {
            blobId: returnedBlobId,
            size,
            fileType,
          },
          error: null,
        };
      } else {
        return {
          data: null,
          error: {
            code: response.status,
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }
    } catch (error) {
      console.error('getBlobMetadata failed:', error);
      return {
        data: null,
        error: {
          code: 500,
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        },
      };
    }
  }

  async listBlobs(): ApiResponse<BlobListResponseData> {
    try {
      const response = await this.client.get<RawBlobListResponseData>(
        `${this.baseUrl}/admin-api/blobs`,
      );

      if (response.error) {
        return { data: null, error: response.error };
      }

      const transformedData: BlobListResponseData = {
        blobs: response.data.blobs.map((blob) => ({
          blobId: blob.blob_id,
          size: blob.size,
        })),
      };

      return {
        data: transformedData,
        error: null,
      };
    } catch (error) {
      console.error('listBlobs failed:', error);
      return {
        data: null,
        error: {
          code: 500,
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        },
      };
    }
  }

  async deleteBlob(blobId: string): ApiResponse<void> {
    try {
      const response = await this.client.delete<void>(
        `${this.baseUrl}/admin-api/blobs/${blobId}`,
      );
      return response;
    } catch (error) {
      console.error('deleteBlob failed:', error);
      return {
        data: null,
        error: {
          code: 500,
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        },
      };
    }
  }
}
