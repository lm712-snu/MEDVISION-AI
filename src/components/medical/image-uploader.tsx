'use client';

import { useCallback, useState } from 'react';
import { Upload, FileImage, Loader2, ImagePlus, X } from 'lucide-react';

interface ImageUploaderProps {
  caseId: string;
  images: { id: string; fileName: string; fileKey: string; mimeType: string; fileSize: number; dataUrl?: string }[];
  onUploadComplete: () => void;
}

export function ImageUploader({ caseId, images, onUploadComplete }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const formatSize = (bytes: number) => { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; };

  return (
    <div className="space-y-4">
      <div
        className={`upload-zone-pattern relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
          dragOver ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30 hover:bg-primary/[0.02]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" accept="image/*" multiple className="hidden" />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? 'bg-primary/15' : 'bg-secondary'}`}>
              <ImagePlus className={`h-5 w-5 transition-colors ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <p className="text-sm font-medium">
              Drop scan images here, or <span className="text-primary">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPEG, WebP — multiple files supported</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border warm-card-hover bg-card">
              <div className="aspect-square relative bg-muted/30 flex items-center justify-center">
                {img.dataUrl ? (
                  <img src={img.dataUrl} alt={img.fileName} className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileImage className="h-3 w-3 flex-shrink-0 text-primary/60" />
                  <span className="text-xs truncate text-foreground/80">{img.fileName}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{formatSize(img.fileSize)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
