'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface ImageUploaderProps {
  caseId: string;
  images: { id: string; fileName: string; fileKey: string; mimeType: string; fileSize: number }[];
  onUploadComplete: () => void;
}

export function ImageUploader({ caseId, images, onUploadComplete }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!files || files.length === 0) return;
      setIsUploading(true);
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });

        const res = await fetch(`/api/cases/${caseId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        onUploadComplete();
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setIsUploading(false);
      }
    },
    [caseId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        uploadFiles(e.target.files);
      }
    },
    [uploadFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop MRI scan images here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports PNG, JPEG, WebP. Upload multiple slices or views.
            </p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden group">
              <CardContent className="p-0 relative">
                <div className="aspect-square relative bg-muted">
                  <Image
                    src={`/uploads/${img.fileKey}`}
                    alt={img.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileImage className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="text-xs truncate" title={img.fileName}>
                      {img.fileName}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatSize(img.fileSize)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
