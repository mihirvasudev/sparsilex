"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  onLoadSample?: () => void;
}

export function UploadZone({ onUpload, isLoading, onLoadSample }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  return (
    <div
      className={`flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.xlsx"
        className="hidden"
        onChange={handleChange}
      />
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl text-muted-foreground/40">&#8613;</div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop your data file here</p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV, TSV, or Excel — or click to browse
            </p>
          </div>
          <button
            className="mt-2 text-xs text-primary hover:underline"
            onClick={(e) => { e.stopPropagation(); onLoadSample?.(); }}
          >
            Try with sample data
          </button>
        </div>
      )}
    </div>
  );
}
