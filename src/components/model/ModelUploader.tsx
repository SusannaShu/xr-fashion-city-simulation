import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { ModelLoader } from '../../services/model/ModelLoader';
import { toast } from '../shared/ToastContainer';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import styles from './ModelUploader.module.css';

const ACCEPTED_FORMATS = {
  'model/gltf+json': ['.gltf'],
  'model/gltf-binary': ['.glb'],
  'application/octet-stream': ['.glb', '.gltf'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ModelUploaderProps {
  onUploadComplete?: (modelId: string) => void;
  onUploadError?: (error: Error) => void;
}

export const ModelUploader: React.FC<ModelUploaderProps> = ({
  onUploadComplete,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error('File size exceeds 50MB limit');
        }

        // Upload and process the model
        const processedModel = await ModelLoader.uploadAndProcess({
          file,
          name: file.name.replace(/\.[^/.]+$/, ''),
          creator: 'current-user-id', // TODO: Get from auth context
          tags: [],
        });

        setUploadProgress(100);
        toast.success('Model uploaded successfully');
        onUploadComplete?.(processedModel.metadata.id);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        toast.error(err.message);
        onUploadError?.(err);
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FORMATS,
    maxFiles: 1,
    multiple: false,
    disabled: isUploading,
    onDrop: handleUpload,
    onDragEnter: event => {
      event.preventDefault();
      event.stopPropagation();
    },
    onDragOver: event => {
      event.preventDefault();
      event.stopPropagation();
    },
    onDragLeave: event => {
      event.preventDefault();
      event.stopPropagation();
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${
        isUploading ? styles.uploading : ''
      }`}
    >
      <input {...getInputProps()} type="file" />

      {isUploading ? (
        <div className={styles.uploadingState}>
          <LoadingSpinner size="medium" theme="light" />
          <p>Uploading... {uploadProgress}%</p>
        </div>
      ) : (
        <div className={styles.defaultState}>
          <div className={styles.icon}>{isDragActive ? '📥' : '📤'}</div>
          <p className={styles.mainText}>
            {isDragActive
              ? 'Drop the model here'
              : 'Drag & drop a 3D model here'}
          </p>
          <p className={styles.subText}>
            Supported formats: GLB, GLTF (max 50MB)
          </p>
        </div>
      )}
    </div>
  );
};
