import React from 'react';

interface BlobMetadata {
  blobId: string;
  size: number;
  fileType: string;
}

interface BlobDetailsModalProps {
  blob: BlobMetadata | null;
  onClose: () => void;
  onDownload: (blobId: string) => void;
  onDelete: (blobId: string) => void;
}

const BlobDetailsModal: React.FC<BlobDetailsModalProps> = ({
  blob,
  onClose,
  onDownload,
  onDelete,
}) => {
  if (!blob) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) return '📝';
    if (fileType.includes('zip') || fileType.includes('tar') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#212529', fontSize: '1.5rem', fontWeight: '600' }}>
            Blob Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <span style={{ fontSize: '2rem' }}>{getFileIcon(blob.fileType)}</span>
            <div>
              <div style={{ fontWeight: '600', color: '#212529', marginBottom: '0.25rem' }}>
                {blob.fileType || 'Unknown Type'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                {formatFileSize(blob.size)}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '500', 
              color: '#495057', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Blob ID:
            </label>
            <div style={{
              padding: '0.75rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
              fontSize: '0.85rem',
              color: '#495057',
              wordBreak: 'break-all'
            }}>
              {blob.blobId}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '500', 
              color: '#495057', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              File Type:
            </label>
            <div style={{
              padding: '0.75rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              color: '#495057'
            }}>
              {blob.fileType || 'Unknown'}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontWeight: '500', 
              color: '#495057', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              File Size:
            </label>
            <div style={{
              padding: '0.75rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
              color: '#495057'
            }}>
              {formatFileSize(blob.size)} ({blob.size.toLocaleString()} bytes)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onDelete(blob.blobId)}
            style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 53, 69, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(220, 53, 69, 0.2)';
            }}
          >
            Delete
          </button>
          <button
            onClick={() => onDownload(blob.blobId)}
            style={{
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.2)';
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlobDetailsModal; 