import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Building, Folder, Calendar, AlertCircle, GitCompare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface ShareData {
  share: {
    token: string;
    can_edit: boolean;
    expires_at: string | null;
    share_type: string;
  };
  documentData: {
    id: string;
    title: string;
    file_name: string | null;
    content: string;
    project: string;
    client: string;
  };
  versions: Array<{
    id: string;
    version_number: number;
    content: string;
    created_at: string;
    created_by: string;
  }>;
}

const Share: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Shared Document · B2B Docs";
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }

    fetchSharedDocument();
  }, [token]);

  const fetchSharedDocument = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching shared document with token:', token);

      // Test direct call to edge function URL first (GET - avoids preflight)
      const directUrl = `https://nmcipsyyhnlquloudalf.supabase.co/functions/v1/get-shared-document?token=${encodeURIComponent(token)}`;
      console.log('Direct function URL:', directUrl);

      try {
        const directResponse = await fetch(directUrl, {
          method: 'GET',
        });
        console.log('Direct fetch response status:', directResponse.status);
        const directData = await directResponse.json();
        console.log('Direct fetch data:', directData);
        
        if (directResponse.ok) {
          setShareData(directData);
          setCurrentContent(directData.documentData.content || 'Test content');
          return;
        }
      } catch (directError) {
        console.error('Direct fetch failed:', directError);
      }

      // Fallback to supabase client
      const { data, error: functionError } = await supabase.functions.invoke('get-shared-document', {
        body: { token }
      });

      console.log('Supabase client response:', { data, functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        setError(`Failed to load shared document: ${functionError.message}`);
        return;
      }

      if (data.error) {
        console.error('Data error:', data.error);
        setError(data.error);
        return;
      }

      console.log('Successfully loaded share data:', data);
      setShareData(data);
      setCurrentContent(data.documentData.content);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to load shared document: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    if (!shareData) return;
    
    const version = shareData.versions.find(v => v.id === versionId);
    if (version) {
      setSelectedVersionId(versionId);
      setCurrentContent(version.content || shareData.documentData.content);
    }
  };

  const resetToLatest = () => {
    if (!shareData) return;
    setSelectedVersionId(null);
    setCurrentContent(shareData.documentData.content);
  };

  const handleVersionCheckboxChange = (versionId: string, checked: boolean) => {
    const newSelected = new Set(selectedVersions);
    if (checked) {
      newSelected.add(versionId);
    } else {
      newSelected.delete(versionId);
    }
    setSelectedVersions(newSelected);
  };

  const clearSelectedVersions = () => {
    setSelectedVersions(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-lg font-medium">Loading shared document...</p>
          <p className="text-sm text-muted-foreground">Please wait while we fetch the content</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              {error || "This shared document could not be found or has expired."}
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { share, documentData, versions } = shareData;
  const expiresAt = share.expires_at ? new Date(share.expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  const showVersions = (versions?.length ?? 0) > 0; // показываем, если версии вообще есть
  const selectedVersion = selectedVersionId ? versions.find(v => v.id === selectedVersionId) : null;

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-destructive">Link Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This shared document link has expired and is no longer accessible.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">B2B Docs</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {share.share_type === 'all_versions' ? 'All Versions' : 'Latest Version'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {share.can_edit && (
                <Badge variant="outline">Can Edit</Badge>
              )}
              {expiresAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Expires {expiresAt.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Sidebar - Versions Panel */}
        {showVersions && (
          <aside className="w-80 border-r border-border bg-card/30">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Версии</h2>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetToLatest}
                    disabled={!selectedVersionId}
                  >
                    Show Latest
                  </Button>
                  {selectedVersions.size > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearSelectedVersions}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Compare Controls */}
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-xs">
                  {selectedVersions.size} выбрано
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  disabled={selectedVersions.size < 2}
                >
                  <GitCompare className="h-3 w-3" />
                  Compare
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-3">
                {/* Latest version first */}
                <div 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    !selectedVersionId ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={resetToLatest}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedVersions.has('latest')}
                      onCheckedChange={(checked) => handleVersionCheckboxChange('latest', checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Latest (Compiled)</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetToLatest();
                          }}
                        >
                          Open
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleDateString()} • {documentData.client}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Version history */}
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVersionId === version.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleVersionSelect(version.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedVersions.has(version.id)}
                        onCheckedChange={(checked) => handleVersionCheckboxChange(version.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">V{version.version_number} — {version.created_by}</div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVersionSelect(version.id);
                            }}
                          >
                            Open
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(version.created_at).toLocaleDateString()} • {version.created_by}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <div className="p-6 max-w-4xl mx-auto">
              {/* Document Info */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">
                      {documentData.title} — {selectedVersion ? `V${selectedVersion.version_number}` : 'Latest (Compiled)'}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{documentData.client}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder className="h-4 w-4" />
                        <span>{documentData.project}</span>
                      </div>
                      {documentData.file_name && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{documentData.file_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Последнее обновление • {selectedVersion ? new Date(selectedVersion.created_at).toLocaleDateString() : new Date().toLocaleDateString()} • автор: {selectedVersion?.created_by || documentData.client}
                  </div>
                </div>
              </div>

              {/* Document Content */}
              <Card>
                <CardContent className="p-8">
                  <div className="prose max-w-none">
                    {currentContent.includes('[DOCX file') ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">DOCX File Shared</p>
                        <p className="text-sm">
                          This is a Microsoft Word document. The original file formatting cannot be displayed in the browser.
                        </p>
                        <p className="text-sm mt-2">
                          File: <span className="font-mono">{documentData.file_name}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-base leading-relaxed">
                        {currentContent || "This document appears to be empty."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <footer className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                <p>
                  Shared via{" "}
                  <a href="/" className="text-primary hover:underline">
                    B2B Docs
                  </a>
                </p>
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Share;