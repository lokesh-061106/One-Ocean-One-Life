"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-context";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  village?: string;
  role?: string;
  password?: string;
}

const roles = [
  { value: "FISHERMAN", label: "Fisherman" },
  { value: "RESEARCHER", label: "Researcher" },
  { value: "EDUCATOR", label: "Educator" },
  { value: "COMMUNITY_ORGANIZATION", label: "Community Leader" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "COMMUNITY_MEMBER", label: "Other" },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", village: "", role: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { register } = useAuth();
  const router = useRouter();

  const validate = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (value.trim().length < 2) return "First name must be at least 2 characters.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "First name must contain only letters.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (value.trim().length < 2) return "Last name must be at least 2 characters.";
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return "Last name must contain only letters.";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required.";
        if (!/^(\+91[\-\s]?)?[6-9]\d{9}$/.test(value.replace(/[\s\-]/g, ""))) return "Enter a valid Indian phone (e.g. +919876543210).";
        return "";
      case "village":
        if (!value.trim()) return "Village / Location is required.";
        if (value.trim().length < 2) return "Please enter a valid location.";
        return "";
      case "role":
        if (!value) return "Please select your role.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (value.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter.";
        if (!/[a-z]/.test(value)) return "Must contain at least one lowercase letter.";
        if (!/[0-9]/.test(value)) return "Must contain at least one number.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
    if (serverError) setServerError("");
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, form[field as keyof typeof form]) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const allErrors: FormErrors = {};
    let hasError = false;
    for (const field of ["firstName", "lastName", "email", "phone", "village", "role", "password"]) {
      const err = validate(field, form[field as keyof typeof form]);
      if (err) { allErrors[field as keyof FormErrors] = err; hasError = true; }
    }
    setErrors(allErrors);
    setTouched({ firstName: true, lastName: true, email: true, phone: true, village: true, role: true, password: true });
    if (hasError) return;

    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.ok) {
      router.push("/");
    } else {
      setServerError(result.error || "Registration failed. Please try again.");
    }
  };

  const inputClass = (field: string) => `pl-10 ${errors[field as keyof FormErrors] && touched[field] ? "border-ocean-danger focus:ring-ocean-danger" : ""}`;

  return (
    <div className="min-h-screen bg-ocean-foam flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/o3l-logo.png" alt="O3L" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-ocean-navy mt-4">Join O3L</h1>
          <p className="text-ocean-text-secondary">Create your account to start contributing.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {serverError && (
                <div className="text-sm text-ocean-danger bg-ocean-danger/10 border border-ocean-danger/20 px-4 py-3 rounded-lg">{serverError}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                    <Input id="firstName" placeholder="Arumugam" className={inputClass("firstName")} value={form.firstName} onChange={e => handleChange("firstName", e.target.value)} onBlur={() => handleBlur("firstName")} />
                  </div>
                  {errors.firstName && touched.firstName && <p className="text-xs text-ocean-danger">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="Kumar" className={errors.lastName && touched.lastName ? "border-ocean-danger focus:ring-ocean-danger" : ""} value={form.lastName} onChange={e => handleChange("lastName", e.target.value)} onBlur={() => handleBlur("lastName")} />
                  {errors.lastName && touched.lastName && <p className="text-xs text-ocean-danger">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input id="email" type="email" placeholder="you@example.com" className={inputClass("email")} value={form.email} onChange={e => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} />
                </div>
                {errors.email && touched.email && <p className="text-xs text-ocean-danger">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input id="phone" placeholder="+91-9876543210" className={inputClass("phone")} value={form.phone} onChange={e => handleChange("phone", e.target.value)} onBlur={() => handleBlur("phone")} />
                </div>
                {errors.phone && touched.phone && <p className="text-xs text-ocean-danger">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="village">Village / Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input id="village" placeholder="Nagapattinam" className={inputClass("village")} value={form.village} onChange={e => handleChange("village", e.target.value)} onBlur={() => handleBlur("village")} />
                </div>
                {errors.village && touched.village && <p className="text-xs text-ocean-danger">{errors.village}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">I am a... *</Label>
                <Select value={form.role} onValueChange={value => { handleChange("role", value); handleBlur("role"); }}>
                  <SelectTrigger className={errors.role && touched.role ? "border-ocean-danger focus:ring-ocean-danger" : ""}><SelectValue placeholder="Select your role" /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.role && touched.role && <p className="text-xs text-ocean-danger">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className={`pl-10 pr-10 ${errors.password && touched.password ? "border-ocean-danger focus:ring-ocean-danger" : ""}`} value={form.password} onChange={e => handleChange("password", e.target.value)} onBlur={() => handleBlur("password")} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ocean-muted hover:text-ocean-blue">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && touched.password && <p className="text-xs text-ocean-danger">{errors.password}</p>}
                <div className="flex gap-2 mt-1">
                  {[{ label: "8+ chars", test: form.password.length >= 8 }, { label: "A-Z", test: /[A-Z]/.test(form.password) }, { label: "a-z", test: /[a-z]/.test(form.password) }, { label: "0-9", test: /[0-9]/.test(form.password) }].map(p => (
                    <span key={p.label} className={`text-xs px-2 py-0.5 rounded-full ${p.test ? "bg-ocean-green/10 text-ocean-green" : "bg-ocean-light text-ocean-muted"}`}>{p.label}</span>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-ocean-text-secondary">
                Already have an account?{" "}
                <Link href="/login" className="text-ocean-blue hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
