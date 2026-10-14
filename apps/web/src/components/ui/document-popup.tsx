"use client";

import { FileText, X } from "lucide-react";
import { DocumentViewer, type ViewerDoc } from "@/components/ui/document-viewer";

export interface PopupDoc extends ViewerDoc {
  file_size?: number | null;
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentPopup({ doc, onClose }: { doc: PopupDoc; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={`Document viewer: ${doc.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-ocean-border bg-ocean-foam">
          <div className="min-w-0 flex items-center gap-2">
            <FileText className="h-5 w-5 text-ocean-blue shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-ocean-navy truncate">{doc.name}</p>
              <p className="text-xs text-ocean-muted">
                {doc.file_type.toUpperCase()} · {formatFileSize(doc.file_size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document viewer"
            className="shrink-0 rounded-full p-2 hover:bg-ocean-border/60 transition-colors"
          >
            <X className="h-5 w-5 text-ocean-navy" />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-ocean-navy/5">
          <DocumentViewer doc={doc} />
        </div>
      </div>
    </div>
  );
}
