import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '../httpClient';
import {
  BlobApi,
  BlobUploadResponse,
  RawBlobUploadResponse,
  BlobMetadataResponse,
  BlobListResponseData,
  RawBlobListResponseData,
} from '../blobApi';
import { getAppEndpointKey } from '../../storage';

export class BlobApiDataSource implements BlobApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  async uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
    contextId?: string,
  ): ApiResponse<BlobUploadResponse> {
    const fileArrayBuffer = await file.arrayBuffer();

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
          if (xhr.status === 200) {
            const rawResponse: RawBlobUploadResponse = JSON.parse(
              xhr.responseText,
            );
            // Transform snake_case to camelCase
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
      if (contextId) {
        url += `?context_id=${contextId}`;
      }

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(fileArrayBuffer);
    });
  }

  async downloadBlob(blobId: string, contextId?: string): Promise<Blob> {
    let url = `${this.baseUrl}/admin-api/blobs/${blobId}`;
    if (contextId) {
      url += `?context_id=${contextId}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to download blob: ${response.status} ${response.statusText}`,
      );
    }

    return response.blob();
  }

  async getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/admin-api/blobs/${blobId}`,
        {
          method: 'HEAD',
        },
      );

      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : 0;
        const fileType =
          response.headers.get('X-Blob-MIME-Type') ||
          response.headers.get('content-type') ||
          'unknown';
        const blobId = response.headers.get('X-Blob-ID');

        return {
          data: {
            blobId,
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

      if (response.data) {
        // Transform snake_case to camelCase
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
      }

      return {
        data: null,
        error: response.error,
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
