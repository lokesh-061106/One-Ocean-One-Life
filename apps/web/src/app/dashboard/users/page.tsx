"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Download,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardData } from "@/components/dashboard-data-context";
import { CrudForm, type Field } from "@/components/ui/crud-form";

const userFields: Field[] = [
  { key: "name", label: "Name", type: "text", placeholder: "Enter name", required: true },
  { key: "email", label: "Email", type: "email", placeholder: "user@example.com", required: true },
  {
    key: "role",
    label: "Role",
    type: "select",
    placeholder: "Select role",
    required: true,
    options: [
      { value: "Fisherman", label: "Fisherman" },
      { value: "Community Leader", label: "Community Leader" },
      { value: "Researcher", label: "Researcher" },
      { value: "Educator", label: "Educator" },
    ],
  },
  { key: "village", label: "Village", type: "text", placeholder: "Enter village", required: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    required: true,
    options: [
      { value: "active", label: "Active" },
      { value: "engaged", label: "Engaged" },
      { value: "occasional", label: "Occasional" },
    ],
  },
];

const roleColors: Record<string, string> = {
  Fisherman: "bg-ocean-blue/10 text-ocean-blue",
  "Community Leader": "bg-ocean-green/10 text-ocean-green",
  Researcher: "bg-ocean-coral/10 text-ocean-coral",
  Educator: "bg-ocean-warning/10 text-ocean-warning",
};

const statusColors: Record<string, string> = {
  active: "bg-ocean-green text-white",
  engaged: "bg-ocean-warning text-white",
  occasional: "bg-ocean-muted text-white",
};

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser } = useDashboardData();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const verifiedUsers = users.filter((u) => u.verified).length;
  const engagedUsers = users.filter((u) => u.status === "engaged").length;

  const handleAddSave = async (data: Record<string, any>) => {
    try {
      await addUser({
        name: data.name,
        email: data.email,
        role: data.role,
        village: data.village,
        status: data.status,
        verified: false,
        score: 0,
        joinDate: new Date().toISOString().split("T")[0],
      });
      setToast("User added successfully");
    } catch (err: any) {
      setToast(err.message || "Failed to add user");
    }
    setView("list");
  };

  const handleEditSave = async (data: Record<string, any>) => {
    try {
      await updateUser(selectedUser.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        village: data.village,
        status: data.status,
      });
      setToast("User updated successfully");
    } catch (err: any) {
      setToast(err.message || "Failed to update user");
    }
    setView("list");
  };

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-ocean-green text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5">
          {toast}
        </div>
      )}
      <div className="p-6 space-y-6">
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ocean-navy">User Management</h1>
                <p className="text-ocean-text-secondary">
                  Manage platform users, roles, and verification status.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => {
                  const headers = ["Name", "Email", "Role", "Village", "Status", "Verified", "Score"];
                  const csv = [headers.join(",")];
                  filteredUsers.forEach(u => csv.push([u.name, u.email, u.role, u.village, u.status, u.verified, u.score].join(",")));
                  const blob = new Blob([csv.join("\n")], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
                  URL.revokeObjectURL(url);
                  setToast("Users exported to CSV");
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => { setSelectedUser(null); setView("add"); }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-blue/10 rounded-lg">
                      <Users className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-ocean-text-secondary">Total Users</p>
                      <p className="text-xl font-bold text-ocean-navy">{totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-green/10 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-ocean-green" />
                    </div>
                    <div>
                      <p className="text-sm text-ocean-text-secondary">Active</p>
                      <p className="text-xl font-bold text-ocean-navy">{activeUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-coral/10 rounded-lg">
                      <Shield className="h-5 w-5 text-ocean-coral" />
                    </div>
                    <div>
                      <p className="text-sm text-ocean-text-secondary">Verified</p>
                      <p className="text-xl font-bold text-ocean-navy">{verifiedUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ocean-warning/10 rounded-lg">
                      <Users className="h-5 w-5 text-ocean-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-ocean-text-secondary">Engaged</p>
                      <p className="text-xl font-bold text-ocean-navy">{engagedUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="all">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="all">All Users</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="suspended">Suspended</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="mt-6">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Village</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-ocean-muted">
                              Loading users...
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-ocean-blue flex items-center justify-center text-white font-medium">
                                  {user.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-ocean-navy">{user.name}</div>
                                  <div className="text-sm text-ocean-text-secondary">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={roleColors[user.role] || ""}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-ocean-text-secondary">{user.village}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[user.status] || ""}>
                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-ocean-blue">{user.score}</TableCell>
                            <TableCell>
                              {user.verified ? (
                                <CheckCircle className="h-5 w-5 text-ocean-green" />
                              ) : (
                                <XCircle className="h-5 w-5 text-ocean-muted" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUser(user);
                                    setView("edit");
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={async () => {
                                    try {
                                      await updateUser(user.id, { verified: !user.verified });
                                      setToast(`User ${user.verified ? "unverified" : "verified"} successfully`);
                                    } catch (err: any) {
                                      setToast(err.message || "Failed to update verification");
                                    }
                                  }}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    {user.verified ? "Revoke Verification" : "Verify User"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-ocean-danger"
                                    onClick={async () => {
                                      if (window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
                                        try {
                                          await deleteUser(user.id);
                                          setToast("User deleted successfully");
                                        } catch (err: any) {
                                          setToast(err.message || "Failed to delete user");
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="active" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-ocean-text-secondary">Showing active users only.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-ocean-text-secondary">Showing users pending verification.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suspended" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-ocean-text-secondary">Showing suspended users.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : view === "add" ? (
          <CrudForm
            title="User"
            fields={userFields}
            mode="add"
            onSave={handleAddSave}
            onCancel={() => setView("list")}
          />
        ) : (
          <CrudForm
            title="User"
            fields={userFields}
            mode="edit"
            initialData={selectedUser ? {
              name: selectedUser.name,
              email: selectedUser.email,
              role: selectedUser.role,
              village: selectedUser.village,
              status: selectedUser.status,
            } : undefined}
            onSave={handleEditSave}
            onCancel={() => setView("list")}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
