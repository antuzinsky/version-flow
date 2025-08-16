import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Building, Folder, Calendar, AlertCircle } from "lucide-react";
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
  const showVersions = share.share_type === 'all_versions' && versions.length > 0;
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

      {/* Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Document Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{documentData.title}</h1>
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

        {/* Version Selector */}
        {showVersions && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Version History</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetToLatest}
                  disabled={!selectedVersionId}
                >
                  Show Latest
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {versions.map((version) => (
                  <Button
                    key={version.id}
                    variant={selectedVersionId === version.id ? "default" : "outline"}
                    className="h-auto p-4 text-left flex flex-col items-start"
                    onClick={() => handleVersionSelect(version.id)}
                  >
                    <div className="font-medium">v{version.version_number}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(version.created_at).toLocaleDateString()}
                    </div>
                    {selectedVersionId === version.id && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Current View
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              {selectedVersion && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Viewing:</strong> Version {selectedVersion.version_number} from{' '}
                    {new Date(selectedVersion.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator className="mb-8" />

        {/* Document Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Content
            </CardTitle>
          </CardHeader>
          <CardContent>
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
      </main>
    </div>
  );
};

export default Share;