import { useState, useEffect } from "react";
import { 
  Book, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Download, 
  Plus, 
  Search, 
  Trash2,
  Loader
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { type Resource, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

export function LibraryPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Resource Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"PDF" | "VIDEO" | "LINK" | "DOC">("PDF");
  const [category, setCategory] = useState("General");

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.getResources();
      if (res.success && res.data) {
        setResources(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      toast.error("Failed to load library resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAdd = async () => {
    if (!title || !url) return toast.error("Title and URL are required");
    try {
      const res = await api.createResource({ title, description, url, type, category });
      if (res.success) {
        toast.success("Resource added to library");
        setShowAddModal(false);
        setTitle("");
        setDescription("");
        setUrl("");
        fetchResources();
      }
    } catch (error) {
      toast.error("Error adding resource");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this resource?")) return;
    const res = await api.deleteResource(id);
    if (res.success) {
      toast.success("Resource removed");
      fetchResources();
    }
  };

  const filtered = resources.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.category?.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <Video className="h-5 w-5" />;
      case "LINK": return <LinkIcon className="h-5 w-5" />;
      case "DOC": return <FileText className="h-5 w-5" />;
      default: return <Book className="h-5 w-5" />;
    }
  };

  return (
    <>
      <PageHeader 
        title="Library" 
        subtitle="Access and share learning materials, books, and resources."
        action={
          (user?.role === "faculty" || user?.role === "admin") && (
            <Btn onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Resource
            </Btn>
          )
        }
      />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-2">
        <div className="flex h-10 w-10 items-center justify-center text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <input 
          placeholder="Search by title or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r => (
            <Card key={r.id} className="group relative">
              <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2 ${
                  r.type === 'VIDEO' ? 'bg-red-500/10 text-red-500' :
                  r.type === 'LINK' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-primary/10 text-primary'
                }`}>
                  {getIcon(r.type)}
                </div>
                {(user?.role === 'admin' || (user?.role === 'faculty' && r.facultyId === Number(user.id))) && (
                  <button 
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-4">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                  {r.category || "General"}
                </div>
                <h4 className="font-bold text-lg line-clamp-1">{r.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                  {r.description || "No description provided."}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Added {new Date(r.createdAt || "").toLocaleDateString()}
                </span>
                <a 
                  href={r.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                >
                  <Download className="h-4 w-4" /> Access
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Book className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold">No resources found</h3>
          <p className="text-muted-foreground max-w-xs mt-2">
            Try adjusting your search or add a new resource to get started.
          </p>
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Add New Resource</h3>
            <div className="space-y-4">
              <input 
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <textarea 
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-secondary/20 p-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input 
                placeholder="Resource URL (e.g. Google Drive, YouTube)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-secondary/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <div className="grid grid-cols-2 gap-2">
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="rounded-xl border border-border bg-secondary/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="VIDEO">Video Link</option>
                  <option value="LINK">External Link</option>
                  <option value="DOC">Word Document</option>
                </select>
                <input 
                  placeholder="Category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="rounded-xl border border-border bg-secondary/20 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Btn variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Btn>
              <Btn className="flex-1" onClick={handleAdd}>Add to Library</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
