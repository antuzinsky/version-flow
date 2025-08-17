import React, { useState } from "react";
import { useDocumentDiff } from "@/hooks/useDocumentDiff";
import ChangesPanel from "./ChangesPanel";
import PreviewPanel from "./PreviewPanel";
import type { Change } from "@/types/change";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DocVersion = {
  id: string;
  version_number?: number;
  created_by?: string;
  created_at?: string;
  isLatest?: boolean;
  content: string; // уже нормализованный текст
};

interface Props {
  version1: DocVersion; // старая
  version2: DocVersion; // новая
  onBack?: () => void;
  documentId?: string;
  onVersionCreated?: () => void;
}

function DiffChunk({
  change,
  side, // 'left' | 'right'
  onAccept,
  onReject,
}: {
  change: Change;
  side: "left" | "right";
  onAccept: () => void;
  onReject: () => void;
}) {
  const isRemoved = change.type === "removed";
  const isAdded = change.type === "added";
  const isNeutral = change.type === null;

  if (side === "left" && !(isNeutral || isRemoved)) return null;
  if (side === "right" && !(isNeutral || isAdded)) return null;

  const base = "px-0.5 rounded";
  let cls = "";
  if (isNeutral) {
    cls = "";
  } else if (isRemoved && side === "left") {
    cls =
      change.status === "accepted"
        ? "bg-red-50 line-through opacity-70"
        : change.status === "rejected"
        ? "bg-transparent opacity-40"
        : "bg-red-100";
  } else if (isAdded && side === "right") {
    cls =
      change.status === "accepted"
        ? "bg-green-50"
        : change.status === "rejected"
        ? "bg-transparent opacity-40 line-through"
        : "bg-green-100";
  }

  const showControls =
    (side === "left" && isRemoved) || (side === "right" && isAdded);

  return (
    <span 
      id={change.type !== null ? `change-${change.id}` : undefined}
      className={`${base} ${cls} transition-colors duration-500`}
    >
      {change.content}
      {showControls && (
        <span className="ml-1 select-none">
          {change.status !== "accepted" && (
            <button
              className="inline-block text-[11px] px-1 py-[1px] rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onAccept}
              title="Принять изменение"
            >
              ✓
            </button>
          )}
          {change.status !== "rejected" && (
            <button
              className="inline-block text-[11px] px-1 py-[1px] rounded bg-rose-600 text-white hover:bg-rose-700 ml-1"
              onClick={onReject}
              title="Отклонить изменение"
            >
              ✕
            </button>
          )}
        </span>
      )}
    </span>
  );
}

export default function DocumentComparison({ 
  version1, 
  version2, 
  onBack, 
  documentId,
  onVersionCreated 
}: Props) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const { toast } = useToast();
  
  const { changes, applyChange, applyAll, rejectAll, resetAll, stats } =
    useDocumentDiff(version1.content, version2.content);

  // Создание финального контента на основе принятых изменений
  const generateFinalContent = () => {
    let result = "";
    changes.forEach(change => {
      if (change.type === null) {
        // Неизменённый текст
        result += change.content;
      } else if (change.type === "added" && change.status === "accepted") {
        // Принятые добавления
        result += change.content;
      } else if (change.type === "removed" && change.status === "rejected") {
        // Отклонённые удаления (сохраняем текст)
        result += change.content;
      }
      // Принятые удаления и отклонённые добавления игнорируем
    });
    return result;
  };

  const handleCreateNewVersion = async () => {
    if (!documentId) {
      toast({
        title: "Ошибка",
        description: "Не указан ID документа",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingVersion(true);
    try {
      const finalContent = generateFinalContent();
      
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }
      
      // Создаём новую версию напрямую в базе данных
      const { error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          content: finalContent,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Новая версия документа создана",
      });

      onVersionCreated?.();
      onBack?.();
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

  const handleNavigateToChange = (changeId: number) => {
    const element = document.getElementById(`change-${changeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = '#fef3c7';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  };

  if (isPreviewMode) {
    return (
      <div className="h-full">
        <PreviewPanel
          changes={changes}
          finalContent={generateFinalContent()}
          onAcceptVersion={handleCreateNewVersion}
          onCancelPreview={() => setIsPreviewMode(false)}
          isCreating={isCreatingVersion}
        />
      </div>
    );
  }

  // если вдруг одна сторона реально пустая — покажем заметку, чтобы не было «весь документ красный»
  const oneSideEmpty =
    !version1.content?.trim() || !version2.content?.trim();

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 h-full">
      <main className="p-4 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            Сравнение версий{" "}
            {version1.isLatest ? "Latest" : `V${version1.version_number ?? "-"}`}{" "}
            ↔{" "}
            {version2.isLatest ? "Latest" : `V${version2.version_number ?? "-"}`}
          </h2>
          {onBack && (
            <button
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              onClick={onBack}
            >
              ← Выйти из сравнения
            </button>
          )}
        </div>

        {oneSideEmpty && (
          <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Одна из версий не содержит сохранённого текста. Дифф может выглядеть
            как «сплошное добавление/удаление». Проверьте сохранение контента версии.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* СТАРАЯ */}
          <section className="border rounded p-3 bg-white min-h-[60vh]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Старая версия{" "}
                {version1.isLatest ? "(Latest)" : `V${version1.version_number ?? "-"}`}
              </h3>
              <div className="text-xs text-muted-foreground">
                {version1.created_at
                  ? new Date(version1.created_at).toLocaleString()
                  : ""}
              </div>
            </div>

            <div className="whitespace-pre-wrap leading-7 text-[15px]">
              {changes.map((ch) => (
                <DiffChunk
                  key={`L-${ch.id}`}
                  change={ch}
                  side="left"
                  onAccept={() => applyChange(ch.id, "accepted")}
                  onReject={() => applyChange(ch.id, "rejected")}
                />
              ))}
            </div>
          </section>

          {/* НОВАЯ */}
          <section className="border rounded p-3 bg-white min-h-[60vh]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                Новая версия{" "}
                {version2.isLatest ? "(Latest)" : `V${version2.version_number ?? "-"}`}
              </h3>
              <div className="text-xs text-muted-foreground">
                {version2.created_at
                  ? new Date(version2.created_at).toLocaleString()
                  : ""}
              </div>
            </div>

            <div className="whitespace-pre-wrap leading-7 text-[15px]">
              {changes.map((ch) => (
                <DiffChunk
                  key={`R-${ch.id}`}
                  change={ch}
                  side="right"
                  onAccept={() => applyChange(ch.id, "accepted")}
                  onReject={() => applyChange(ch.id, "rejected")}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Правый сайдбар — одна панель */}
      <aside className="border-l bg-gray-50 p-4">
        <ChangesPanel
          changes={changes}
          stats={stats}
          onApplyAll={applyAll}
          onRejectAll={rejectAll}
          onResetAll={resetAll}
          onNavigateToChange={handleNavigateToChange}
          onShowPreview={() => setIsPreviewMode(true)}
        />
      </aside>
    </div>
  );
}
