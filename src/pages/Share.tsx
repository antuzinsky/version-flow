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
  };
  document: {
    id: string;
    title: string;
    file_name: string | null;
    content: string;
    project: string;
    client: string;
  };
}

const Share: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const { data, error: functionError } = await supabase.functions.invoke('get-shared-document', {
        body: { token }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        setError('Failed to load shared document');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setShareData(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load shared document');
    } finally {
      setLoading(false);
    }
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

  const { share, document } = shareData;
  const expiresAt = share.expires_at ? new Date(share.expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();

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
                Shared Document
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
          <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              <span>{document.client}</span>
            </div>
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>{document.project}</span>
            </div>
            {document.file_name && (
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{document.file_name}</span>
              </div>
            )}
          </div>
        </div>

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
              {document.content.includes('[DOCX file') ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">DOCX File Shared</p>
                  <p className="text-sm">
                    This is a Microsoft Word document. The original file formatting cannot be displayed in the browser.
                  </p>
                  <p className="text-sm mt-2">
                    File: <span className="font-mono">{document.file_name}</span>
                  </p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {document.content || "This document appears to be empty."}
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