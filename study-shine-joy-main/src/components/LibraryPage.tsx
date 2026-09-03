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
  Loader,
  Filter,
  User,
  Upload,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { type Resource, api } from "@/lib/api";
import { PageHeader, Card, Btn } from "./shared/UIPrimitives";
import { toast } from "sonner";

function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search.trim() || !text) return <>{text}</>;
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-300/50 dark:bg-amber-400/35 text-foreground font-bold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function formatFileUrl(url?: string): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8082";
  const baseUrl = apiBase.replace(/\/api\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function LibraryPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PDF" | "VIDEO" | "LINK" | "DOC">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Resource Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"PDF" | "VIDEO" | "LINK" | "DOC">("PDF");
  const [category, setCategory] = useState("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (newType: "PDF" | "VIDEO" | "LINK" | "DOC") => {
    setType(newType);
    if (newType === "PDF" || newType === "DOC") {
      setUploadMode("file");
    } else {
      setUploadMode("url");
    }
  };

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

  const resetForm = () => {
    setShowAddModal(false);
    setTitle("");
    setDescription("");
    setUrl("");
    setSelectedFile(null);
    setCategory("General");
    setType("PDF");
    setUploadMode("file");
  };

  const handleAdd = async () => {
    if (!title.trim()) return toast.error("Title is required");

    // File Upload Mode for PDF / Word Document
    if ((type === "PDF" || type === "DOC") && uploadMode === "file") {
      if (!selectedFile) {
        return toast.error(`Please select a ${type === "PDF" ? "PDF" : "Word document"} file to upload`);
      }
      try {
        setSubmitting(true);
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("type", type);
        formData.append("category", category || "General");
        formData.append("file", selectedFile);

        const res = await api.createResource(formData);
        if (res.success) {
          toast.success("Resource file uploaded & added to library!");
          resetForm();
          fetchResources();
        } else {
          toast.error(res.error || "Failed to upload resource file");
        }
      } catch (error) {
        toast.error("Error uploading resource file");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // URL Mode for Video / Link or Cloud URL
    if (!url.trim()) {
      return toast.error(type === "VIDEO" ? "Video URL is required" : "Resource URL is required");
    }

    try {
      setSubmitting(true);
      const res = await api.createResource({ title, description, url, type, category });
      if (res.success) {
        toast.success("Resource added to library!");
        resetForm();
        fetchResources();
      } else {
        toast.error(res.error || "Failed to add resource");
      }
    } catch (error) {
      toast.error("Error adding resource");
    } finally {
      setSubmitting(false);
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

  const getFacultyName = (r: Resource) => {
    return r.facultyName || r.faculty?.name || "Faculty Member";
  };

  const filtered = resources.filter(r => {
    const searchQuery = search.toLowerCase().trim();
    const facName = getFacultyName(r).toLowerCase();
    const crsName = (r.courseName || r.course?.title || "").toLowerCase();
    const titleText = (r.title || "").toLowerCase();
    const catText = (r.category || "").toLowerCase();
    const descText = (r.description || "").toLowerCase();

    const matchesSearch =
      !searchQuery ||
      titleText.includes(searchQuery) ||
      crsName.includes(searchQuery) ||
      catText.includes(searchQuery) ||
      facName.includes(searchQuery) ||
      descText.includes(searchQuery);

    const rType = (r.type || "").toUpperCase();
    const matchesType = typeFilter === "ALL" || rType === typeFilter;

    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    const t = (type || "").toUpperCase();
    switch (t) {
      case "VIDEO": return <Video className="h-5 w-5" />;
      case "LINK": return <LinkIcon className="h-5 w-5" />;
      case "DOC": return <FileText className="h-5 w-5" />;
      case "PDF": return <Book className="h-5 w-5" />;
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

      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Bar */}
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <input 
            placeholder="Search by title, course name, faculty name, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {/* 5-Type Filter Dropdown */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm min-w-[230px]">
          <Filter className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full bg-transparent text-sm font-semibold outline-none cursor-pointer text-foreground"
          >
            <option value="ALL" className="bg-card text-foreground">All Resources ({resources.length})</option>
            <option value="PDF" className="bg-card text-foreground">PDF Documents ({resources.filter(r => (r.type || "").toUpperCase() === "PDF").length})</option>
            <option value="VIDEO" className="bg-card text-foreground">Videos ({resources.filter(r => (r.type || "").toUpperCase() === "VIDEO").length})</option>
            <option value="LINK" className="bg-card text-foreground">URL Links ({resources.filter(r => (r.type || "").toUpperCase() === "LINK").length})</option>
            <option value="DOC" className="bg-card text-foreground">Documents ({resources.filter(r => (r.type || "").toUpperCase() === "DOC").length})</option>
          </select>
        </div>
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
                  (r.type || "").toUpperCase() === 'VIDEO' ? 'bg-red-500/10 text-red-500' :
                  (r.type || "").toUpperCase() === 'LINK' ? 'bg-blue-500/10 text-blue-500' :
                  (r.type || "").toUpperCase() === 'DOC' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-emerald-500/10 text-emerald-500'
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
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md border border-border/50">
                      <HighlightText text={r.courseName || r.category || "General"} search={search} />
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 normal-case">
                    <User className="h-3 w-3 text-primary shrink-0" />
                    <span>
                      {r.faculty?.role === "ADMIN" || getFacultyName(r).toLowerCase().includes("admin") ? "By: " : "Faculty: "}
                      <HighlightText text={getFacultyName(r)} search={search} />
                    </span>
                  </span>
                </div>

                <h4 className="font-bold text-lg line-clamp-1 text-foreground mt-2">
                  <HighlightText text={r.title} search={search} />
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                  <HighlightText text={r.description || "No description provided."} search={search} />
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Added {new Date(r.createdAt || "").toLocaleDateString()}
                </span>
                <a 
                  href={formatFileUrl(r.url)} 
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
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <h3 className="text-xl font-bold text-foreground">Add New Resource</h3>
              <button 
                onClick={resetForm}
                className="text-muted-foreground hover:text-foreground transition rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Selection & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Resource Type
                  </label>
                  <select 
                    value={type}
                    onChange={e => handleTypeChange(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="PDF">📄 PDF Document</option>
                    <option value="DOC">📝 Word Document</option>
                    <option value="VIDEO">🎥 Video Link</option>
                    <option value="LINK">🔗 External Link</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Category / Course
                  </label>
                  <input 
                    placeholder="e.g. General, Python, COA"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Title *
                </label>
                <input 
                  placeholder="Enter resource title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea 
                  placeholder="Brief description of the material..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-secondary/30 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Dynamic Upload vs Link Input */}
              {(type === "PDF" || type === "DOC") ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {type === "PDF" ? "PDF File or Cloud Link *" : "Word Document File or Cloud Link *"}
                    </label>
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setUploadMode("file")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          uploadMode === "file" 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode("url")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          uploadMode === "url" 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        Provide Link
                      </button>
                    </div>
                  </div>

                  {uploadMode === "file" ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 rounded-2xl p-5 cursor-pointer transition text-center group">
                      <Upload className="h-7 w-7 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      {selectedFile ? (
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-foreground block max-w-xs truncate">{selectedFile.name}</span>
                          <span className="text-xs text-muted-foreground block">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-sm font-bold text-foreground block">Click to select {type === "PDF" ? ".pdf" : ".doc / .docx"} file</span>
                          <span className="text-xs text-muted-foreground block mt-0.5">Upload document directly from your device</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept={type === "PDF" ? ".pdf" : ".doc,.docx,.pdf,.ppt,.pptx,.txt"} 
                        className="hidden" 
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  ) : (
                    <input 
                      placeholder="e.g. Google Drive or Cloud Document URL"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  )}
                </div>
              ) : type === "VIDEO" ? (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Video URL (YouTube or Direct Video Link) *
                  </label>
                  <input 
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    External Link / Web URL *
                  </label>
                  <input 
                    placeholder="e.g. https://example.com/notes"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Btn variant="ghost" className="flex-1" onClick={resetForm} disabled={submitting}>Cancel</Btn>
              <Btn className="flex-1" onClick={handleAdd} disabled={submitting}>
                {submitting ? <Loader className="h-4 w-4 animate-spin" /> : "Add to Library"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

