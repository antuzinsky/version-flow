import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Clock, GitCompare } from "lucide-react";
import DocumentComparison from "@/components/comparison/DocumentComparison";
import { normalizeContent } from "@/utils/normalizeContent";
import { supabase } from "@/integrations/supabase/client";
import { VersionContentLoader } from "./VersionContentLoader";

interface VersionsPanelProps {
  versions: any[];
  onRestore: (versionId: string) => void;
  onRefresh: () => void;
  selectedDocumentId?: string;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({
  versions,
  onRestore,
  onRefresh,
  selectedDocumentId,
}) => {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<any>(null);
  const [comparisonVersions, setComparisonVersions] = useState<{version1: any, version2: any} | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const handleVersionSelect = (versionId: string) => {
    if (isSelectionMode) {
      setSelectedVersions(prev => {
        if (prev.includes(versionId)) {
          return prev.filter(id => id !== versionId);
        } else if (prev.length < 2) {
          return [...prev, versionId];
        } else {
          // Replace the first selected version with the new one
          return [prev[1], versionId];
        }
      });
    } else {
      // Single version viewing mode
      const version = versions.find(v => v.id === versionId);
      setViewingVersion(version);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedVersions([]);
    }
  };

  const startComparison = async () => {
    if (selectedVersions.length === 2) {
      setLoadingComparison(true);
      const version1 = await getVersionData(selectedVersions[0]);
      const version2 = await getVersionData(selectedVersions[1]);
      if (version1 && version2) {
        setComparisonVersions({ version1, version2 });
        setCompareMode(true);
      }
      setLoadingComparison(false);
    }
  };

  const exitComparison = () => {
    setCompareMode(false);
    setSelectedVersions([]);
    setIsSelectionMode(false);
    setViewingVersion(null);
    setComparisonVersions(null);
  };

  const getVersionData = async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return null;
    
    let content = version.content || "";
    
    // If no content but has file_path, try to load from storage
    if (!content && version.file_path) {
      try {
        const { data, error } = await supabase.storage
          .from("documents")
          .download(version.file_path);
        
        if (!error && data) {
          if (version.file_path.endsWith('.docx')) {
            const mammoth = await import('mammoth');
            const arrayBuffer = await data.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
          } else {
            content = await data.text();
          }
        }
      } catch (err) {
        console.error('Failed to load version content:', err);
        content = "Ошибка загрузки содержимого версии";
      }
    }
    
    return {
      id: version.id,
      version_number: version.version_number,
      created_by: version.created_by,
      created_at: version.created_at,
      content: normalizeContent(content)
    };
  };

  // Single version viewing - full width layout
  if (viewingVersion) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h1 className="text-2xl font-bold text-foreground">
              Version v{viewingVersion.version_number}
            </h1>
            <Button 
              variant="outline"
              onClick={() => setViewingVersion(null)}
            >
              ← Back to Versions
            </Button>
          </div>
          <div className="p-6 pb-4 border-b">
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Created: {new Date(viewingVersion.created_at).toLocaleDateString()}</div>
              <div>By: {viewingVersion.created_by || 'Unknown'}</div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <VersionContentLoader version={viewingVersion} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compareMode && comparisonVersions) {
    return (
      <div className="fixed inset-0 bg-background z-50">
        <DocumentComparison
          version1={comparisonVersions.version1}
          version2={comparisonVersions.version2}
          onBack={exitComparison}
          documentId={selectedDocumentId}
          onVersionCreated={() => {
            onRefresh();
            exitComparison();
          }}
        />
      </div>
    );
  }

  if (loadingComparison) {
    return (
      <div className="w-80 border-l border-border bg-sidebar flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading versions...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-80 border-l border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-sidebar-foreground">Versions</h2>
          <div className="flex gap-2">
            <Button 
              variant={isSelectionMode ? "default" : "outline"} 
              size="sm"
              onClick={toggleSelectionMode}
              disabled={!selectedDocumentId || versions.length < 2}
            >
              <GitCompare className="h-4 w-4" />
            </Button>
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
        
        {isSelectionMode && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-sidebar-foreground font-medium mb-2">
              Selection Mode: {selectedVersions.length}/2 versions
            </p>
            <p className="text-xs text-sidebar-foreground/70 mb-3">
              Click on versions to select them for comparison
            </p>
            {selectedVersions.length === 2 && (
              <Button 
                size="sm" 
                onClick={startComparison}
                className="mb-2 w-full"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Selected Versions
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedVersions([])}
              className="w-full"
            >
              Clear Selection
            </Button>
          </div>
        )}
        
        {!isSelectionMode && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
            <p className="text-xs text-sidebar-foreground/70">
              Click on a version to view its content
            </p>
          </div>
        )}
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
                      selectedVersions.includes(version.id) 
                        ? 'bg-blue-100 border-blue-300' 
                        : isSelectionMode 
                          ? 'bg-sidebar-accent/50 hover:bg-sidebar-accent' 
                          : 'bg-sidebar-accent/30 hover:bg-sidebar-accent/50'
                    }`}
                    onClick={() => handleVersionSelect(version.id)}
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
                        {isSelectionMode && selectedVersions.includes(version.id) && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-sidebar-foreground/70 space-y-0.5">
                        <div>{new Date(version.created_at).toLocaleDateString()}</div>
                        <div>by {version.created_by || 'Unknown'}</div>
                        <div className="text-sidebar-foreground/50">
                          {version.content ? 'text content' : 'file content'}
                        </div>
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