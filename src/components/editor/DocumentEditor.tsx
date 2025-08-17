import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bold, Italic, Underline, Type, Share, Save, ChevronDown, Strikethrough, Quote, Code } from "lucide-react";
import { formatBBCode, insertBBCode } from "@/utils/formatBBCode";

interface DocumentEditorProps {
  document?: any;
  content: string;
  editMode: boolean;
  onContentChange: (content: string) => void;
  onEditModeToggle: () => void;
  onSave: () => void;
  onShare: (shareType: 'latest_only' | 'all_versions') => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    onContentChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleBold = () => insertBBCodeTag('b');
  const handleItalic = () => insertBBCodeTag('i');
  const handleUnderline = () => insertBBCodeTag('u');
  const handleStrikethrough = () => insertBBCodeTag('s');
  const handleQuote = () => insertBBCodeTag('quote');
  const handleCode = () => insertBBCodeTag('code');
  const handleHeading = () => insertFormatting('# ', '');

  const insertBBCodeTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const { newContent, newPosition } = insertBBCode(content, start, end, tag);
    onContentChange(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertLineBreak = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + '\n\n' + content.substring(start);
    onContentChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  };
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onShare('latest_only')}>
                <Share className="h-4 w-4 mr-2" />
                Share Latest Version
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare('all_versions')}>
                <Share className="h-4 w-4 mr-2" />
                Share All Versions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBold}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleItalic}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleUnderline}
            title="Underline [u]"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleStrikethrough}
            title="Strikethrough [s]"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleQuote}
            title="Quote [quote]"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCode}
            title="Code [code]"
          >
            <Code className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleHeading}
            title="Heading"
          >
            <Type className="h-4 w-4" />
            H1
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={insertLineBreak}
            title="Insert line break"
          >
            ¶
          </Button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-6">
        {editMode ? (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[500px] resize-none border-0 shadow-none focus-visible:ring-0 text-base leading-relaxed font-mono"
            placeholder="Click the title to edit. Below are placeholder lines to suggest text blocks."
          />
        ) : (
          <div className="prose max-w-none">
            <div className="text-muted-foreground text-sm mb-4">
              This central area is the document editor. Click the title to edit. Below are placeholder lines to suggest text blocks.
            </div>
            <div 
              className="whitespace-pre-wrap text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatBBCode(content) || "Loading document content..." }}
            />
          </div>
        )}
      </div>
    </div>
  );
};