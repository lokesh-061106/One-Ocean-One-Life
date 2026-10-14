"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { mediaUrl } from "@/lib/api-helpers";

export interface ViewerDoc {
  document: string;
  name: string;
  file_type: string;
}

const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];
const SHEET_EXTS = ["xls", "xlsx", "xlsm", "xlsb", "csv", "ods"];
const TEXT_EXTS = ["txt", "csv", "rtf"];

type ViewerState =
  | { status: "loading" }
  | { status: "frame" }
  | { status: "image" }
  | { status: "html"; html: string }
  | { status: "sheets"; sheets: { name: string; html: string }[] }
  | { status: "text"; text: string }
  | { status: "error"; message: string };

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

export function DocumentViewer({ doc }: { doc: ViewerDoc }) {
  const [state, setState] = useState<ViewerState>({ status: "loading" });
  const ext = (doc.file_type || "").toLowerCase();
  const url = mediaUrl(doc.document);

  useEffect(() => {
    let cancelled = false;
    const set = (next: ViewerState) => {
      if (!cancelled) setState(next);
    };

    async function load() {
      set({ status: "loading" });
      try {
        if (ext === "pdf") {
          set({ status: "frame" });
          return;
        }
        if (IMAGE_EXTS.includes(ext)) {
          set({ status: "image" });
          return;
        }
        if (ext === "docx") {
          const [{ default: mammoth }, buffer] = await Promise.all([
            import("mammoth/mammoth.browser"),
            fetchBuffer(url),
          ]);
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          set({ status: "html", html: result.value });
          return;
        }
        if (SHEET_EXTS.includes(ext)) {
          const XLSX = await import("xlsx");
          const buffer = await fetchBuffer(url);
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheets = workbook.SheetNames.map((name) => ({
            name,
            html: XLSX.utils.sheet_to_html(workbook.Sheets[name]),
          }));
          set({ status: "sheets", sheets });
          return;
        }
        if (TEXT_EXTS.includes(ext)) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const text = await res.text();
          set({ status: "text", text });
          return;
        }
        set({
          status: "error",
          message: `In-browser preview is not available for .${ext} files. Supported for preview: PDF, Word (docx), Excel (xls/xlsx/csv), images and text files.`,
        });
      } catch {
        set({
          status: "error",
          message: "Could not load this document. Check your connection and try again.",
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, ext]);

  switch (state.status) {
    case "loading":
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-ocean-text-secondary">
          <Loader2 className="h-8 w-8 animate-spin text-ocean-blue mb-3" />
          <p className="text-sm">Opening document…</p>
        </div>
      );
    case "frame":
      return <iframe src={url} title={doc.name} className="w-full h-full bg-white" />;
    case "image":
      return (
        <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
          <img src={url} alt={doc.name} className="max-w-full max-h-full object-contain" />
        </div>
      );
    case "text":
      return (
        <div className="w-full h-full overflow-auto bg-white">
          <pre className="p-6 text-sm whitespace-pre-wrap text-ocean-navy font-mono">{state.text}</pre>
        </div>
      );
    case "html":
      return (
        <div className="w-full h-full overflow-auto bg-white">
          <div
            className="rich-content p-6 text-sm text-ocean-navy"
            dangerouslySetInnerHTML={{ __html: state.html }}
          />
        </div>
      );
    case "sheets":
      return (
        <div className="w-full h-full overflow-auto bg-white p-6 space-y-8">
          {state.sheets.map((sheet) => (
            <div key={sheet.name}>
              <div className="flex items-center gap-2 mb-3">
                <FileSpreadsheet className="h-4 w-4 text-ocean-green" />
                <h4 className="font-semibold text-ocean-navy">{sheet.name}</h4>
              </div>
              <div className="rich-content overflow-x-auto" dangerouslySetInnerHTML={{ __html: sheet.html }} />
            </div>
          ))}
        </div>
      );
    case "error":
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
          <div className="rounded-full bg-ocean-warning/10 p-4 mb-4">
            <AlertTriangle className="h-10 w-10 text-ocean-warning" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-ocean-blue" />
            <p className="font-medium text-ocean-navy">{doc.name}</p>
          </div>
          <p className="text-sm text-ocean-text-secondary max-w-md">{state.message}</p>
        </div>
      );
    default:
      return null;
  }
}
