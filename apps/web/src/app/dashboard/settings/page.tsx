"use client";

import {
  Settings,
  Save,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Smartphone,
  Users,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Settings</h1>
            <p className="text-ocean-text-secondary">
              Configure platform settings and preferences.
            </p>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input id="platformName" defaultValue="O3L - One Ocean One Life" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline</Label>
                    <Input id="tagline" defaultValue="Connect. Learn. Contribute. Protect." />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    defaultValue="Connecting coastal communities, fishermen, researchers, NGOs, educators, vendors and institutions to collectively understand and protect the ocean."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" defaultValue="contact@o3l.org" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input id="supportPhone" defaultValue="+91-44-12345678" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Configure regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="ist">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ist">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <p className="text-sm text-ocean-text-secondary">
                      Temporarily disable public access for maintenance
                    </p>
                  </div>
                  <Switch id="maintenance" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure email notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <Label>New User Registration</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Notify admin when a new user registers
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-ocean-green" />
                    </div>
                    <div>
                      <Label>New Contribution</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Notify admin when a new contribution is submitted
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-coral/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-ocean-coral" />
                    </div>
                    <div>
                      <Label>Community Posts</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Notify admin when new community posts are created
                      </p>
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
                <CardDescription>Configure push notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-warning/10 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-ocean-warning" />
                    </div>
                    <div>
                      <Label>Enable Push Notifications</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Allow sending push notifications to users
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <Label>Event Reminders</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Send reminders for upcoming events
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-ocean-green" />
                    </div>
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Require 2FA for admin accounts
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <Label>Email Verification</Label>
                      <p className="text-sm text-ocean-text-secondary">
                        Require email verification for new users
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input id="maxLoginAttempts" type="number" defaultValue="5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Data retention and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                  <Input id="dataRetention" type="number" defaultValue="365" />
                  <p className="text-sm text-ocean-text-secondary">
                    How long to keep user data after account deletion
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Analytics Collection</Label>
                    <p className="text-sm text-ocean-text-secondary">
                      Collect anonymous usage analytics
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
                <CardDescription>Customize platform appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-ocean-blue border-2 border-ocean-navy" />
                      <Input defaultValue="#087EA4" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-ocean-green border-2 border-ocean-navy" />
                      <Input defaultValue="#16A085" className="flex-1" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-ocean-text-secondary">
                      Enable dark mode for the platform
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-ocean-text-secondary">
                      Reduce spacing for more content density
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo & Branding</CardTitle>
                <CardDescription>Upload and configure branding assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Platform Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-ocean-light flex items-center justify-center border-2 border-dashed border-ocean-border">
                      <span className="text-2xl">🌊</span>
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Upload New Logo
                      </Button>
                      <p className="text-sm text-ocean-text-secondary mt-1">
                        Recommended: 200x200px, PNG or SVG
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
