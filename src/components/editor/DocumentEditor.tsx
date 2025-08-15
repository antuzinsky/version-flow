import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Underline, Type, Share, Save } from "lucide-react";

interface DocumentEditorProps {
  document?: any;
  content: string;
  editMode: boolean;
  onContentChange: (content: string) => void;
  onEditModeToggle: () => void;
  onSave: () => void;
  onShare: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document,
  content,
  editMode,
  onContentChange,
  onEditModeToggle,
  onSave,
  onShare,
}) => {
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Select a document to start editing</p>
          <p className="text-sm">Choose a document from the workspace to view and edit its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{document.title}</h1>
          <p className="text-sm text-muted-foreground">Project Brief</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShare}
          >
            <Share className="h-4 w-4 mr-2" />
            Share link
          </Button>
          
          {editMode ? (
            <Button 
              size="sm"
              onClick={onSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Save version
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={onEditModeToggle}
              disabled={!content || content.includes("Error") || content.includes("Failed")}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {editMode && (
        <div className="border-b border-border p-2 flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Underline className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button variant="ghost" size="sm">
            <Type className="h-4 w-4" />
            H1
          </Button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-6">
        {editMode ? (
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[500px] resize-none border-0 shadow-none focus-visible:ring-0 text-base leading-relaxed"
            placeholder="Click the title to edit. Below are placeholder lines to suggest text blocks."
          />
        ) : (
          <div className="prose max-w-none">
            <div className="text-muted-foreground text-sm mb-4">
              This central area is the document editor. Click the title to edit. Below are placeholder lines to suggest text blocks.
            </div>
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              {content || "Loading document content..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};