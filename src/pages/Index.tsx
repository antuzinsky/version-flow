import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

const Index: React.FC = () => {
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [clients, setClients] = useState<any[]>([]);
  const [clientName, setClientName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();

  const [projects, setProjects] = useState<any[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  const [documents, setDocuments] = useState<any[]>([]);
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [versions, setVersions] = useState<any[]>([]);
  const [versionContent, setVersionContent] = useState("");

  useEffect(() => {
    document.title = "B2B Docs Dashboard · Clients, Projects, Documents";
    const desc = "Manage clients, projects, upload .doc/.docx, and test versioning.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch helpers
  const refreshClients = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load clients", description: error.message, variant: "destructive" });
    } else {
      setClients(data || []);
    }
  };

  const refreshProjects = async (clientId?: string) => {
    if (!clientId) return setProjects([]);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load projects", description: error.message, variant: "destructive" });
    } else {
      setProjects(data || []);
    }
  };

  const refreshDocuments = async (projectId?: string) => {
    if (!projectId) return setDocuments([]);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load documents", description: error.message, variant: "destructive" });
    } else {
      setDocuments(data || []);
    }
  };

  const refreshVersions = async (documentId?: string) => {
    if (!documentId) return setVersions([]);
    const { data, error } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load versions", description: error.message, variant: "destructive" });
    } else {
      setVersions(data || []);
    }
  };

  // Load lists when state changes
  useEffect(() => { if (userId) { refreshClients(); } }, [userId]);
  useEffect(() => { refreshProjects(selectedClientId); }, [selectedClientId]);
  useEffect(() => { refreshDocuments(selectedProjectId); }, [selectedProjectId]);
  useEffect(() => { refreshVersions(selectedDocumentId); }, [selectedDocumentId]);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !userId) return;
    const { error } = await supabase.from("clients").insert({ owner_id: userId, name: clientName.trim() });
    if (error) {
      toast({ title: "Create client failed", description: error.message, variant: "destructive" });
    } else {
      setClientName("");
      toast({ title: "Client created" });
      refreshClients();
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !selectedClientId) return;
    const { error } = await supabase.from("projects").insert({ client_id: selectedClientId, name: projectName.trim() });
    if (error) {
      toast({ title: "Create project failed", description: error.message, variant: "destructive" });
    } else {
      setProjectName("");
      toast({ title: "Project created" });
      refreshProjects(selectedClientId);
    }
  };

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedProjectId || !docTitle.trim() || !docFile) return;

    // 1) Insert document row
    const { data: docInsert, error: docErr } = await supabase
      .from("documents")
      .insert({ project_id: selectedProjectId, title: docTitle.trim() })
      .select("*")
      .maybeSingle();

    if (docErr || !docInsert) {
      toast({ title: "Create document failed", description: docErr?.message || "No row returned", variant: "destructive" });
      return;
    }

    const path = `${userId}/${docInsert.id}/${docFile.name}`;

    // 2) Upload to storage
    const { error: uploadErr } = await supabase
      .storage
      .from("documents")
      .upload(path, docFile, { upsert: true });

    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      return;
    }

    // 3) Update document with metadata
    const { error: updErr } = await supabase
      .from("documents")
      .update({ file_path: path, file_name: docFile.name, mime_type: docFile.type, size_bytes: docFile.size })
      .eq("id", docInsert.id);

    if (updErr) {
      toast({ title: "Update document failed", description: updErr.message, variant: "destructive" });
      return;
    }

    // 4) Create initial version
    const { error: verErr } = await supabase
      .from("document_versions")
      .insert({ document_id: docInsert.id, created_by: userId, file_path: path });

    if (verErr) {
      toast({ title: "Version create failed", description: verErr.message, variant: "destructive" });
      return;
    }

    setDocTitle("");
    setDocFile(null);
    toast({ title: "Document uploaded" });
    refreshDocuments(selectedProjectId);
  };

  const saveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedDocumentId || !versionContent.trim()) return;
    const { error } = await supabase
      .from("document_versions")
      .insert({ document_id: selectedDocumentId, created_by: userId, content: versionContent.trim() });
    if (error) {
      toast({ title: "Save version failed", description: error.message, variant: "destructive" });
    } else {
      setVersionContent("");
      toast({ title: "New version saved" });
      refreshVersions(selectedDocumentId);
    }
  };

  const restoreVersion = async (versionId: string) => {
    const v = versions.find((x) => x.id === versionId);
    if (!v || !userId || !selectedDocumentId) return;
    const { error } = await supabase
      .from("document_versions")
      .insert({ document_id: selectedDocumentId, created_by: userId, content: v.content, file_path: v.file_path });
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Version restored (new version created)" });
      refreshVersions(selectedDocumentId);
    }
  };

  const createShareLink = async () => {
    if (!userId || !selectedDocumentId) return;
    const token = crypto.randomUUID();
    const { error } = await supabase
      .from("shares")
      .insert({ document_id: selectedDocumentId, token, can_edit: false, created_by: userId });
    if (error) {
      toast({ title: "Share link failed", description: error.message, variant: "destructive" });
    } else {
      const url = `${window.location.origin}/share/${token}`;
      navigator.clipboard?.writeText(url).catch(() => void 0);
      toast({ title: "Share link created", description: url });
    }
  };

  const isAuthed = useMemo(() => !!userId, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Welcome to B2B Docs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">Sign in to test clients, projects, uploads, and versioning.</p>
            <a href="/auth">
              <Button>Go to Login / Signup</Button>
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>1) Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createClient} className="flex gap-2">
                <Input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                <Button type="submit">Create</Button>
              </form>
              <Separator className="my-4" />
              <Label>Select client</Label>
              <Select value={selectedClientId} onValueChange={(v) => setSelectedClientId(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>2) Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProject} className="flex gap-2">
                <Input placeholder="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                <Button type="submit" disabled={!selectedClientId}>Create</Button>
              </form>
              <Separator className="my-4" />
              <Label>Select project</Label>
              <Select value={selectedProjectId} onValueChange={(v) => setSelectedProjectId(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>3) Upload Document (.doc/.docx)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadDocument} className="space-y-3">
                <Input placeholder="Document title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                <Input type="file" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                <Button type="submit" disabled={!selectedProjectId || !docFile}>Upload</Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>4) Documents in Project</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground">No documents yet.</p>
              ) : (
                <div className="space-y-2">
                  <Label>Select document</Label>
                  <Select value={selectedDocumentId} onValueChange={(v) => setSelectedDocumentId(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a document" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>5) Save/Restore Versions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={saveVersion} className="space-y-2">
                <Label htmlFor="content">Content (for quick testing)</Label>
                <Textarea id="content" placeholder="Type version content here..." value={versionContent} onChange={(e) => setVersionContent(e.target.value)} />
                <Button type="submit" disabled={!selectedDocumentId || !versionContent.trim()}>Save New Version</Button>
              </form>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Versions</Label>
                  <Button variant="secondary" onClick={() => refreshVersions(selectedDocumentId)} disabled={!selectedDocumentId}>Refresh</Button>
                </div>
                {versions.length === 0 ? (
                  <p className="text-muted-foreground">No versions yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {versions.map((v) => (
                      <li key={v.id} className="flex items-center justify-between">
                        <span className="text-sm">v{v.version_number} · {new Date(v.created_at).toLocaleString()}</span>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => restoreVersion(v.id)}>Restore</Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Share</Label>
                <Button variant="outline" onClick={createShareLink} disabled={!selectedDocumentId}>Create read-only link</Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}>Sign out</Button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Index;
