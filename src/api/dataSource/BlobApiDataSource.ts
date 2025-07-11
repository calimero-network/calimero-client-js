import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '../httpClient';
import { BlobApi, BlobUploadResponse, BlobMetadataResponse } from '../blobApi';
import { getAppEndpointKey } from '../../storage';

export class BlobApiDataSource implements BlobApi {
  private baseUrl: string;

  constructor(private client: HttpClient) {
    this.baseUrl = getAppEndpointKey();
  }

  async uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
  ): ApiResponse<BlobUploadResponse> {
    // Read file as ArrayBuffer for raw binary upload
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
            const response = JSON.parse(xhr.responseText);
            resolve({
              data: response,
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

      // Build URL with query parameters
      let url = `${this.baseUrl}/admin-api/blobs/upload`;
      if (expectedHash) {
        url += `?hash=${encodeURIComponent(expectedHash)}`;
      }

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.send(fileArrayBuffer);
    });
  }

  async downloadBlob(blobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/admin-api/blobs/${blobId}`);

    if (!response.ok) {
      throw new Error(
        `Failed to download blob: ${response.status} ${response.statusText}`,
      );
    }

    return response.blob();
  }

  async getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse> {
    try {
      const response = await this.client.get<BlobMetadataResponse>(
        `/admin-api/blobs/${blobId}/info`,
      );
      return response;
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
}
