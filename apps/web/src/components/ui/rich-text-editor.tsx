"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link2, ImagePlus, Heading2, Heading3, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("o3l_access_token");
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  error?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = 160, error }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && !initialized) {
      editorRef.current.innerHTML = value || "";
      setInitialized(true);
    }
  }, [value, initialized]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const applyHeading = (level: "p" | "h2" | "h3") => {
    exec("formatBlock", level);
  };

  const insertLink = () => {
    const url = window.prompt("Enter link URL:");
    if (!url) return;
    if (/^\s*javascript:/i.test(url)) return;
    exec("createLink", url);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const headers: Record<string, string> = {};
      const token = getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API}/media/upload/`, { method: "POST", headers, body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = (data.url || "").replace(/^https?:\/\/[^/]+/, "");
      editorRef.current?.focus();
      document.execCommand("insertImage", false, url);
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } catch {
      window.alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          uploadImage(file);
        }
      }
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${error ? "border-ocean-danger" : "border-ocean-border"}`}>
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 bg-ocean-light/50 border-b border-ocean-border">
        <select
          aria-label="Text style"
          onChange={(e) => applyHeading(e.target.value as "p" | "h2" | "h3")}
          className="h-8 text-xs rounded border border-ocean-border bg-white px-1.5 text-ocean-navy"
          defaultValue="p"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <div className="w-px h-5 bg-ocean-border mx-1" />
        <button type="button" title="Bold" onClick={() => exec("bold")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm font-bold text-ocean-navy"><Bold className="h-4 w-4 mx-auto" /></button>
        <button type="button" title="Italic" onClick={() => exec("italic")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy"><Italic className="h-4 w-4 mx-auto" /></button>
        <button type="button" title="Underline" onClick={() => exec("underline")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy"><Underline className="h-4 w-4 mx-auto" /></button>
        <div className="w-px h-5 bg-ocean-border mx-1" />
        <button type="button" title="Bullet list" onClick={() => exec("insertUnorderedList")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy"><List className="h-4 w-4 mx-auto" /></button>
        <button type="button" title="Numbered list" onClick={() => exec("insertOrderedList")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy"><ListOrdered className="h-4 w-4 mx-auto" /></button>
        <div className="w-px h-5 bg-ocean-border mx-1" />
        <button type="button" title="Insert link" onClick={insertLink} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy"><Link2 className="h-4 w-4 mx-auto" /></button>
        <button
          type="button"
          title="Upload image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 mx-auto animate-spin" /> : <ImagePlus className="h-4 w-4 mx-auto" />}
        </button>
        <button type="button" title="Heading" onClick={() => applyHeading("h2")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm font-semibold text-ocean-navy"><Heading2 className="h-4 w-4 mx-auto" /></button>
        <button type="button" title="Subheading" onClick={() => applyHeading("h3")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm font-semibold text-ocean-navy"><Heading3 className="h-4 w-4 mx-auto" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        onPaste={onPaste}
        data-placeholder={placeholder || "Write description..."}
        className="p-3 text-sm focus:outline-none prose prose-sm max-w-none empty:before:text-ocean-muted empty:before:content-[attr(data-placeholder)]"
        style={{ minHeight }}
      />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
    </div>
  );
}
