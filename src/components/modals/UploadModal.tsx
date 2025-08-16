import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  projects: any[];
  selectedClientId?: string;
  selectedProjectId?: string;
  clientName: string;
  projectName: string;
  docTitle: string;
  docFile: File | null;
  onClientNameChange: (name: string) => void;
  onProjectNameChange: (name: string) => void;
  onDocTitleChange: (title: string) => void;
  onDocFileChange: (file: File | null) => void;
  onClientSelect: (clientId: string) => void;
  onProjectSelect: (projectId: string) => void;
  onCreateClient: (e: React.FormEvent) => void;
  onCreateProject: (e: React.FormEvent) => void;
  onUploadDocument: (e: React.FormEvent) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  onOpenChange,
  clients,
  projects,
  selectedClientId,
  selectedProjectId,
  clientName,
  projectName,
  docTitle,
  docFile,
  onClientNameChange,
  onProjectNameChange,
  onDocTitleChange,
  onDocFileChange,
  onClientSelect,
  onProjectSelect,
  onCreateClient,
  onCreateProject,
  onUploadDocument,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="New client name" 
                value={clientName} 
                onChange={(e) => onClientNameChange(e.target.value)} 
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={onCreateClient}
              >
                Create
              </Button>
            </div>
            <Select value={selectedClientId} onValueChange={onClientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Or select existing client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Project</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="New project name" 
                value={projectName} 
                onChange={(e) => onProjectNameChange(e.target.value)} 
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={onCreateProject}
                disabled={!selectedClientId}
              >
                Create
              </Button>
            </div>
            <Select value={selectedProjectId} onValueChange={onProjectSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Or select existing project" />
              </SelectTrigger>
              <SelectContent>
                {projects.filter(p => p.client_id === selectedClientId).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Document</Label>
            <Input 
              placeholder="Document title" 
              value={docTitle} 
              onChange={(e) => onDocTitleChange(e.target.value)} 
            />
            <Input 
              type="file" 
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
              onChange={(e) => onDocFileChange(e.target.files?.[0] ?? null)} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={onUploadDocument}
              disabled={!selectedProjectId || !docFile || !docTitle.trim()}
            >
              Upload Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};