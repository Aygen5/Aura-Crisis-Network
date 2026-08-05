import { useState } from "react";
import { FileText, Film, Image as ImageIcon, Download, ExternalLink, X, Music } from "lucide-react";
import type { ReportAttachmentDto } from "@/lib/api-client";

const API_HOST = "http://localhost:5000";

interface AttachmentGalleryProps {
  attachments?: ReportAttachmentDto[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<ReportAttachmentDto | null>(null);

  if (!attachments || attachments.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 bg-background/30 p-4 text-center text-[12px] text-muted-foreground">
        Bu ihbara eklenmiş herhangi bir medya veya belge bulunmuyor.
      </div>
    );
  }

  function getFullUrl(url: string) {
    if (url.startsWith("http")) return url;
    return `${API_HOST}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImage(contentType: string, fileName: string) {
    return contentType.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  }

  function isVideo(contentType: string, fileName: string) {
    return contentType.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(fileName);
  }

  function isAudio(contentType: string, fileName: string) {
    return contentType.startsWith("audio/") || /\.(mp3|wav|ogg)$/i.test(fileName);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
        {attachments.map((att) => {
          const fullUrl = getFullUrl(att.fileUrl);
          const img = isImage(att.contentType, att.fileName);
          const vid = isVideo(att.contentType, att.fileName);
          const aud = isAudio(att.contentType, att.fileName);

          return (
            <div
              key={att.id}
              onClick={() => (img || vid) && setSelectedMedia(att)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-2.5 transition-all duration-200 hover:border-ring hover:bg-secondary/60 cursor-pointer"
            >
              {img ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-background">
                  <img
                    src={fullUrl}
                    alt={att.fileName}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-foreground backdrop-blur-md">
                    <ImageIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              ) : vid ? (
                <div className="relative aspect-video w-full flex items-center justify-center rounded-lg bg-background/80 text-primary">
                  <Film className="h-8 w-8" />
                  <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-background/80 text-foreground backdrop-blur-md">
                    <Film className="h-3.5 w-3.5" />
                  </span>
                </div>
              ) : aud ? (
                <div className="relative aspect-video w-full flex items-center justify-center rounded-lg bg-background/80 text-purple-400">
                  <Music className="h-8 w-8" />
                </div>
              ) : (
                <div className="relative aspect-video w-full flex items-center justify-center rounded-lg bg-background/80 text-sky-400">
                  <FileText className="h-8 w-8" />
                </div>
              )}

              <div className="mt-2 min-w-0">
                <p className="truncate text-[12px] font-medium text-foreground">{att.fileName}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatFileSize(att.fileSizeBytes)}</p>
              </div>

              {!img && !vid && (
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-2 flex items-center justify-center gap-1 rounded-md border border-border bg-secondary py-1 text-[11px] font-medium text-foreground hover:bg-secondary/80"
                >
                  <Download className="h-3 w-3" /> İndir
                </a>
              )}
            </div>
          );
        })}
      </div>

      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl animate-fade-in">
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="truncate text-[14px] font-semibold">{selectedMedia.fileName}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {formatFileSize(selectedMedia.fileSizeBytes)} · {new Date(selectedMedia.uploadedAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getFullUrl(selectedMedia.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                  title="Yeni sekmede aç"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex max-h-[75vh] items-center justify-center overflow-auto rounded-xl bg-background/60 p-2">
              {isImage(selectedMedia.contentType, selectedMedia.fileName) ? (
                <img
                  src={getFullUrl(selectedMedia.fileUrl)}
                  alt={selectedMedia.fileName}
                  className="max-h-[70vh] w-auto rounded-lg object-contain"
                />
              ) : isVideo(selectedMedia.contentType, selectedMedia.fileName) ? (
                <video
                  src={getFullUrl(selectedMedia.fileUrl)}
                  controls
                  autoPlay
                  className="max-h-[70vh] w-full rounded-lg"
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Önizleme desteklenmiyor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
