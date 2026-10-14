"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Search, Plus, Edit, Trash2, CheckCircle, Clock, XCircle, User, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CrudForm, type Field } from "@/components/ui/crud-form";
import { useDashboardData, type DashboardPost } from "@/components/dashboard-data-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchApiPosts(): Promise<DashboardPost[]> {
  try {
    const token = localStorage.getItem("o3l_access_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API}/community/posts/`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.results || data || [];
    return items.map((p: any) => ({
      id: p.id || "",
      title: p.title || "",
      author: p.author_name || (typeof p.author === "object" ? p.author?.username : "") || "",
      category: typeof p.category === "object" && p.category !== null ? p.category.name || "" : (p.category || ""),
      type: typeof p.category === "object" && p.category !== null ? "story" : (p.category || "story"),
      village: p.village_name || "",
      status: p.is_verified ? "published" : "pending",
      views: p.views_count || 0,
      reactions: p.reactions_count || 0,
      date: p.created_at ? p.created_at.split("T")[0] : "",
      content: p.content || "",
    }));
  } catch {
    return [];
  }
}

const statusColors: Record<string, string> = { published: "bg-ocean-green text-white", pending: "bg-ocean-warning text-white", draft: "bg-ocean-muted text-white" };
const typeColors: Record<string, string> = { story: "bg-ocean-blue/10 text-ocean-blue", tutorial: "bg-ocean-green/10 text-ocean-green", blog: "bg-ocean-coral/10 text-ocean-coral", experience: "bg-ocean-warning/10 text-ocean-warning", knowledge: "bg-ocean-navy/10 text-ocean-navy" };

const fields: Field[] = [
  { key: "title", label: "Title", type: "text", placeholder: "Enter post title", required: true, span: 2 },
  { key: "author", label: "Author", type: "text", placeholder: "Enter author name", required: true },
  { key: "category", label: "Category", type: "select", required: true, options: [{ value: "Local Knowledge", label: "Local Knowledge" }, { value: "Conservation", label: "Conservation" }, { value: "Tutorial", label: "Tutorial" }, { value: "Education", label: "Education" }, { value: "Experience", label: "Experience" }] },
  { key: "type", label: "Type", type: "select", required: true, options: [{ value: "story", label: "Story" }, { value: "tutorial", label: "Tutorial" }, { value: "blog", label: "Blog" }, { value: "experience", label: "Experience" }, { value: "knowledge", label: "Knowledge" }] },
  { key: "village", label: "Village", type: "text", placeholder: "Enter village name", required: true },
  { key: "status", label: "Status", type: "select", required: true, options: [{ value: "published", label: "Published" }, { value: "pending", label: "Pending" }, { value: "draft", label: "Draft" }] },
  { key: "content", label: "Post Content", type: "richtext", placeholder: "Write your post content here...", required: true, span: 2 },
];

export default function ContentPage() {
  const { posts: ctxPosts, addPost, updatePost, deletePost, loading } = useDashboardData();
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [selectedPost, setSelectedPost] = useState<DashboardPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchApiPosts().then(setPosts);
  }, []);

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t); } }, [toast]);
  const showToast = (msg: string) => { setToast(msg); };

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.author.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSave = async (data: Record<string, any>) => {
    try {
      if (view === "add") {
        await addPost({
          title: data.title,
          author: data.author,
          category: data.category,
          type: data.type,
          village: data.village,
          status: data.status,
          content: data.content || "",
          views: 0,
          reactions: 0,
          date: new Date().toISOString().split("T")[0],
        });
        showToast("Post created successfully");
      } else if (selectedPost) {
        await updatePost(selectedPost.id, {
          title: data.title,
          author: data.author,
          category: data.category,
          type: data.type,
          village: data.village,
          status: data.status,
          content: data.content,
        });
        showToast("Post updated successfully");
      }
      const fresh = await fetchApiPosts();
      setPosts(fresh);
    } catch (err: any) {
      showToast(err.message || "Failed to save");
    }
    setView("list");
    setSelectedPost(null);
  };

  const handleDelete = async (post: DashboardPost) => {
    if (confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      try {
        await deletePost(post.id);
        showToast("Post deleted");
        const fresh = await fetchApiPosts();
        setPosts(fresh);
      } catch (err: any) {
        showToast(err.message || "Failed to delete");
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {toast && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-ocean-green text-white px-4 py-2 rounded-lg shadow-lg">
            <CheckCircle className="h-4 w-4" />{toast}
            <button onClick={() => setToast(null)} className="ml-1"><X className="h-3 w-3" /></button>
          </div>
        )}

        {view === "list" && (
          <>
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-bold text-ocean-navy">Content Management</h1><p className="text-ocean-text-secondary">Manage educational posts, stories, and community content.</p></div>
              <Button onClick={() => { setSelectedPost(null); setView("add"); }}><Plus className="mr-2 h-4 w-4" />Create Post</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center"><FileText className="h-5 w-5 text-ocean-blue" /></div><div><p className="text-2xl font-bold text-ocean-navy">{posts.length}</p><p className="text-sm text-ocean-text-secondary">Total Posts</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-ocean-green" /></div><div><p className="text-2xl font-bold text-ocean-navy">{posts.filter(p => p.status === "published").length}</p><p className="text-sm text-ocean-text-secondary">Published</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-warning/10 flex items-center justify-center"><Clock className="h-5 w-5 text-ocean-warning" /></div><div><p className="text-2xl font-bold text-ocean-navy">{posts.filter(p => p.status === "pending").length}</p><p className="text-sm text-ocean-text-secondary">Pending</p></div></div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-muted/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-ocean-muted" /></div><div><p className="text-2xl font-bold text-ocean-navy">{posts.filter(p => p.status === "draft").length}</p><p className="text-sm text-ocean-text-secondary">Drafts</p></div></div></CardContent></Card>
            </div>

            <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" /><Input placeholder="Search posts..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-ocean-muted">{loading ? "Loading posts..." : "No posts found. Create your first post!"}</TableCell></TableRow>
                    )}
                    {filteredPosts.map(post => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium text-ocean-navy max-w-xs truncate">{post.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-ocean-light flex items-center justify-center"><User className="h-3 w-3 text-ocean-blue" /></div>
                            <span className="text-sm">{post.author}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{post.category}</Badge></TableCell>
                        <TableCell><Badge className={typeColors[post.type] || ""}>{post.type}</Badge></TableCell>
                        <TableCell><Badge className={statusColors[post.status]}>{post.status}</Badge></TableCell>
                        <TableCell className="text-ocean-text-secondary">{post.views}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><span className="sr-only">Actions</span>...</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedPost(post); setView("edit"); }}>
                                <Edit className="mr-2 h-4 w-4" />Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-ocean-danger" onClick={() => handleDelete(post)}>
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

        {view === "add" && <CrudForm title="Post" fields={fields} mode="add" onSave={handleSave} onCancel={() => setView("list")} />}
        {view === "edit" && selectedPost && <CrudForm title="Post" fields={fields} mode="edit" initialData={selectedPost} onSave={handleSave} onCancel={() => { setView("list"); setSelectedPost(null); }} />}
      </div>
    </DashboardLayout>
  );
}
