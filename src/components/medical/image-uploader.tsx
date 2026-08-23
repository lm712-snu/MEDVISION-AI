'use client';

import { useCallback, useState } from 'react';
import { Upload, FileImage, Loader2, ImagePlus } from 'lucide-react';
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
      if (e.target.files) uploadFiles(e.target.files);
    },
    [uploadFiles]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-5">
      <div
        className={`upload-zone relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'drag-over border-primary/60 bg-primary/5'
            : 'border-border/60 hover:border-primary/40 hover:bg-primary/[0.02]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
          <div className="flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              dragOver ? 'bg-primary/20 glow-subtle' : 'bg-muted/40'
            }`}
            >
              <ImagePlus className={`h-7 w-7 transition-colors duration-300 ${
                dragOver ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Drop MRI scans here, or{' '}
                <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPEG, WebP — multiple files supported
              </p>
            </div>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:glow-subtle"
            >
              <div className="aspect-square relative bg-muted/30">
                <Image
                  src={`/uploads/${img.fileKey}`}
                  alt={img.fileName}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="p-2.5 bg-card/80">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileImage className="h-3 w-3 flex-shrink-0 text-primary/60" />
                  <span className="text-xs truncate" title={img.fileName}>
                    {img.fileName}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/60">{formatSize(img.fileSize)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
