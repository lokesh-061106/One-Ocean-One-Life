"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  Loader2,
  Music,
  Search,
  Waves,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DocumentPopup, formatFileSize, type PopupDoc } from "@/components/ui/document-popup";
import { ImageLightbox, type LightboxImage } from "@/components/ui/image-lightbox";
import {
  fetchSoundLibrary,
  mediaUrl,
  soundLibraryDoc,
  type ApiSoundLibraryCategory,
  type ApiSoundLibraryItem,
} from "@/lib/api-helpers";

function collectItems(category: ApiSoundLibraryCategory): ApiSoundLibraryItem[] {
  const items = [...category.items];
  for (const child of category.children) items.push(...collectItems(child));
  return items;
}

function findCategory(
  categories: ApiSoundLibraryCategory[],
  slug: string | null
): ApiSoundLibraryCategory | null {
  if (!slug) return null;
  for (const category of categories) {
    if (category.slug === slug) return category;
    const match = findCategory(category.children, slug);
    if (match) return match;
  }
  return null;
}

export function SoundLibrary() {
  const [categories, setCategories] = useState<ApiSoundLibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [groupSlug, setGroupSlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openDoc, setOpenDoc] = useState<PopupDoc | null>(null);
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSoundLibrary().then((data) => {
      if (cancelled) return;
      setCategories(data);
      setActiveSlug(data[0]?.slug ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openDoc && !lightbox) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDoc(null);
        setLightbox(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openDoc, lightbox]);

  const active = useMemo(() => findCategory(categories, activeSlug), [categories, activeSlug]);
  const group = useMemo(() => findCategory(categories, groupSlug), [categories, groupSlug]);

  const items = useMemo(() => {
    if (!active) return [];
    const base = group ? collectItems(group) : collectItems(active);
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? base.filter((item) => item.name.toLowerCase().includes(needle))
      : base;
    return [...filtered].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [active, group, query]);

  const [prevItems, setPrevItems] = useState<typeof items | undefined>(undefined);

  if (items !== prevItems) {
    setPrevItems(items);
    setSelectedSlug((current) => (current && items.some((item) => item.slug === current) ? current : items[0]?.slug ?? null));
  }

  const selected = items.find((item) => item.slug === selectedSlug) ?? null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ocean-text-secondary">
        <Loader2 className="h-8 w-8 animate-spin text-ocean-blue mb-3" />
        <p className="text-sm">Loading sound library…</p>
      </div>
    );
  }

  if (!categories.length) {
    return <p className="py-16 text-center text-ocean-text-secondary">No sound library content yet.</p>;
  }

  const selectedCategory = selected ? findCategory(categories, selected.category_slug) : null;
  const referenceDocs = [
    selectedCategory && soundLibraryDoc(selectedCategory.document_url, selectedCategory.document_name, selectedCategory.document_type, selectedCategory.document_size),
    group && soundLibraryDoc(group.document_url, group.document_name, group.document_type, group.document_size),
    active && soundLibraryDoc(active.document_url, active.document_name, active.document_type, active.document_size),
    selected && soundLibraryDoc(selected.document_url, selected.document_name, selected.document_type, selected.document_size),
  ].filter((doc): doc is PopupDoc => Boolean(doc));
  const seenDocs = new Set<string>();
  const references = referenceDocs.filter((doc) => {
    if (seenDocs.has(doc.document)) return false;
    seenDocs.add(doc.document);
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Categories */}
      <div className="lg:col-span-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sounds…"
            className="w-full rounded-lg border border-ocean-border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-blue/40"
          />
        </div>

        <div className="space-y-2">
          {categories.map((category) => {
            const isActive = category.slug === activeSlug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => {
                  setActiveSlug(category.slug);
                  setGroupSlug(null);
                }}
                className={`w-full text-left rounded-xl border p-4 transition-colors ${
                  isActive
                    ? "border-ocean-blue bg-ocean-blue/10 shadow-sm"
                    : "border-ocean-border bg-white hover:border-ocean-blue/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-semibold text-ocean-navy text-sm leading-snug">{category.name}</span>
                </div>
                <span className="mt-1 block text-xs text-ocean-muted">{category.item_count} sounds</span>
              </button>
            );
          })}
        </div>

        {active && active.children.length > 0 && (
          <div className="rounded-xl border border-ocean-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-muted mb-2">Groups</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroupSlug(null)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !groupSlug ? "bg-ocean-blue text-white" : "bg-ocean-light text-ocean-text-secondary hover:bg-ocean-blue/15"
                }`}
              >
                All ({active.item_count})
              </button>
              {active.children.map((child) => (
                <button
                  key={child.slug}
                  type="button"
                  onClick={() => setGroupSlug(child.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    groupSlug === child.slug
                      ? "bg-ocean-blue text-white"
                      : "bg-ocean-light text-ocean-text-secondary hover:bg-ocean-blue/15"
                  }`}
                >
                  {child.name.replace(/\s*\(.*\)$/, "")} ({child.item_count})
                </button>
              ))}
            </div>
          </div>
        )}

        {active?.description && (
          <div className="rounded-xl border border-ocean-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ocean-muted mb-1">About</p>
            <p className="text-sm text-ocean-text-secondary leading-relaxed">{active.description}</p>
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music className="h-4 w-4 text-ocean-blue" />
                {group?.name ?? active?.name}
              </span>
              <span className="text-sm font-normal text-ocean-muted">{items.length} sounds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto divide-y divide-ocean-border">
            {items.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setSelectedSlug(item.slug)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  item.slug === selectedSlug ? "bg-ocean-blue/10" : "hover:bg-ocean-foam"
                }`}
              >
                <span className="shrink-0 h-12 w-16 rounded-lg overflow-hidden bg-ocean-light flex items-center justify-center">
                  {item.photo_url ? (
                    <img src={mediaUrl(item.photo_url)} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Waves className="h-5 w-5 text-ocean-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ocean-navy text-sm truncate">{item.name}</span>
                  <span className="block text-xs text-ocean-muted truncate">{item.category_name}</span>
                </span>
                {item.document_url && <FileText className="h-4 w-4 shrink-0 text-ocean-blue/70" />}
              </button>
            ))}
            {!items.length && (
              <p className="px-4 py-8 text-center text-sm text-ocean-muted">No sounds match your search.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail */}
      <div className="lg:col-span-5 space-y-4">
        {selected ? (
          <Card className="border-2 border-ocean-blue">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {selected.name}
                <Badge variant="secondary" className="ml-auto">{selected.category_name}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <figure className="space-y-1">
                  <figcaption className="text-xs font-semibold uppercase tracking-wide text-ocean-muted">Photo</figcaption>
                  {selected.photo_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox({ images: [{ src: mediaUrl(selected.photo_url!), caption: selected.name }], index: 0 })
                      }
                      className="block w-full overflow-hidden rounded-lg border border-ocean-border hover:opacity-90"
                    >
                      <img src={mediaUrl(selected.photo_url)} alt={selected.name} className="w-full h-40 object-cover" />
                    </button>
                  ) : (
                    <div className="h-40 rounded-lg bg-ocean-light flex items-center justify-center text-xs text-ocean-muted">No photo</div>
                  )}
                </figure>
                <figure className="space-y-1">
                  <figcaption className="text-xs font-semibold uppercase tracking-wide text-ocean-muted">Spectrogram</figcaption>
                  {selected.spectrogram_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightbox({
                          images: [{ src: mediaUrl(selected.spectrogram_url!), caption: `${selected.name} — spectrogram` }],
                          index: 0,
                        })
                      }
                      className="block w-full overflow-hidden rounded-lg border border-ocean-border hover:opacity-90"
                    >
                      <img
                        src={mediaUrl(selected.spectrogram_url)}
                        alt={`${selected.name} spectrogram`}
                        className="w-full h-40 object-contain bg-white"
                      />
                    </button>
                  ) : (
                    <div className="h-40 rounded-lg bg-ocean-light flex items-center justify-center text-xs text-ocean-muted">
                      No spectrogram
                    </div>
                  )}
                </figure>
              </div>

              {selected.audio_url && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-muted mb-1">Audio</p>
                  <audio controls preload="none" src={mediaUrl(selected.audio_url)} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {selected.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ocean-muted mb-1">Description</p>
                  <p className="text-sm text-ocean-text-secondary leading-relaxed whitespace-pre-line">
                    {selected.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ocean-border">
                <span className="text-xs text-ocean-muted flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Source: {selected.source}
                </span>
                {references.map((doc) => (
                  <button
                    key={`${doc.document}-${doc.name}`}
                    type="button"
                    onClick={() => setOpenDoc(doc)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ocean-blue/40 bg-ocean-blue/5 px-3 py-1 text-xs font-medium text-ocean-blue hover:bg-ocean-blue/15 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {doc.name}
                    {doc.file_size ? ` · ${formatFileSize(doc.file_size)}` : ""}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-ocean-text-secondary">
              <Music className="h-10 w-10 mx-auto mb-3 text-ocean-muted" />
              <p className="text-sm">Select a sound to listen and explore.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}

      {openDoc && <DocumentPopup doc={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  );
}
