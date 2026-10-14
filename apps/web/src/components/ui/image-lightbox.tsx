"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  caption?: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const open = index !== null && images.length > 0;
  const current = open ? images[index as number] : null;
  const total = images.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && total > 1) onNavigate(((index as number) + 1) % total);
      else if (e.key === "ArrowLeft" && total > 1) onNavigate(((index as number) - 1 + total) % total);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, index, total, onClose, onNavigate]);

  if (!images.length) return null;

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={open ? onClose : undefined}
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300 ease-out",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-6xl px-4 transition-transform duration-300 ease-out",
          open ? "scale-100" : "scale-95"
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-12 right-4 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
        >
          <X className="h-6 w-6" />
        </button>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => onNavigate(((index as number) - 1 + total) % total)}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => onNavigate(((index as number) + 1) % total)}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white/80 transition-all hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        <div className="flex flex-col items-center gap-4">
          {current && (
            <img
              key={index}
              src={current.src}
              alt={current.caption || "Education post image"}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl animate-fade-in"
            />
          )}
          <div className="flex w-full items-center justify-between gap-4 text-white">
            <p className="text-sm text-white/85">{current?.caption}</p>
            {total > 1 && (
              <span className="text-sm tabular-nums text-white/60">
                {(index as number) + 1} / {total}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
