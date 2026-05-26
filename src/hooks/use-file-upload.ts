"use client";

import { useState, useCallback } from "react";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "uploading" | "uploaded" | "error";
  progress: number;
  error?: string;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onFilesChange?: (files: UploadedFile[]) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFiles = 10,
    maxSizeMB = 25,
    acceptedTypes = ["application/pdf"],
    onFilesChange,
  } = options;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        if (files.length + validFiles.length >= maxFiles) {
          break;
        }

        if (file.size > maxSizeMB * 1024 * 1024) {
          validFiles.push({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            status: "error",
            progress: 0,
            error: `File exceeds ${maxSizeMB}MB limit`,
          });
          continue;
        }

        if (
          acceptedTypes.length > 0 &&
          !acceptedTypes.some(
            (type) =>
              file.type === type ||
              (type.startsWith(".") &&
                file.name.toLowerCase().endsWith(type.toLowerCase()))
          )
        ) {
          validFiles.push({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            status: "error",
            progress: 0,
            error: "Unsupported file type",
          });
          continue;
        }

        validFiles.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          status: "pending",
          progress: 0,
        });
      }

      const updated = [...files, ...validFiles];
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, maxFiles, maxSizeMB, acceptedTypes, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const updated = files.filter((f) => f.id !== id);
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, onFilesChange]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    onFilesChange?.([]);
  }, [onFilesChange]);

  const moveFile = useCallback(
    (fromIndex: number, toIndex: number) => {
      const updated = [...files];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      setFiles(updated);
      onFilesChange?.(updated);
    },
    [files, onFilesChange]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  return {
    files,
    isDragging,
    addFiles,
    removeFile,
    clearFiles,
    moveFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    hasFiles: files.length > 0,
    validFiles: files.filter((f) => f.status !== "error"),
  };
}
