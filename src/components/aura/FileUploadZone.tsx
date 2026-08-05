import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, File, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxSizeMb?: number;
  allowedExtensions?: string[];
  disabled?: boolean;
}

export function FileUploadZone({
  files,
  onFilesChange,
  maxSizeMb = 50,
  allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mp3", ".pdf"],
  disabled = false,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  function validateAndAddFiles(newFiles: FileList | File[]) {
    setErrorMessage(null);
    const valid: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedExtensions.includes(ext)) {
        setErrorMessage(`'${file.name}' desteklenmeyen dosya türü. İzin verilenler: ${allowedExtensions.join(", ")}`);
        return;
      }

      if (file.size > maxSizeBytes) {
        setErrorMessage(`'${file.name}' dosya boyutu çok büyük. Maksimum limit: ${maxSizeMb}MB`);
        return;
      }

      valid.push(file);
    }

    onFilesChange([...files, ...valid]);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || !e.dataTransfer.files) return;
    validateAndAddFiles(e.dataTransfer.files);
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            !disabled && fileInputRef.current?.click();
          }
        }}
        role="button"
        aria-label="Dosya yükleme alanı"
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border bg-background/40 hover:border-foreground/40 hover:bg-background/60",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedExtensions.join(",")}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
          <UploadCloud className="h-6 w-6" />
        </div>

        <p className="mt-3 text-[13px] font-medium text-foreground">
          Fotoğraf, Video veya Belge Sürükleyin
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Görsel (JPG, PNG, WEBP), Video (MP4, MP3) veya Belge (PDF) · Maksimum {maxSizeMb}MB
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[12px] text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            Seçilen Dosyalar ({files.length})
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {files.map((f, index) => (
              <div
                key={`${f.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-[12px]"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <File className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate font-medium">{f.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    ({formatFileSize(f.size)})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    title="Kaldır"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
