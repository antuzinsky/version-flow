import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import * as mammoth from "mammoth";

interface VersionContentLoaderProps {
  version: any;
}

export const VersionContentLoader: React.FC<VersionContentLoaderProps> = ({ version }) => {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (!version) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // If version has direct content, use it
        if (version.content) {
          setContent(version.content);
          setLoading(false);
          return;
        }
        
        // If version has file_path, load from storage
        if (version.file_path) {
          const { data, error } = await supabase.storage
            .from("documents")
            .download(version.file_path);
          
          if (error) {
            throw new Error(`Storage error: ${error.message}`);
          }
          
          if (data) {
            let fileContent = "";
            
            if (version.file_path.endsWith('.docx')) {
              const arrayBuffer = await data.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              fileContent = result.value;
            } else {
              fileContent = await data.text();
            }
            
            setContent(fileContent);
          } else {
            throw new Error("No data received from storage");
          }
        } else {
          setContent("No content available for this version");
        }
      } catch (err: any) {
        console.error('Failed to load version content:', err);
        setError(err.message || "Failed to load content");
        setContent("");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [version]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm p-3 bg-red-50 border border-red-200 rounded text-red-700">
        Error loading content: {error}
      </div>
    );
  }

  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap bg-sidebar-accent/30 p-3 rounded">
      {content || "No content available"}
    </div>
  );
};