// src/pages/Share.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Building, Folder, Calendar, AlertCircle, GitCompare, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import DocumentComparison from "@/components/comparison/DocumentComparison";
import { normalizeContent } from "@/utils/normalizeContent";
import { formatBBCode } from "@/utils/formatBBCode";

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
    content: string;     // компилированный/актуальный текст
    project: string;
    client: string;
  };
  versions: Array<{
    id: string;
    version_number: number;
    content: string | null; // в БД может быть null
    created_at: string;
    created_by: string;
  }>;
}

type VersionWithLatest = {
  id: string;
  version_number: number;
  content: string;      // уже нормализованный текст
  created_at: string;
  created_by: string;
  isLatest: boolean;
};

const Share: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // выбор и просмотр одной версии
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<string>("");

  // сравнение двух версий
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: VersionWithLatest;
    version2: VersionWithLatest;
  } | null>(null);

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

      // пробуем прямой GET к Edge Function (без CORS preflight)
      const directUrl = `https://nmcipsyyhnlquloudalf.supabase.co/functions/v1/get-shared-document?token=${encodeURIComponent(
        token!
      )}`;
      const r = await fetch(directUrl, { method: "GET" });
      const directData = await r.json();

      if (r.ok) {
        setShareData(directData);
        setCurrentContent(directData.documentData.content || "");
        return;
      }

      // fallback через supabase client
      const { data, error: fnErr } = await supabase.functions.invoke(
        "get-shared-document",
        { body: { token } }
      );

      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      setShareData(data);
      setCurrentContent(data.documentData.content || "");
    } catch (err: any) {
      setError(`Failed to load shared document: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // ---------- просмотр конкретной версии ----------
  const handleVersionSelect = (versionId: string) => {
    if (!shareData) return;
    const v = shareData.versions.find((x) => x.id === versionId);
    if (!v) return;

    setSelectedVersionId(versionId);
    setCurrentContent(normalizeContent(v.content ?? shareData.documentData.content));
  };

  const resetToLatest = () => {
    if (!shareData) return;
    setSelectedVersionId(null);
    setCurrentContent(normalizeContent(shareData.documentData.content));
  };

  // ---------- выбор двух версий для сравнения ----------
  const handleVersionCheckboxChange = (versionId: string, checked: boolean) => {
    setSelectedVersions((prev) => {
      const next = new Set(prev);
      if (checked) next.add(versionId);
      else next.delete(versionId);
      return next;
    });
  };

  const clearSelectedVersions = () => setSelectedVersions(new Set());

  // Преобразуем ID -> нормализованная версия с текстом
  const makeComparable = (id: string): VersionWithLatest | null => {
    if (!shareData) return null;

    if (id === "latest") {
      return {
        id: "latest",
        version_number: 999,
        content: normalizeContent(shareData.documentData.content),
        created_at: new Date().toISOString(),
        created_by: shareData.documentData.client || "system",
        isLatest: true,
      };
    }

    const v = shareData.versions.find((x) => x.id === id);
    if (!v) return null;

    return {
      id: v.id,
      version_number: v.version_number,
      content: normalizeContent(v.content ?? shareData.documentData.content),
      created_at: v.created_at,
      created_by: v.created_by,
      isLatest: false,
    };
  };

  const handleCompare = () => {
    if (selectedVersions.size !== 2 || !shareData) return;

    const [id1, id2] = Array.from(selectedVersions);
    const v1 = makeComparable(id1);
    const v2 = makeComparable(id2);
    if (!v1 || !v2) return;

    // слева — более старая, справа — более новая; latest считаем самой новой
    const [left, right] = [v1, v2].sort((a, b) => {
      if (a.isLatest && !b.isLatest) return 1;
      if (!a.isLatest && b.isLatest) return -1;
      return (a.version_number ?? 0) - (b.version_number ?? 0);
    });

    setComparisonVersions({ version1: left, version2: right });
    setIsComparing(true);
  };

  const exitComparison = () => {
    setIsComparing(false);
    setComparisonVersions(null);
    setSelectedVersions(new Set());
  };

  // ---------- состояния загрузки/ошибок ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-lg font-medium">Loading shared document...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the content
          </p>
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
            <Button onClick={() => (window.location.href = "/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { share, documentData, versions } = shareData;
  const expiresAt = share.expires_at ? new Date(share.expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  const showVersions = (versions?.length ?? 0) > 0;
  const selectedVersion = selectedVersionId
    ? versions.find((v) => v.id === selectedVersionId)
    : null;

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
            <Button onClick={() => (window.location.href = "/")}>Go to Homepage</Button>
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
                {share.share_type === "all_versions" ? "All Versions" : "Latest Version"}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {share.can_edit && <Badge variant="outline">Can Edit</Badge>}
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
        {/* Левый сайдбар с версионированием — показываем ТОЛЬКО вне режима сравнения */}
        {showVersions && !isComparing && (
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
                    <Button variant="outline" size="sm" onClick={clearSelectedVersions}>
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
                  disabled={selectedVersions.size !== 2}
                  onClick={handleCompare}
                >
                  <GitCompare className="h-3 w-3" />
                  Compare
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-3">
                {/* Latest */}
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    !selectedVersionId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={resetToLatest}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedVersions.has("latest")}
                      onCheckedChange={(checked) =>
                        handleVersionCheckboxChange("latest", checked as boolean)
                      }
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

                {/* История версий */}
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedVersionId === version.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => handleVersionSelect(version.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedVersions.has(version.id)}
                        onCheckedChange={(checked) =>
                          handleVersionCheckboxChange(version.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            V{version.version_number} — {version.created_by}
                          </div>
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
                          {new Date(version.created_at).toLocaleDateString()} •{" "}
                          {version.created_by}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Основная область */}
        <main className={`flex-1 overflow-hidden ${isComparing ? "flex" : ""}`}>
          {isComparing && comparisonVersions ? (
            <>
              {/* Заголовок сравнения */}
              <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Сравнение версий</h2>
                    <Badge variant="secondary">
                      {comparisonVersions.version1.isLatest
                        ? "Latest"
                        : `V${comparisonVersions.version1.version_number}`}{" "}
                      {" vs "}
                      {comparisonVersions.version2.isLatest
                        ? "Latest"
                        : `V${comparisonVersions.version2.version_number}`}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exitComparison}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Выйти из сравнения
                  </Button>
                </div>
              </div>

              {/* Контент сравнения: ВЕСЬ UI (центр + правый сайдбар) лежит внутри DocumentComparison */}
              <div className="flex-1 pt-20 p-6">
                <DocumentComparison
                  version1={comparisonVersions.version1}
                  version2={comparisonVersions.version2}
                  onBack={exitComparison}
                  documentId={documentData.id}
                  onVersionCreated={() => {
                    // Перезагружаем данные после создания новой версии
                    setSelectedVersions(new Set());
                    setComparisonVersions(null);
                    // Можно добавить рефеч данных документа
                  }}
                />
              </div>
            </>
          ) : (
            <div className="h-full overflow-auto">
              <div className="p-6 max-w-4xl mx-auto">
                {/* Информация о документе */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">
                        {documentData.title} —{" "}
                        {selectedVersion ? `V${selectedVersion.version_number}` : "Latest (Compiled)"}
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
                      Последнее обновление •{" "}
                      {selectedVersion
                        ? new Date(selectedVersion.created_at).toLocaleDateString()
                        : new Date().toLocaleDateString()}{" "}
                      • автор: {selectedVersion?.created_by || documentData.client}
                    </div>
                  </div>
                </div>

                {/* Содержимое документа */}
                <Card>
                  <CardContent className="p-8">
                    <div className="prose max-w-none">
                      {currentContent.includes("[DOCX file") ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">DOCX File Shared</p>
                          <p className="text-sm">
                            This is a Microsoft Word document. The original file formatting cannot
                            be displayed in the browser.
                          </p>
                          <p className="text-sm mt-2">
                            File: <span className="font-mono">{documentData.file_name}</span>
                          </p>
                        </div>
                      ) : (
                         <div
                           className="whitespace-pre-wrap text-base leading-relaxed"
                           dangerouslySetInnerHTML={{
                             __html: formatBBCode(currentContent) || "This document appears to be empty.",
                           }}
                         />
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
          )}
        </main>
      </div>
    </div>
  );
};

export default Share;
