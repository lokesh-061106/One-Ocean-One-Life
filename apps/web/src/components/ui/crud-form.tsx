"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface Field {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "textarea" | "richtext" | "select" | "date";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  span?: 1 | 2;
}

interface CrudFormProps {
  title: string;
  fields: Field[];
  initialData?: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
  mode: "add" | "edit";
}

function buildFormData(mode: "add" | "edit", initialData: Record<string, any> | undefined, fields: Field[]): Record<string, any> {
  if (mode === "edit" && initialData) return { ...initialData };
  const blank: Record<string, any> = {};
  fields.forEach(f => { blank[f.key] = f.type === "number" ? 0 : ""; });
  return blank;
}

export function CrudForm({ title, fields, initialData, onSave, onCancel, mode }: CrudFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => buildFormData(mode, initialData, fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const richtextRefs = useRef<Record<string, HTMLDivElement>>({});
  const [prevConfig, setPrevConfig] = useState({ mode, initialData, fields });

  if (prevConfig.mode !== mode || prevConfig.initialData !== initialData || prevConfig.fields !== fields) {
    setPrevConfig({ mode, initialData, fields });
    setFormData(buildFormData(mode, initialData, fields));
    setErrors({});
  }

  const registerRichtext = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) richtextRefs.current[key] = el;
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      if (f.required) {
        let val = formData[f.key];
        if (f.type === "richtext" && richtextRefs.current[f.key]) {
          val = richtextRefs.current[f.key].innerHTML;
          formData[f.key] = val;
        }
        if (val === undefined || val === null || val === "") errs[f.key] = `${f.label} is required.`;
        if (f.type === "number" && val === 0) errs[f.key] = `${f.label} must be greater than 0.`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.keys(richtextRefs.current).forEach(key => {
      const el = richtextRefs.current[key];
      if (el) formData[key] = el.innerHTML;
    });
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Card className="border-ocean-border">
      <CardHeader className="bg-ocean-light/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-ocean-navy">{mode === "add" ? "Add New" : "Edit"} {title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}><X className="h-4 w-4 mr-1" />Cancel</Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(field => (
              <div key={field.key} className={field.span === 2 || field.type === "textarea" || field.type === "richtext" ? "md:col-span-2" : ""}>
                <Label htmlFor={field.key} className="text-sm font-medium text-ocean-navy mb-1.5 block">
                  {field.label}{field.required && <span className="text-ocean-danger ml-0.5">*</span>}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea id={field.key} placeholder={field.placeholder} rows={3} value={formData[field.key] || ""} onChange={e => { setFormData({ ...formData, [field.key]: e.target.value }); if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" })); }} className={errors[field.key] ? "border-ocean-danger" : ""} />
                ) : field.type === "richtext" ? (
                  <RichTextArea onRegister={registerRichtext} fieldKey={field.key} initialValue={formData[field.key] || ""} onChange={val => { setFormData({ ...formData, [field.key]: val }); if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" })); }} error={!!errors[field.key]} />
                ) : field.type === "select" ? (
                  <Select value={String(formData[field.key] || "")} onValueChange={val => { setFormData({ ...formData, [field.key]: val }); if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" })); }}>
                    <SelectTrigger className={errors[field.key] ? "border-ocean-danger" : ""}><SelectValue placeholder={field.placeholder || `Select ${field.label}`} /></SelectTrigger>
                    <SelectContent>{field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : field.type === "number" ? (
                  <Input id={field.key} type="number" placeholder={field.placeholder} value={formData[field.key] ?? ""} onChange={e => { setFormData({ ...formData, [field.key]: Number(e.target.value) }); if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" })); }} className={errors[field.key] ? "border-ocean-danger" : ""} />
                ) : (
                  <Input id={field.key} type={field.type} placeholder={field.placeholder} value={formData[field.key] || ""} onChange={e => { setFormData({ ...formData, [field.key]: e.target.value }); if (errors[field.key]) setErrors(prev => ({ ...prev, [field.key]: "" })); }} className={errors[field.key] ? "border-ocean-danger" : ""} />
                )}
                {errors[field.key] && <p className="text-xs text-ocean-danger mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors[field.key]}</p>}
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit"><Save className="h-4 w-4 mr-1.5" />{mode === "add" ? "Add" : "Save Changes"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

interface RichTextAreaProps {
  onRegister: (key: string, el: HTMLDivElement | null) => void;
  fieldKey: string;
  initialValue: string;
  onChange: (val: string) => void;
  error?: boolean;
}

function RichTextArea({ onRegister, fieldKey, initialValue, onChange, error }: RichTextAreaProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (innerRef.current && !initialized) {
      innerRef.current.innerHTML = initialValue;
      setInitialized(true);
    }
  }, [initialValue, initialized]);

  useEffect(() => {
    onRegister(fieldKey, innerRef.current);
  }, [fieldKey, onRegister]);

  return (
    <div className={`border rounded-lg overflow-hidden ${error ? "border-ocean-danger" : "border-ocean-border"}`}>
      <div className="flex items-center gap-1 px-3 py-2 bg-ocean-light/50 border-b border-ocean-border">
        {["B", "I", "U"].map(cmd => (
          <button key={cmd} type="button" onClick={() => document.execCommand(cmd)} className="w-8 h-8 rounded hover:bg-ocean-light text-sm font-bold text-ocean-navy">{cmd}</button>
        ))}
        <div className="w-px h-5 bg-ocean-border mx-1" />
        {["ul", "ol"].map(cmd => (
          <button key={cmd} type="button" onClick={() => document.execCommand(cmd === "ul" ? "insertUnorderedList" : "insertOrderedList")} className="w-8 h-8 rounded hover:bg-ocean-light text-sm text-ocean-navy">{cmd === "ul" ? "\u2022" : "1."}</button>
        ))}
      </div>
      <div ref={innerRef} contentEditable suppressContentEditableWarning className="min-h-[120px] p-3 text-sm focus:outline-none prose prose-sm max-w-none" onBlur={e => onChange(e.currentTarget.innerHTML)} />
    </div>
  );
}
