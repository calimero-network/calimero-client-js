import { ApiResponse } from '../types/api-response';

// REST API interfaces for direct blob upload/download
export interface BlobUploadResponse {
  blob_id: string;
  size: number;
}

export interface BlobMetadataResponse {
  blob_id: string;
  size: number;
  exists: boolean;
}

// Main API interface - HTTP endpoints only
export interface BlobApi {
  // REST API methods (direct HTTP upload/download)
  uploadBlob(file: File, onProgress?: (progress: number) => void, expectedHash?: string): ApiResponse<BlobUploadResponse>;
  downloadBlob(blobId: string): Promise<Blob>;
  getBlobMetadata(blobId: string): ApiResponse<BlobMetadataResponse>;
} 