import { ApiResponse } from '../../types/api-response';
import { HttpClient } from '@calimero-network/mero-js';
import { withResponseData } from '../http-utils';
import {
  BlobApi,
  BlobUploadResponse,
  RawBlobUploadResponse,
  BlobMetadataResponse,
  BlobListResponseData,
  RawBlobListResponseData,
} from '../blobApi';
import { getAppEndpointKey } from '../../storage';
import { BaseApiDataSource } from './BaseApiDataSource';

export class BlobApiDataSource extends BaseApiDataSource implements BlobApi {
  constructor(private client: HttpClient) {
    super();
  }

  private get baseUrl(): string | null {
    return getAppEndpointKey();
  }

  private validateBaseUrl(): ApiResponse<never> | null {
    if (!this.baseUrl) {
      return Promise.resolve({
        data: null,
        error: {
          code: 400,
          message: 'Node URL not configured. Please set the app endpoint key.',
        },
      });
    }
    return null;
  }

  async uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
  ): ApiResponse<BlobUploadResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    const fileArrayBuffer = await file.arrayBuffer();

    let url = this.buildUrl('admin-api/blobs', this.baseUrl!).toString();
    const params = new URLSearchParams();
    if (expectedHash) {
      params.append('hash', expectedHash);
    }
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Note: mero-js doesn't support upload progress callback, so onProgress is ignored
    const response = await withResponseData(() =>
      this.client.put<RawBlobUploadResponse>(url, fileArrayBuffer, {
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    );

    if (response.error) {
      return Promise.resolve({
        data: null,
        error: response.error,
      });
    }

    // Transform snake_case to camelCase
    const transformedResponse: BlobUploadResponse = {
      blobId: response.data!.blob_id,
      size: response.data!.size,
    };

    return Promise.resolve({
      data: transformedResponse,
      error: null,
    });
  }

  async downloadBlob(blobId: string, contextId: string): Promise<Blob> {
    if (!this.baseUrl) {
      throw new Error(
        'Node URL not configured. Please set the app endpoint key.',
      );
    }
    let url = this.buildUrl(
      `admin-api/blobs/${blobId}`,
      this.baseUrl,
    ).toString();

    const params = new URLSearchParams();
    params.append('context_id', contextId);
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const arrayBuffer = await this.client.get<ArrayBuffer>(url, {
      parse: 'arrayBuffer',
    });

    return new Blob([arrayBuffer]);
  }

  async getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    const response = await withResponseData(() =>
      this.client.head(
        this.buildUrl(`admin-api/blobs/${blobId}`, this.baseUrl!),
      ),
    );

    if (response.error) {
      return Promise.resolve({
        data: null,
        error: response.error,
      });
    }

    // Extract metadata from response headers
    const headers = response.data!.headers;
    const contentLength = headers['content-length'];
    const size = contentLength ? parseInt(contentLength, 10) : 0;
    const fileType =
      headers['x-blob-mime-type'] || headers['content-type'] || 'unknown';
    const responseBlobId = headers['x-blob-id'];

    return Promise.resolve({
      data: {
        blobId: responseBlobId || blobId,
        size,
        fileType,
      },
      error: null,
    });
  }

  async listBlobs(): ApiResponse<BlobListResponseData> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    const response = await withResponseData(() =>
      this.client.get<RawBlobListResponseData>(
        this.buildUrl('admin-api/blobs', this.baseUrl!),
      ),
    );

    if (response.error) {
      return Promise.resolve({
        data: null,
        error: response.error,
      });
    }

    // Transform snake_case to camelCase
    const transformedData: BlobListResponseData = {
      blobs: response.data!.blobs.map((blob) => ({
        blobId: blob.blob_id,
        size: blob.size,
      })),
    };

    return Promise.resolve({
      data: transformedData,
      error: null,
    });
  }

  async deleteBlob(blobId: string): ApiResponse<void> {
    const validationError = this.validateBaseUrl();
    if (validationError) return validationError;
    return withResponseData(() =>
      this.client.delete<void>(
        this.buildUrl(`admin-api/blobs/${blobId}`, this.baseUrl!),
      ),
    );
  }
}
