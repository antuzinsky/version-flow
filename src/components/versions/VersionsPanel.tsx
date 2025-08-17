import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Clock, GitCompare } from "lucide-react";
import DocumentComparison from "@/components/comparison/DocumentComparison";
import { normalizeContent } from "@/utils/normalizeContent";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface VersionsPanelProps {
  versions: any[];
  onRestore: (versionId: string) => void;
  onRefresh: () => void;
  selectedDocumentId?: string;
  latestContent?: string;
  onVersionCreated?: () => void;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({
  versions,
  onRestore,
  onRefresh,
  selectedDocumentId,
  latestContent = "",
  onVersionCreated,
}) => {
  const { toast } = useToast();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<any>(null);
  const [comparisonVersions, setComparisonVersions] = useState<{version1: any, version2: any} | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [versionContent, setVersionContent] = useState("");
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  const handleVersionSelect = async (versionId: string) => {
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
      // Single version viewing mode - load content for editing
      const version = versions.find(v => v.id === versionId);
      if (version) {
        setViewingVersion(version);
        const content = await loadVersionContent(version);
        setVersionContent(content);
      }
    }
  };

  const loadVersionContent = async (version: any): Promise<string> => {
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
    
    return normalizeContent(content);
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

  const handleSaveNewVersion = async () => {
    if (!selectedDocumentId || !versionContent.trim()) return;

    setIsCreatingVersion(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { error } = await supabase
        .from('document_versions')
        .insert({
          document_id: selectedDocumentId,
          content: versionContent,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Новая версия документа создана",
      });

      onVersionCreated?.();
      setViewingVersion(null);
      setVersionContent("");
    } catch (error) {
      console.error('Error creating version:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать новую версию",
        variant: "destructive",
      });
    } finally {
      setIsCreatingVersion(false);
    }
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

  // Single version viewing - side by side with versions panel
  if (viewingVersion) {
    return (
      <div className="flex h-full">
        {/* Центральная область с редактором */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">
              Версия V{viewingVersion.version_number}
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewingVersion(null);
                  setVersionContent("");
                }}
              >
                ← Закрыть просмотр
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Создано: {new Date(viewingVersion.created_at).toLocaleString()}
              </div>
            </div>

            <Textarea
              value={versionContent}
              onChange={(e) => setVersionContent(e.target.value)}
              className="min-h-[400px] resize-none"
              placeholder="Содержимое версии..."
            />

            <div className="flex gap-2 mt-4">
              <Button 
                onClick={handleSaveNewVersion}
                disabled={isCreatingVersion || !versionContent.trim()}
              >
                {isCreatingVersion ? "Сохранение..." : "Сохранить как новую версию"}
              </Button>
            </div>
          </div>
        </div>

        {/* Правая панель с версиями */}
        {renderVersionsList()}
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

  return renderVersionsList();

  function renderVersionsList() {
    return (
      <div className="w-80 border-l border-border bg-sidebar flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-sidebar-foreground">Версии</h2>
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
                Режим выбора: {selectedVersions.length}/2 версии
              </p>
              <p className="text-xs text-sidebar-foreground/70 mb-3">
                Кликните на версии для сравнения
              </p>
              {selectedVersions.length === 2 && (
                <Button 
                  size="sm" 
                  onClick={startComparison}
                  className="mb-2 w-full"
                >
                  <GitCompare className="h-4 w-4 mr-2" />
                  Сравнить версии
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedVersions([])}
                className="w-full"
              >
                Очистить выбор
              </Button>
            </div>
          )}
          
          {!isSelectionMode && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p className="text-xs text-sidebar-foreground/70">
                Кликните на версию для просмотра и редактирования
              </p>
            </div>
          )}
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            {versions.length === 0 ? (
              <div className="text-center text-sidebar-foreground/60 py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет версий</p>
                <p className="text-xs mt-1">Сохраните изменения для создания версий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version, index) => (
                  <div key={version.id} className="group">
                    <div 
                      className={`flex items-start justify-between p-3 rounded-lg border border-sidebar-border transition-colors cursor-pointer ${
                        selectedVersions.includes(version.id) 
                          ? 'bg-blue-100 border-blue-300' 
                          : viewingVersion?.id === version.id
                            ? 'bg-green-100 border-green-300'
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
                              Последняя
                            </span>
                          )}
                          {isSelectionMode && selectedVersions.includes(version.id) && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                              Выбрана
                            </span>
                          )}
                          {viewingVersion?.id === version.id && (
                            <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded-full">
                              Просматривается
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
                        Восстановить
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
  }
};