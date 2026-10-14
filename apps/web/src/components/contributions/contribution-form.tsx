"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, X, AlertCircle, ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { mediaUrl } from "@/lib/api-helpers";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const CONTRIBUTION_TYPE_OPTIONS = [
  { value: "observation", label: "Observation" },
  { value: "marine_sighting", label: "Sighting" },
  { value: "ocean_sound", label: "Sound" },
  { value: "education_post", label: "Education" },
  { value: "local_knowledge", label: "Guide" },
];

const TYPE_POINTS: Record<string, { submitted: number; verified: number }> = {
  observation: { submitted: 3, verified: 10 },
  marine_sighting: { submitted: 5, verified: 20 },
  ocean_sound: { submitted: 5, verified: 20 },
  education_post: { submitted: 3, verified: 10 },
  local_knowledge: { submitted: 3, verified: 15 },
};

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "heic"];
const VIDEO_EXT = ["mp4", "mov", "m4v"];
const AUDIO_EXT = ["mp3", "wav", "ogg", "m4a", "aac"];
const DOC_EXT = ["pdf", "doc", "docx"];

function extOf(name: string) {
  return (name || "").split(".").pop()?.toLowerCase() || "";
}

async function fetchList<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${API}${path}${path.includes("?") ? "&" : "?"}page_size=100`);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  } catch {
    return [];
  }
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface ContributionFormData {
  title: string;
  type: string;
  author: string;
  village: string;
  notes: string;
  description: string;
  points?: number;
  images: File[];
  video: File | null;
  audio: File | null;
  documents: File[];
  existingMedia?: { id: string; kind: string; url: string; display_name: string }[];
  removeMediaIds?: string[];
}

interface ContributionFormProps {
  mode: "add" | "edit";
  initialData?: Partial<ContributionFormData> & { id?: string };
  isAdmin?: boolean;
  defaultAuthor?: string;
  onSave: (data: ContributionFormData) => Promise<void>;
  onCancel: () => void;
}

export function ContributionForm({ mode, initialData, isAdmin, defaultAuthor, onSave, onCancel }: ContributionFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [type, setType] = useState(initialData?.type || "");
  const [author, setAuthor] = useState(initialData?.author || defaultAuthor || "");
  const [stateName, setStateName] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [villageId, setVillageId] = useState(initialData?.village || "");
  const [points, setPoints] = useState<number | "">(initialData?.points ?? "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [images, setImages] = useState<File[]>(initialData?.images || []);
  const [video, setVideo] = useState<File | null>(initialData?.video || null);
  const [audio, setAudio] = useState<File | null>(initialData?.audio || null);
  const [documents, setDocuments] = useState<File[]>(initialData?.documents || []);
  const [removeMediaIds, setRemoveMediaIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [states, setStates] = useState<{ name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string; district_name?: string; zone_name?: string }[]>([]);

  const existingMedia = initialData?.existingMedia || [];

  useEffect(() => {
    fetchList<{ name: string }>("/states/").then((s) => setStates(s || []));
  }, []);

  // Edit mode: hydrate State → District → Village from the existing village id.
  useEffect(() => {
    if (mode !== "edit" || !initialData?.village) return;
    let cancelled = false;
    (async () => {
      const v = await fetchJson<{ id: string; name: string; district: string }>(`/villages/${initialData.village}/`);
      if (!v?.district || cancelled) return;
      const allDistricts = await fetchList<{ id: string; name: string; state: string }>("/districts/");
      const match = allDistricts.find((d) => d.id === v.district);
      if (!match?.state || cancelled) return;
      setStateName(match.state);
      setDistrictId(v.district);
      setDistricts(allDistricts.filter((d) => d.state === match.state));
      setVillages(await fetchList(`/villages/?district=${v.district}`));
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, initialData?.village]);

  useEffect(() => {
    if (!stateName) return;
    let cancelled = false;
    fetchList<{ id: string; name: string }>(`/districts/?state=${encodeURIComponent(stateName)}`).then((d) => {
      if (!cancelled) setDistricts(d || []);
    });
    return () => {
      cancelled = true;
    };
  }, [stateName]);

  useEffect(() => {
    if (!districtId) {
      // No district chosen yet — load a broad village list so the dropdown is usable.
      let cancelled = false;
      fetchList<{ id: string; name: string; district_name?: string; zone_name?: string }>("/villages/?page_size=100").then((v) => {
        if (!cancelled) setVillages(v || []);
      });
      return () => {
        cancelled = true;
      };
    }
    let cancelled = false;
    fetchList<{ id: string; name: string; district_name?: string; zone_name?: string }>(`/villages/?district=${districtId}&page_size=100`).then((v) => {
      if (!cancelled) setVillages(v || []);
    });
    return () => {
      cancelled = true;
    };
  }, [districtId]);

  const typeHint = useMemo(() => {
    const p = TYPE_POINTS[type];
    if (!p) return "";
    return `Earns ~${p.submitted} pts on submit · ${p.verified} pts when verified`;
  }, [type]);

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!type) errs.type = "Type is required.";
    if (!author.trim()) errs.author = "Author is required.";
    if (!villageId) errs.village = "Village is required.";
    if (images.length > 10) errs.images = "Maximum 10 images allowed.";
    for (const f of images) {
      if (!IMAGE_EXT.includes(extOf(f.name))) errs.images = `Unsupported image type: ${f.name}`;
      if (f.size > 10 * 1024 * 1024) errs.images = `Image too large (max 10MB): ${f.name}`;
    }
    if (video && (!VIDEO_EXT.includes(extOf(video.name)) || video.size > 100 * 1024 * 1024)) {
      errs.video = "Video must be mp4/mov and under 100MB.";
    }
    if (audio && (!AUDIO_EXT.includes(extOf(audio.name)) || audio.size > 50 * 1024 * 1024)) {
      errs.audio = "Audio must be mp3/wav/ogg and under 50MB.";
    }
    for (const f of documents) {
      if (!DOC_EXT.includes(extOf(f.name))) errs.documents = `Unsupported document type: ${f.name}`;
      if (f.size > 10 * 1024 * 1024) errs.documents = `Document too large (max 10MB): ${f.name}`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, type, author, villageId, images, video, audio, documents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        author: author.trim(),
        village: villageId,
        notes,
        description,
        points: isAdmin && points !== "" ? Number(points) : undefined,
        images,
        video,
        audio,
        documents,
        existingMedia,
        removeMediaIds,
      });
    } finally {
      setSaving(false);
    }
  };

  const err = (key: string) =>
    errors[key] ? (
      <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {errors[key]}
      </p>
    ) : null;

  return (
    <Card className="border-ocean-border">
      <CardHeader className="bg-ocean-light/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-ocean-navy">{mode === "add" ? "Add New" : "Edit"} Contribution</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="c-title" className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Title<span className="text-ocean-danger ml-0.5">*</span>
              </Label>
              <Input id="c-title" placeholder="Enter contribution title" value={title} onChange={(e) => setTitle(e.target.value)} className={errors.title ? "border-ocean-danger" : ""} />
              {err("title")}
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Type<span className="text-ocean-danger ml-0.5">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className={errors.type ? "border-ocean-danger" : ""}>
                  <SelectValue placeholder="Select contribution type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRIBUTION_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeHint && <p className="text-xs text-ocean-text-secondary mt-1">{typeHint}</p>}
              {err("type")}
            </div>

            <div>
              <Label htmlFor="c-author" className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Author<span className="text-ocean-danger ml-0.5">*</span>
              </Label>
              <Input id="c-author" placeholder="Enter author name" value={author} onChange={(e) => setAuthor(e.target.value)} className={errors.author ? "border-ocean-danger" : ""} />
              {err("author")}
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">State</Label>
              <Select
                value={stateName}
                onValueChange={(v) => {
                  setStateName(v);
                  setDistrictId("");
                  setVillageId("");
                  setDistricts([]);
                  setVillages([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">District</Label>
              <Select
                value={districtId}
                onValueChange={(v) => {
                  setDistrictId(v);
                  setVillageId("");
                  setVillages([]);
                }}
                disabled={!stateName}
              >
                <SelectTrigger>
                  <SelectValue placeholder={stateName ? "Select district" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Village<span className="text-ocean-danger ml-0.5">*</span>
              </Label>
              <Select value={villageId} onValueChange={setVillageId}>
                <SelectTrigger className={errors.village ? "border-ocean-danger" : ""}>
                  <SelectValue placeholder="Select village" />
                </SelectTrigger>
                <SelectContent>
                  {villages.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.zone_name ? ` (${v.zone_name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("village")}
            </div>

            <div>
              <Label htmlFor="c-points" className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Points {isAdmin ? "" : "(auto)"}
              </Label>
              {isAdmin ? (
                <Input id="c-points" type="number" min={0} placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value === "" ? "" : Number(e.target.value))} />
              ) : (
                <Input id="c-points" disabled value={typeHint || "Calculated on submit"} className="bg-ocean-light/40 text-ocean-text-secondary" />
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Status</Label>
              <Input disabled value={mode === "edit" ? "See status badge in list" : "Pending (submitted for review)"} className="bg-ocean-light/40 text-ocean-text-secondary" />
              <p className="text-xs text-ocean-text-secondary mt-1">Contributions start as Pending. An admin approves or rejects them.</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="c-notes" className="text-sm font-medium text-ocean-navy mb-1.5 block">
                Notes
              </Label>
              <Textarea id="c-notes" rows={3} placeholder="Short description / notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Images</Label>
              <div className="flex flex-wrap gap-3">
                {existingMedia
                  .filter((m) => m.kind === "image" && !removeMediaIds.includes(m.id))
                  .map((m) => (
                    <div key={m.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-ocean-border group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mediaUrl(m.url)} alt={m.display_name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setRemoveMediaIds((prev) => [...prev, m.id])}
                        className="absolute top-1 right-1 bg-ocean-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                {images.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-ocean-border group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-ocean-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-ocean-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-ocean-blue text-ocean-text-secondary hover:text-ocean-blue">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setImages((prev) => [...prev, ...files].slice(0, 10));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {err("images")}
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Video</Label>
              {existingMedia
                .filter((m) => m.kind === "video" && !removeMediaIds.includes(m.id))
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 p-2 mb-2 rounded border border-ocean-border text-sm">
                    <a href={mediaUrl(m.url)} target="_blank" rel="noreferrer" className="text-ocean-blue hover:underline truncate">
                      {m.display_name}
                    </a>
                    <button type="button" onClick={() => setRemoveMediaIds((prev) => [...prev, m.id])} className="text-ocean-danger shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              <FilePick
                file={video}
                accept="video/*"
                label="Choose video (mp4/mov, max 100MB)"
                onPick={setVideo}
                onClear={() => setVideo(null)}
              />
              {err("video")}
            </div>

            <div>
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Audio</Label>
              {existingMedia
                .filter((m) => m.kind === "audio" && !removeMediaIds.includes(m.id))
                .map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 p-2 mb-2 rounded border border-ocean-border text-sm">
                    <a href={mediaUrl(m.url)} target="_blank" rel="noreferrer" className="text-ocean-blue hover:underline truncate">
                      {m.display_name}
                    </a>
                    <button type="button" onClick={() => setRemoveMediaIds((prev) => [...prev, m.id])} className="text-ocean-danger shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              <FilePick
                file={audio}
                accept="audio/*"
                label="Choose audio (mp3/wav, max 50MB)"
                onPick={setAudio}
                onClear={() => setAudio(null)}
              />
              {err("audio")}
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Documents</Label>
              <div className="space-y-2">
                {existingMedia
                  .filter((m) => m.kind === "document" && !removeMediaIds.includes(m.id))
                  .map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded border border-ocean-border text-sm">
                      <a href={mediaUrl(m.url)} target="_blank" rel="noreferrer" className="text-ocean-blue hover:underline truncate">
                        {m.display_name}
                      </a>
                      <button type="button" onClick={() => setRemoveMediaIds((prev) => [...prev, m.id])} className="text-ocean-danger shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                {documents.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 p-2 rounded border border-ocean-border text-sm">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => setDocuments((prev) => prev.filter((_, j) => j !== i))} className="text-ocean-danger shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded border border-dashed border-ocean-border cursor-pointer hover:border-ocean-blue text-sm text-ocean-text-secondary hover:text-ocean-blue">
                  <Upload className="h-4 w-4" />
                  Upload PDF / DOC / DOCX
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDocuments((prev) => [...prev, ...files].slice(0, 5));
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {err("documents")}
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-ocean-navy mb-1.5 block">Description</Label>
              <RichTextEditor value={description} onChange={setDescription} placeholder="Write the full description..." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? "Saving..." : mode === "add" ? "Submit Contribution" : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilePick({
  file,
  accept,
  label,
  onPick,
  onClear,
}: {
  file: File | null;
  accept: string;
  label: string;
  onPick: (f: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded border border-dashed border-ocean-border cursor-pointer hover:border-ocean-blue text-sm text-ocean-text-secondary hover:text-ocean-blue">
        <Upload className="h-4 w-4 shrink-0" />
        <span className="truncate">{file ? file.name : label}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
      </label>
      {file && (
        <Button type="button" variant="ghost" size="icon" onClick={onClear}>
          <Trash2 className="h-4 w-4 text-ocean-danger" />
        </Button>
      )}
    </div>
  );
}
