import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import DocumentComparison from "@/components/DocumentComparison";

type Version = {
  id: string;
  version_number: number;
  content: string | null;
  created_by: string;
  created_at: string;
};

type VersionWithLatest = Version & { isLatest?: boolean };

type ShareData = {
  share: {
    token: string;
    can_edit: boolean;
    expires_at: string;
    share_type: string;
  };
  documentData: {
    id: string;
    title: string;
    file_name: string;
    content: string;
    project?: string;
    client?: string;
  };
  versions: Version[];
};

export default function Share() {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: VersionWithLatest | null;
    version2: VersionWithLatest | null;
  }>({ version1: null, version2: null });
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    (async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      console.log("token from URL:", token);
      if (!token) return;

      try {
        const res = await fetch(
          `https://nmcipsyyhnlquloudalf.supabase.co/functions/v1/get-shared-document?token=${token}`
        );
        const data = await res.json();
        console.log("response from edge:", data);

        if (data.error) {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: data.error,
          });
          return;
        }
        console.log("response from get-shared-document:", data);
        setShareData(data as ShareData);
      } catch (e: any) {
        toast({
          variant: "destructive",
          title: "Ошибка сети",
          description: e.message,
        });
      }
    })();
  }, []);

  const handleCompare = async () => {
    if (selectedVersions.size !== 2 || !shareData) return;
    const versionIds = Array.from(selectedVersions);

    const allVersionsWithLatest: VersionWithLatest[] = [
      {
        id: "latest",
        content: shareData.documentData.content || "",
        version_number: 999,
        created_by: shareData.documentData.client || "",
        created_at: new Date().toISOString(),
        isLatest: true,
      },
      ...(shareData.versions || []).map((v) => ({ ...v, isLatest: false })),
    ];

    let a = allVersionsWithLatest.find((v) => v.id === versionIds[0]);
    let b = allVersionsWithLatest.find((v) => v.id === versionIds[1]);
    if (!a || !b) return;

    const [left, right] = [a, b].sort((x, y) => {
      if (x.isLatest && !y.isLatest) return 1;
      if (!x.isLatest && y.isLatest) return -1;
      return (x.version_number || 0) - (y.version_number || 0);
    });

    if (!left.content?.trim() || !right.content?.trim()) {
      toast({
        variant: "destructive",
        title: "Нет текста",
        description: "Не удалось получить текст одной из версий",
      });
      return;
    }

    setComparisonVersions({ version1: left, version2: right });
    setIsComparing(true);
  };

  return (
    <div className="p-4">
      {isComparing && comparisonVersions.version1 && comparisonVersions.version2 ? (
        <DocumentComparison
          version1={comparisonVersions.version1}
          version2={comparisonVersions.version2}
          onBack={() => {
            setIsComparing(false);
            setComparisonVersions({ version1: null, version2: null });
          }}
        />
      ) : (
        <>
          <h1 className="text-xl font-bold mb-4">
            {shareData?.documentData?.title || "Документ"}
          </h1>
          <button
            className="btn btn-primary mb-2"
            disabled={selectedVersions.size !== 2}
            onClick={handleCompare}
          >
            Сравнить выбранные версии
          </button>
          <ul>
            {shareData?.versions?.map((v) => (
              <li key={v.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedVersions.has(v.id)}
                    onChange={(e) => {
                      setSelectedVersions((prev) => {
                        const newSet = new Set(prev);
                        if (e.target.checked) newSet.add(v.id);
                        else newSet.delete(v.id);
                        return newSet;
                      });
                    }}
                  />
                  Версия {v.version_number} (
                  {new Date(v.created_at).toLocaleString()})
                  {!v.content && (
                    <span className="ml-2 text-red-500">(нет текста)</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}