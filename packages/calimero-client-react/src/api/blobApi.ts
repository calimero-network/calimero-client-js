import { ApiResponse } from '../types/api-response';

// REST API interfaces for direct blob upload/download
export interface BlobUploadResponse {
  blobId: string;
  size: number;
}

export interface RawBlobUploadResponse {
  blob_id: string;
  size: number;
}

export interface BlobMetadataResponse {
  blobId: string;
  size: number;
  fileType: string;
}

export interface BlobInfo {
  blobId: string;
  size: number;
}

export interface RawBlobInfo {
  blob_id: string;
  size: number;
}

export interface BlobListResponseData {
  blobs: BlobInfo[];
}

export interface RawBlobListResponseData {
  blobs: RawBlobInfo[];
}

// Main API interface - HTTP endpoints only
export interface BlobApi {
  // REST API methods (direct HTTP upload/download)
  uploadBlob(
    file: File,
    onProgress?: (progress: number) => void,
    expectedHash?: string,
  ): ApiResponse<BlobUploadResponse>;
  downloadBlob(blobId: string, contextId: string): Promise<Blob>;
  getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse>;
  listBlobs(): ApiResponse<BlobListResponseData>;
  deleteBlob(blobId: string): ApiResponse<void>;
}
