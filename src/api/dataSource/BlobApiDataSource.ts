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
import { getAppEndpointKey, getContextId } from '../../storage';

export class BlobApiDataSource implements BlobApi {
  constructor(private client: HttpClient) {}

  private get baseUrl(): string {
    return getAppEndpointKey();
  }

  async uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
  ): ApiResponse<BlobUploadResponse> {
    try {
      const fileArrayBuffer = await file.arrayBuffer();

      let url = `${this.baseUrl}/admin-api/blobs`;
      const params = new URLSearchParams();
      if (expectedHash) {
        params.append('hash', expectedHash);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Use HttpClient PUT method with binary data and progress tracking
      const response = await this.client.put<RawBlobUploadResponse>(
        url,
        fileArrayBuffer,
        [{ 'Content-Type': 'application/octet-stream' }],
        false,
        onProgress,
      );

      if (response.error) {
        return {
          data: null,
          error: response.error,
        };
      }

      // Transform snake_case to camelCase
      const transformedResponse: BlobUploadResponse = {
        blobId: response.data!.blob_id,
        size: response.data!.size,
      };

      return {
        data: transformedResponse,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          code: 500,
          message:
            error instanceof Error ? error.message : 'Failed to upload blob',
        },
      };
    }
  }

  async downloadBlob(blobId: string): Promise<Blob> {
    let url = `${this.baseUrl}/admin-api/blobs/${blobId}`;

    const params = new URLSearchParams();
    params.append('context_id', getContextId());
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await this.client.get<ArrayBuffer>(url, undefined, false, {
      responseType: 'arraybuffer',
    });

    if (response.error) {
      throw new Error(
        `Failed to download blob: ${response.error.code} ${response.error.message}`,
      );
    }

    return new Blob([response.data!]);
  }

  async getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse> {
    try {
      // Use HttpClient HEAD method that now returns headers
      const response = await this.client.head(
        `${this.baseUrl}/admin-api/blobs/${blobId}`,
      );

      if (response.error) {
        return {
          data: null,
          error: response.error,
        };
      }

      // Extract metadata from response headers
      const headers = response.data!.headers;
      const contentLength = headers['content-length'];
      const size = contentLength ? parseInt(contentLength, 10) : 0;
      const fileType =
        headers['x-blob-mime-type'] || headers['content-type'] || 'unknown';
      const responseBlobId = headers['x-blob-id'];

      return {
        data: {
          blobId: responseBlobId || blobId,
          size,
          fileType,
        },
        error: null,
      };
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
