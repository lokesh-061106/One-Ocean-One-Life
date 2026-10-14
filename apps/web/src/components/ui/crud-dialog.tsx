"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface Field {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "date";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: Field[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  mode: "add" | "edit";
}

function buildFormData(mode: "add" | "edit", initialData: Record<string, any> | undefined, fields: Field[]): Record<string, any> {
  if (mode === "edit" && initialData) return { ...initialData };
  const blank: Record<string, any> = {};
  fields.forEach(f => { blank[f.key] = f.type === "number" ? 0 : ""; });
  return blank;
}

export function CrudDialog({ open, onOpenChange, title, description, fields, initialData, onSave, mode }: CrudDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => buildFormData(mode, initialData, fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevConfig, setPrevConfig] = useState({ open, mode, initialData, fields });

  if (
    prevConfig.open !== open ||
    prevConfig.mode !== mode ||
    prevConfig.initialData !== initialData ||
    prevConfig.fields !== fields
  ) {
    setPrevConfig({ open, mode, initialData, fields });
    if (open) {
      setFormData(buildFormData(mode, initialData, fields));
      setErrors({});
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      if (f.required) {
        const val = formData[f.key];
        if (val === undefined || val === null || val === "") errs[f.key] = `${f.label} is required.`;
        if (f.type === "number" && (val === 0 || val === "")) errs[f.key] = `${f.label} must be greater than 0.`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New" : "Edit"} {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}{field.required ? " *" : ""}</Label>
              {field.type === "textarea" ? (
                <Textarea id={field.key} placeholder={field.placeholder} rows={3} value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className={errors[field.key] ? "border-ocean-danger" : ""} />
              ) : field.type === "select" ? (
                <Select value={String(formData[field.key] || "")} onValueChange={val => setFormData({ ...formData, [field.key]: val })}>
                  <SelectTrigger className={errors[field.key] ? "border-ocean-danger" : ""}><SelectValue placeholder={field.placeholder || `Select ${field.label}`} /></SelectTrigger>
                  <SelectContent>{field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              ) : field.type === "number" ? (
                <Input id={field.key} type="number" placeholder={field.placeholder} value={formData[field.key] ?? ""} onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })} className={errors[field.key] ? "border-ocean-danger" : ""} />
              ) : (
                <Input id={field.key} type={field.type} placeholder={field.placeholder} value={formData[field.key] || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className={errors[field.key] ? "border-ocean-danger" : ""} />
              )}
              {errors[field.key] && <p className="text-xs text-ocean-danger">{errors[field.key]}</p>}
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === "add" ? "Add" : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
