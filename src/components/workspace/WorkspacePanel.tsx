import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Folder, Upload } from "lucide-react";

interface WorkspacePanelProps {
  projects: any[];
  documents: any[];
  selectedProjectId?: string;
  selectedDocumentId?: string;
  onProjectSelect: (projectId: string) => void;
  onDocumentSelect: (documentId: string) => void;
  onUploadClick: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  projects,
  documents,
  selectedProjectId,
  selectedDocumentId,
  onProjectSelect,
  onDocumentSelect,
  onUploadClick,
}) => {
  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-sidebar-foreground mb-3">Workspace</h1>
        <Input
          placeholder="Search docs & folders..."
          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
        />
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-2">
          {projects.map((project) => {
            const projectDocs = documents.filter((d) => d.project_id === project.id);
            return (
              <div key={project.id} className="">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                    selectedProjectId === project.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  }`}
                  onClick={() => onProjectSelect(project.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  <span className="truncate">{project.name}</span>
                </Button>

                {/* Files shown immediately */}
                <div className="ml-6 mt-1 space-y-1">
                  {projectDocs.length === 0 ? (
                    <div className="text-xs text-sidebar-foreground/60 px-2 py-1">No files</div>
                  ) : (
                    projectDocs.map((doc) => (
                      <Button
                        key={doc.id}
                        variant="ghost"
                        className={`w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                          selectedDocumentId === doc.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                        }`}
                        onClick={() => onDocumentSelect(doc.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="truncate">{doc.title}</span>
                      </Button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button
          onClick={onUploadClick}
          variant="outline"
          className="w-full justify-start bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>
    </div>
  );
};