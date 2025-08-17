import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Palette } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkspacePanelProps {
  documents: any[];
  selectedDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  onUploadClick: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  documents,
  selectedDocumentId,
  onDocumentSelect,
  onUploadClick,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [backgroundColor, setBackgroundColor] = React.useState("default");

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBackgroundClass = () => {
    switch (backgroundColor) {
      case "blue": return "bg-blue-50 dark:bg-blue-950/20";
      case "green": return "bg-green-50 dark:bg-green-950/20";
      case "purple": return "bg-purple-50 dark:bg-purple-950/20";
      case "orange": return "bg-orange-50 dark:bg-orange-950/20";
      default: return "bg-sidebar";
    }
  };

  return (
    <div className={`w-80 border-r border-border ${getBackgroundClass()} flex flex-col h-full transition-colors duration-200`}>
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-3">Documents</h2>
        <div className="space-y-3">
          <Input 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
          />
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-sidebar-foreground/60" />
            <Select value={backgroundColor} onValueChange={setBackgroundColor}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {filteredDocuments.length === 0 ? (
            <div className="text-center text-sidebar-foreground/60 p-4">
              {searchTerm ? 'No documents found' : 'No documents yet'}
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <Button
                key={doc.id}
                variant="ghost"
                className={`w-full justify-start h-10 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                  selectedDocumentId === doc.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                }`}
                onClick={() => onDocumentSelect(doc.id)}
              >
                <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="truncate text-sm font-medium">{doc.title}</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <Button 
          onClick={onUploadClick}
          variant="outline" 
          className="w-full justify-start bg-sidebar-accent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/80"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>
    </div>
  );
};