import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';
import DocumentComparison from '@/components/DocumentComparison';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Version = {
  id: string;
  version_number: number;
  content: string | null;
  created_by: string;
  created_at: string;
};

type VersionWithLatest = Version & { isLatest?: boolean };

type ShareData = {
  token: string;
  can_edit: boolean;
  expires_at: string;
  share_type: string;
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
  const [showChangesPanel, setShowChangesPanel] = useState(false);

  useEffect(() => {
    // Загружаем данные шары документа
    (async () => {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) return;
      const { data, error } = await supabase.functions.invoke('get-shared-document', {
        body: { token }
      });
      if (error) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить документ' });
        return;
      }
      setShareData(data as ShareData);
    })();
  }, []);

  // Хелпер: дозагружаем content версии, если он пустой
  async function ensureVersionContent(v: VersionWithLatest): Promise<VersionWithLatest> {
    if (v.isLatest) return v;
    if (v.content && v.content.trim() !== '') return v;

    try {
      // Пробуем через edge-функцию
      const { data, error } = await supabase.functions.invoke('get-document-version', {
        body: { versionId: v.id }
      });
      if (!error && data?.content) return { ...v, content: data.content };
    } catch (e) {
      console.warn('Edge function failed, fallback to table', e);
    }

    try {
      // Фоллбек — читать напрямую из таблицы (если RLS разрешает)
      const { data: row, error } = await supabase
        .from('document_versions')
        .select('content')
        .eq('id', v.id)
        .maybeSingle();
      if (!error && row?.content) return { ...v, content: row.content };
    } catch (e) {
      console.error('Direct fetch failed', e);
    }

    return v;
  }

  const handleCompare = async () => {
    if (selectedVersions.size !== 2) return;
    const versionIds = Array.from(selectedVersions);

    const allVersionsWithLatest: VersionWithLatest[] = [
      {
        id: 'latest',
        content: shareData?.documentData.content || '',
        version_number: 999,
        created_by: shareData?.documentData.client || '',
        created_at: new Date().toISOString(),
        isLatest: true
      },
      ...(shareData?.versions || []).map(v => ({ ...v, isLatest: false }))
    ];

    let a = allVersionsWithLatest.find(v => v.id === versionIds[0]);
    let b = allVersionsWithLatest.find(v => v.id === versionIds[1]);
    if (!a || !b) return;

    [a, b] = await Promise.all([ensureVersionContent(a), ensureVersionContent(b)]);

    console.table(
      [a, b].map(v => ({
        id: v.id,
        ver: v.version_number,
        latest: !!v.isLatest,
        contentLen: v.content ? v.content.length : 0
      }))
    );

    if (!a.content?.trim() || !b.content?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Нет текста',
        description: 'Не удалось получить текст одной из версий'
      });
      return;
    }

    const [left, right] = [a, b].sort((x, y) => {
      if (x.isLatest && !y.isLatest) return 1;
      if (!x.isLatest && y.isLatest) return -1;
      return (x.version_number || 0) - (y.version_number || 0);
    });

    setComparisonVersions({ version1: left, version2: right });
    setIsComparing(true);
    setShowChangesPanel(true);
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
          <h1 className="text-xl font-bold mb-4">{shareData?.documentData.title}</h1>
          <button
            className="btn btn-primary mb-2"
            disabled={selectedVersions.size !== 2}
            onClick={handleCompare}
          >
            Сравнить выбранные версии
          </button>
          <ul>
            {shareData?.versions?.map(v => (
              <li key={v.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedVersions.has(v.id)}
                    onChange={e => {
                      setSelectedVersions(prev => {
                        const newSet = new Set(prev);
                        if (e.target.checked) newSet.add(v.id);
                        else newSet.delete(v.id);
                        return newSet;
                      });
                    }}
                  />
                  Версия {v.version_number} ({new Date(v.created_at).toLocaleString()})
                  {!v.content && <span className="ml-2 text-red-500">(нет текста)</span>}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}