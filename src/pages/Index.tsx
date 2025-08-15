import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import * as mammoth from "mammoth";
import { WorkspacePanel } from "@/components/workspace/WorkspacePanel";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { VersionsPanel } from "@/components/versions/VersionsPanel";
import { UploadModal } from "@/components/modals/UploadModal";

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

  // Document editing states
  const [currentDocument, setCurrentDocument] = useState<any>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  
  // UI states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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
  useEffect(() => { 
    refreshVersions(selectedDocumentId); 
    if (selectedDocumentId) {
      const doc = documents.find(d => d.id === selectedDocumentId);
      setCurrentDocument(doc);
      if (doc) {
        loadDocumentContent(doc);
      }
    } else {
      setCurrentDocument(null);
      setDocumentContent("");
      setEditMode(false);
    }
  }, [selectedDocumentId, documents]);

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

  const loadDocumentContent = async (document: any) => {
    if (!document?.file_path) {
      setDocumentContent("No file uploaded for this document.");
      return;
    }

    try {
      // Download the file from storage
      const { data, error } = await supabase.storage
        .from("documents")
        .download(document.file_path);

      if (error) {
        toast({ title: "Failed to load document", description: error.message, variant: "destructive" });
        setDocumentContent("Failed to load document content.");
        return;
      }

      // Parse content based on file type
      if (document.file_name?.endsWith('.docx')) {
        try {
          const arrayBuffer = await data.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          setDocumentContent(result.value || "Empty document");
        } catch (err) {
          setDocumentContent("Error parsing .docx file. Raw content not available.");
        }
      } else if (document.file_name?.endsWith('.doc')) {
        setDocumentContent("Legacy .doc files not fully supported. Please use .docx format for better editing experience.");
      } else {
        // Try to read as text
        const text = await data.text();
        setDocumentContent(text);
      }
    } catch (err) {
      setDocumentContent("Error loading document content.");
      toast({ title: "Load error", description: "Failed to load document", variant: "destructive" });
    }
  };

  const saveDocumentEdit = async () => {
    if (!userId || !selectedDocumentId || !documentContent.trim()) return;
    
    const { error } = await supabase
      .from("document_versions")
      .insert({ 
        document_id: selectedDocumentId, 
        created_by: userId, 
        content: documentContent.trim() 
      });
      
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document saved as new version" });
      setEditMode(false);
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
      // Update current content if restored version has content
      if (v.content) {
        setDocumentContent(v.content);
      }
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
    <div className="h-screen flex bg-background">
      <WorkspacePanel
        clients={clients}
        projects={projects}
        documents={documents}
        selectedClientId={selectedClientId}
        selectedProjectId={selectedProjectId}
        selectedDocumentId={selectedDocumentId}
        onClientSelect={setSelectedClientId}
        onProjectSelect={setSelectedProjectId}
        onDocumentSelect={setSelectedDocumentId}
        onUploadClick={() => setUploadModalOpen(true)}
      />
      
      <DocumentEditor
        document={currentDocument}
        content={documentContent}
        editMode={editMode}
        onContentChange={setDocumentContent}
        onEditModeToggle={() => setEditMode(!editMode)}
        onSave={saveDocumentEdit}
        onShare={createShareLink}
      />
      
      <VersionsPanel
        versions={versions}
        onRestore={restoreVersion}
        onRefresh={() => refreshVersions(selectedDocumentId)}
        selectedDocumentId={selectedDocumentId}
      />

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        clients={clients}
        projects={projects}
        selectedClientId={selectedClientId}
        selectedProjectId={selectedProjectId}
        clientName={clientName}
        projectName={projectName}
        docTitle={docTitle}
        docFile={docFile}
        onClientNameChange={setClientName}
        onProjectNameChange={setProjectName}
        onDocTitleChange={setDocTitle}
        onDocFileChange={setDocFile}
        onClientSelect={setSelectedClientId}
        onProjectSelect={setSelectedProjectId}
        onCreateClient={createClient}
        onCreateProject={createProject}
        onUploadDocument={uploadDocument}
      />
      
      {/* Quick test area - can be removed later */}
      {selectedDocumentId && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="p-4 w-80">
            <h4 className="font-medium mb-2">Quick Version Test</h4>
            <form onSubmit={saveVersion} className="space-y-2">
              <textarea 
                className="w-full h-20 p-2 border rounded text-sm resize-none"
                placeholder="Type test content..." 
                value={versionContent} 
                onChange={(e) => setVersionContent(e.target.value)} 
              />
              <Button 
                type="submit" 
                size="sm" 
                className="w-full"
                disabled={!selectedDocumentId || !versionContent.trim()}
              >
                Save Test Version
              </Button>
            </form>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
            >
              Sign Out
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;
