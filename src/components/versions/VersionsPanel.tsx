import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Clock } from "lucide-react";

interface VersionsPanelProps {
  versions: any[];
  onRestore: (versionId: string) => void;
  onRefresh: () => void;
  selectedDocumentId?: string;
  selectedVersionId?: string;
  onVersionSelect: (versionId: string) => void;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({
  versions,
  onRestore,
  onRefresh,
  selectedDocumentId,
  selectedVersionId,
  onVersionSelect,
}) => {
  return (
    <div className="w-80 border-l border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Versions</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onRefresh}
            disabled={!selectedDocumentId}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {versions.length === 0 ? (
            <div className="text-center text-sidebar-foreground/60 py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No versions yet</p>
              <p className="text-xs mt-1">Save changes to create versions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div key={version.id} className="group">
                  <div 
                    className={`flex items-start justify-between p-3 rounded-lg border border-sidebar-border transition-colors cursor-pointer ${
                      selectedVersionId === version.id 
                        ? 'bg-sidebar-accent border-sidebar-primary' 
                        : 'bg-sidebar-accent/50 hover:bg-sidebar-accent'
                    }`}
                    onClick={() => onVersionSelect(version.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-sidebar-foreground">
                          v{version.version_number}
                        </span>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-sidebar-primary text-sidebar-primary-foreground rounded-full">
                            Latest
                          </span>
                        )}
                        {selectedVersionId === version.id && (
                          <span className="text-xs px-2 py-0.5 bg-sidebar-accent text-sidebar-accent-foreground rounded-full">
                            Viewing
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-sidebar-foreground/70 space-y-0.5">
                        <div>{new Date(version.created_at).toLocaleDateString()}</div>
                        <div>by {version.created_by || 'Unknown'}</div>
                        <div className="text-sidebar-foreground/50">auto-saved</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(version.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-sidebar-foreground hover:text-sidebar-accent-foreground"
                    >
                      Restore
                    </Button>
                  </div>
                  
                  {index < versions.length - 1 && (
                    <Separator className="my-2 bg-sidebar-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};