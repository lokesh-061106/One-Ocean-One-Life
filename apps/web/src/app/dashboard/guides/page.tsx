"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Fish,
  CheckCircle,
  Tag,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDashboardData, type DashboardSpecies } from "@/components/dashboard-data-context";
import { CrudForm, type Field } from "@/components/ui/crud-form";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchApiSpecies(): Promise<DashboardSpecies[]> {
  try {
    const token = localStorage.getItem("o3l_access_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}/guides/species/`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.results || data || [];
    return items.map((s: any) => ({
      id: s.id || "",
      name: s.common_name || "",
      scientific: s.scientific_name || "",
      category: typeof s.category === "object" ? s.category?.name : s.category_name || "",
      status: s.is_verified ? "Verified" : "Pending",
      image: s.image || "",
      description: s.description || "",
    }));
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = {
  Verified: "bg-ocean-green text-white",
  Pending: "bg-ocean-warning text-white",
  Draft: "bg-ocean-muted text-white",
};

const categoryColors: Record<string, string> = {
  "Marine Mammals": "bg-ocean-blue/10 text-ocean-blue",
  "Sea Turtles": "bg-ocean-green/10 text-ocean-green",
  "Sharks & Rays": "bg-ocean-coral/10 text-ocean-coral",
  Fish: "bg-ocean-warning/10 text-ocean-warning",
  Seabirds: "bg-ocean-info/10 text-ocean-info",
};

const fields: Field[] = [
  { key: "name", label: "Species Name", type: "text", placeholder: "e.g. Spinner Dolphin", required: true },
  { key: "scientific", label: "Scientific Name", type: "text", placeholder: "e.g. Stenella longirostris", required: true },
  {
    key: "category",
    label: "Category",
    type: "select",
    placeholder: "Select category",
    required: true,
    options: [
      { value: "Marine Mammals", label: "Marine Mammals" },
      { value: "Sea Turtles", label: "Sea Turtles" },
      { value: "Sharks & Rays", label: "Sharks & Rays" },
      { value: "Fish", label: "Fish" },
      { value: "Seabirds", label: "Seabirds" },
    ],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    required: true,
    options: [
      { value: "Verified", label: "Verified" },
      { value: "Pending", label: "Pending" },
      { value: "Draft", label: "Draft" },
    ],
  },
  { key: "image", label: "Image (emoji)", type: "text", placeholder: "Enter emoji like 🐬", required: true },
  { key: "description", label: "Description", type: "richtext", span: 2 },
];

export default function DashboardGuidesPage() {
  const { addSpecies, updateSpecies, deleteSpecies } = useDashboardData();
  const [species, setSpecies] = useState<DashboardSpecies[]>([]);
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedSpecies, setSelectedSpecies] = useState<DashboardSpecies | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchApiSpecies().then(setSpecies);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filteredSpecies = species.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSpecies = species.length;
  const verifiedCount = species.filter((s) => s.status === "Verified").length;
  const categoryCount = new Set(species.map((s) => s.category)).size;

  const handleSave = async (data: Record<string, any>) => {
    if (view === "add") {
      await addSpecies(data as Omit<DashboardSpecies, "id">);
      setToast("Species added");
    } else if (view === "edit" && selectedSpecies) {
      await updateSpecies(selectedSpecies.id, data);
      setToast("Species updated");
    }
    const fresh = await fetchApiSpecies();
    setSpecies(fresh);
    setView("list");
    setSelectedSpecies(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSpecies(id);
    setToast("Species deleted");
    const fresh = await fetchApiSpecies();
    setSpecies(fresh);
  };

  const openAdd = () => {
    setSelectedSpecies(null);
    setView("add");
  };

  const openEdit = (s: DashboardSpecies) => {
    setSelectedSpecies(s);
    setView("edit");
  };

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-ocean-green text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-1 hover:opacity-70">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {view === "list" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-ocean-navy">Species Guides</h1>
                <p className="text-ocean-text-secondary">Manage marine species database.</p>
              </div>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Species
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center">
                      <Fish className="h-5 w-5 text-ocean-blue" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{totalSpecies}</p>
                      <p className="text-sm text-ocean-text-secondary">Total Species</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-ocean-green" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{verifiedCount}</p>
                      <p className="text-sm text-ocean-text-secondary">Verified</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-warning/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-ocean-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{categoryCount}</p>
                      <p className="text-sm text-ocean-text-secondary">Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-coral/10 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-ocean-coral" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ocean-navy">{species.filter((s) => s.image).length}</p>
                      <p className="text-sm text-ocean-text-secondary">With Images</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" />
              <Input
                placeholder="Search species..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Species</TableHead>
                      <TableHead>Scientific Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSpecies.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{s.image}</span>
                            <span className="font-medium text-ocean-navy">{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="italic text-ocean-text-secondary">{s.scientific}</TableCell>
                        <TableCell>
                          <Badge className={categoryColors[s.category] || ""}>{s.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[s.status]}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(s)}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-ocean-danger" onClick={() => handleDelete(s.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />Delete
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
          </>
        )}

        {(view === "add" || view === "edit") && (
          <div className="max-w-3xl mx-auto">
            <CrudForm
              title="Species"
              fields={fields}
              initialData={view === "edit" && selectedSpecies ? selectedSpecies : undefined}
              mode={view === "add" ? "add" : "edit"}
              onSave={handleSave}
              onCancel={() => { setView("list"); setSelectedSpecies(null); }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
