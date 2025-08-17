import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Palette, Edit, Trash2, MoreVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface WorkspacePanelProps {
  documents: any[];
  selectedDocumentId?: string;
  onDocumentSelect: (documentId: string) => void;
  onUploadClick: () => void;
  onDocumentsChange: () => void;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  documents,
  selectedDocumentId,
  onDocumentSelect,
  onUploadClick,
  onDocumentsChange,
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("default");
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRename = async (documentId: string) => {
    if (!newTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from("documents")
        .update({ title: newTitle.trim() })
        .eq("id", documentId);

      if (error) throw error;
      
      onDocumentsChange();
      setEditingDocument(null);
      setNewTitle("");
      toast({
        title: "Document renamed",
        description: "Document title updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to rename document: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      
      onDocumentsChange();
      toast({
        title: "Document deleted",
        description: "Document removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: "Failed to delete document: " + error.message,
        variant: "destructive",
      });
    }
  };

  const startEditing = (document: any) => {
    setEditingDocument(document.id);
    setNewTitle(document.title);
  };

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
              <div
                key={doc.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedDocumentId === doc.id 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'hover:bg-sidebar-accent/50'
                }`}
                onClick={() => onDocumentSelect(doc.id)}
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-sidebar-foreground/60" />
                <div className="flex-1 min-w-0">
                  {editingDocument === doc.id ? (
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(doc.id);
                        if (e.key === 'Escape') {
                          setEditingDocument(null);
                          setNewTitle("");
                        }
                      }}
                      onBlur={() => {
                        setEditingDocument(null);
                        setNewTitle("");
                      }}
                      autoFocus
                      className="text-sm h-6 px-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="truncate text-sm font-medium text-sidebar-foreground">{doc.title}</div>
                      <div className="text-xs text-sidebar-foreground/60">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      startEditing(doc);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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