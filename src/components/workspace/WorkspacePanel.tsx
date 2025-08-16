import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronDown, FileText, Folder, Upload } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WorkspacePanelProps {
  clients: any[];
  projects: any[];
  documents: any[];
  selectedClientId?: string;
  selectedProjectId?: string;
  selectedDocumentId?: string;
  onClientSelect: (clientId: string) => void;
  onProjectSelect: (projectId: string) => void;
  onDocumentSelect: (documentId: string) => void;
  onUploadClick: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  clients,
  projects,
  documents,
  selectedClientId,
  selectedProjectId,
  selectedDocumentId,
  onClientSelect,
  onProjectSelect,
  onDocumentSelect,
  onUploadClick,
}) => {
  const [openFolders, setOpenFolders] = React.useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(folderId)) {
      newOpenFolders.delete(folderId);
    } else {
      newOpenFolders.add(folderId);
    }
    setOpenFolders(newOpenFolders);
  };

  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-3">Workspace</h2>
        <Input 
          placeholder="Search docs & folders..." 
          className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
        />
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {clients.map((client) => {
            const clientProjects = projects.filter(p => p.client_id === client.id);
            const isOpen = openFolders.has(client.id);
            
            return (
              <Collapsible key={client.id} open={isOpen} onOpenChange={() => toggleFolder(client.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-1" />
                    )}
                    <Folder className="h-4 w-4 mr-2" />
                    <span className="truncate">{client.name}</span>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="ml-4">
                  {clientProjects.map((project) => {
                    const projectDocs = documents.filter(d => d.project_id === project.id);
                    const isProjectOpen = openFolders.has(project.id);
                    
                    return (
                      <div key={project.id}>
                        <Collapsible open={isProjectOpen} onOpenChange={() => toggleFolder(project.id)}>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              onClick={() => onProjectSelect(project.id)}
                            >
                              {isProjectOpen ? (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronRight className="h-4 w-4 mr-1" />
                              )}
                              <Folder className="h-4 w-4 mr-2" />
                              <span className="truncate">{project.name}</span>
                            </Button>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="ml-4">
                            {projectDocs.map((doc) => (
                              <Button
                                key={doc.id}
                                variant="ghost"
                                className={`w-full justify-start h-8 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                                  selectedDocumentId === doc.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                                }`}
                                onClick={() => onDocumentSelect(doc.id)}
                              >
                                <FileText className="h-4 w-4 mr-2 ml-3" />
                                <span className="truncate">{doc.title}</span>
                              </Button>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
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