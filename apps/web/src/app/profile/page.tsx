"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  User, Calendar, Edit3, Save, Check, Phone, Mail,
  Briefcase, Globe, Shield, Truck, CreditCard, ChevronRight,
  Camera, Building2, Languages, Award
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LocationDisplay } from "@/components/location-display";
import { useProfile, type UserProfile } from "@/components/profile-context";
import { useAuth } from "@/components/auth-context";

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-48 bg-ocean-light rounded-2xl animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-ocean-light rounded-xl animate-pulse" />
          </div>
          <div className="h-48 bg-ocean-light rounded-xl animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, isComplete } = useProfile();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const mounted = useHydrated();
  const [form, setForm] = useState<UserProfile>(profile);

  // Pull the server-side identity (set at registration) into the local profile once.
  useEffect(() => {
    if (!mounted || profile.contributorType) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("o3l_access_token") : null;
    if (!token) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    fetch(`${API}/accounts/me/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p?.contributor_type) {
          updateProfile({ contributorType: p.contributor_type });
          setForm((prev) => ({ ...prev, contributorType: p.contributor_type }));
        }
      })
      .catch(() => {});
  }, [mounted, profile.contributorType, updateProfile]);

  if (!mounted) return <ProfileSkeleton />;

  const displayName = profile.firstName || user?.firstName || "User";
  const displayEmail = profile.email || user?.email || "";
  const displayPhone = profile.phone || user?.phone || "";
  const initials = `${displayName.charAt(0)}${profile.lastName ? profile.lastName.charAt(0) : ""}`.toUpperCase();

  const handleSave = () => {
    updateProfile(form);
    // Sync identity to the API so contributions pick it up as the default.
    const token = typeof window !== "undefined" ? localStorage.getItem("o3l_access_token") : null;
    if (token && form.contributorType) {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      fetch(`${API}/accounts/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contributor_type: form.contributorType }),
      }).catch(() => {});
    }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
  };

  const updateField = (key: keyof UserProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a3d5c] via-ocean-blue to-ocean-green p-8 mb-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20" />
            <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-white/10" />
          </div>
          <div className="relative flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white text-3xl font-bold ring-4 ring-white/30">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{displayName} {profile.lastName}</h1>
              <p className="text-white/70 text-sm mt-1">{displayEmail}</p>
              <div className="flex items-center gap-4 mt-3">
                {profile.village && (
                  <span className="flex items-center gap-1 text-white/80 text-sm">
                    <LocationDisplay name={profile.village} showCoords={false} size="sm" className="text-white/80" />
                  </span>
                )}
                <span className="flex items-center gap-1 text-white/80 text-sm">
                  <Calendar className="h-3.5 w-3.5" />Member since 2024
                </span>
                {isComplete && (
                  <Badge className="bg-white/20 text-white border border-white/30 text-xs">
                    <Shield className="h-3 w-3 mr-1" />Profile Complete
                  </Badge>
                )}
              </div>
            </div>
            {!editing && (
              <Button
                onClick={() => setEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {saved && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-ocean-green/10 border border-ocean-green/20 px-4 py-3 text-sm text-ocean-green">
            <Check className="h-4 w-4" />
            Profile saved successfully
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-ocean-blue" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="First Name" editing={editing}>
                    {editing ? (
                      <Input value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="First name" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.firstName || "Not set"}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Last Name" editing={editing}>
                    {editing ? (
                      <Input value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Last name" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.lastName || "Not set"}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Email" editing={editing}>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-ocean-muted flex-shrink-0" />
                      {editing ? (
                        <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email" />
                      ) : (
                        <p className="text-sm font-medium text-ocean-navy">{displayEmail || "Not set"}</p>
                      )}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Phone" editing={editing}>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-ocean-muted flex-shrink-0" />
                      {editing ? (
                        <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+91 98765 43210" />
                      ) : (
                        <p className="text-sm font-medium text-ocean-navy">{displayPhone || "Not set"}</p>
                      )}
                    </div>
                  </FieldGroup>
                  <FieldGroup label="Date of Birth" editing={editing}>
                    {editing ? (
                      <Input type="date" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.dateOfBirth || "Not set"}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Gender" editing={editing}>
                    {editing ? (
                      <select
                        value={form.gender}
                        onChange={(e) => updateField("gender", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-ocean-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy capitalize">{profile.gender || "Not set"}</p>
                    )}
                  </FieldGroup>
                </div>
                <FieldGroup label="Bio" editing={editing} full>
                  {editing ? (
                    <Textarea rows={3} value={form.bio} onChange={(e) => updateField("bio", e.target.value)} placeholder="Tell us about yourself..." />
                  ) : (
                    <p className="text-sm text-ocean-text-secondary">{profile.bio || "No bio added yet."}</p>
                  )}
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Professional Details */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-ocean-blue" />
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="I am a" editing={editing}>
                    {editing ? (
                      <select
                        value={form.contributorType}
                        onChange={(e) => updateField("contributorType", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-ocean-border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue"
                      >
                        <option value="">Select identity</option>
                        <option value="fisher">Fisherman / Fisherwoman</option>
                        <option value="researcher">Researcher</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="enthusiast">Recreational / Ocean Enthusiast</option>
                        <option value="student">Student</option>
                        <option value="organisation">Organisation / Institution</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">
                        {{ fisher: "Fisherman / Fisherwoman", researcher: "Researcher", volunteer: "Volunteer", enthusiast: "Recreational / Ocean Enthusiast", student: "Student", organisation: "Organisation / Institution" }[profile.contributorType] || profile.contributorType || "Not set"}
                      </p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Occupation" editing={editing}>
                    {editing ? (
                      <Input value={form.occupation} onChange={(e) => updateField("occupation", e.target.value)} placeholder="e.g. Fisherman, Researcher" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.occupation || "Not set"}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Organization" editing={editing}>
                    {editing ? (
                      <Input value={form.organization} onChange={(e) => updateField("organization", e.target.value)} placeholder="e.g. O3L Foundation" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.organization || "Not set"}</p>
                    )}
                  </FieldGroup>
                </div>
                <FieldGroup label="Skills" editing={editing} full>
                  {editing ? (
                    <Input value={form.skills} onChange={(e) => updateField("skills", e.target.value)} placeholder="e.g. Marine biology, Diving, First aid" />
                  ) : (
                    <p className="text-sm text-ocean-text-secondary">{profile.skills || "No skills listed."}</p>
                  )}
                </FieldGroup>
                <FieldGroup label="Languages" editing={editing} full>
                  {editing ? (
                    <Input value={form.languages} onChange={(e) => updateField("languages", e.target.value)} placeholder="e.g. Tamil, English, Hindi" />
                  ) : (
                    <p className="text-sm text-ocean-text-secondary">{profile.languages || "No languages listed."}</p>
                  )}
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Delivery Address - Critical for Cart */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5 text-ocean-blue" />
                  Delivery Address
                  {!isComplete && (
                    <Badge className="bg-ocean-warning/10 text-ocean-warning text-xs ml-2">Required for orders</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGroup label="Village / Area" editing={editing}>
                  {editing ? (
                    <Input value={form.village} onChange={(e) => updateField("village", e.target.value)} placeholder="e.g. Kovalam" />
                  ) : (
                    <p className="text-sm font-medium text-ocean-navy">{profile.village || "Not set"}</p>
                  )}
                </FieldGroup>
                <FieldGroup label="Full Address" editing={editing} full>
                  {editing ? (
                    <Textarea rows={2} value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address, landmark, nearby..." />
                  ) : (
                    <p className="text-sm font-medium text-ocean-navy">{profile.address || "Not set"}</p>
                  )}
                </FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldGroup label="City / District" editing={editing}>
                    {editing ? (
                      <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="e.g. Chennai" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.city || "Not set"}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="State" editing={editing}>
                    {editing ? (
                      <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} disabled className="bg-gray-50" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.state}</p>
                    )}
                  </FieldGroup>
                  <FieldGroup label="Pincode" editing={editing}>
                    {editing ? (
                      <Input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} placeholder="e.g. 600001" />
                    ) : (
                      <p className="text-sm font-medium text-ocean-navy">{profile.pincode || "Not set"}</p>
                    )}
                  </FieldGroup>
                </div>
                {editing && (
                  <div className="rounded-lg bg-ocean-light/50 border border-ocean-border/30 p-3 text-xs text-ocean-text-secondary">
                    <Shield className="h-3.5 w-3.5 inline mr-1" />
                    This address will be used for marketplace checkout. You can change it anytime.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Actions */}
            {editing && (
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} className="bg-ocean-blue hover:bg-ocean-blue/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Profile Status */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-ocean-navy mb-3">Profile Completion</h3>
                <div className="space-y-2">
                  <ProgressItem label="Personal Info" done={Boolean(profile.firstName && profile.lastName && profile.phone)} />
                  <ProgressItem label="Delivery Address" done={Boolean(profile.address && profile.city && profile.pincode)} />
                  <ProgressItem label="Professional" done={Boolean(profile.occupation)} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <h3 className="text-sm font-semibold text-ocean-navy mb-3">Quick Actions</h3>
                <Link href="/marketplace" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-ocean-light transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-blue/10">
                      <CreditCard className="h-4 w-4 text-ocean-blue" />
                    </div>
                    <span className="text-sm font-medium text-ocean-navy">Marketplace</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ocean-muted group-hover:text-ocean-blue transition-colors" />
                </Link>
                <Link href="/marketplace/cart" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-ocean-light transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-green/10">
                      <Truck className="h-4 w-4 text-ocean-green" />
                    </div>
                    <span className="text-sm font-medium text-ocean-navy">My Orders</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ocean-muted group-hover:text-ocean-blue transition-colors" />
                </Link>
                <a href="/recognition" className="flex items-center justify-between rounded-lg p-2.5 hover:bg-ocean-light transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ocean-warning/10">
                      <Award className="h-4 w-4 text-ocean-warning" />
                    </div>
                    <span className="text-sm font-medium text-ocean-navy">My Awards</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ocean-muted group-hover:text-ocean-blue transition-colors" />
                </a>
              </CardContent>
            </Card>

            {/* Member Info */}
            <Card className="border-ocean-border/40 shadow-sm">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-ocean-navy mb-3">Member Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ocean-muted">Role</span>
                    <span className="font-medium text-ocean-navy capitalize">{user?.role?.replace(/_/g, " ") || "Member"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-ocean-muted">Status</span>
                    <Badge className="bg-ocean-green/10 text-ocean-green text-xs">Active</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-ocean-muted">Member Since</span>
                    <span className="font-medium text-ocean-navy">2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FieldGroup({
  label,
  editing,
  children,
  full,
}: {
  label: string;
  editing: boolean;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs font-medium text-ocean-muted mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function ProgressItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-ocean-green" : "bg-ocean-border"}`}>
        {done && <Check className="h-3 w-3 text-white" />}
      </div>
      <span className={`text-sm ${done ? "text-ocean-navy font-medium" : "text-ocean-muted"}`}>{label}</span>
    </div>
  );
}
