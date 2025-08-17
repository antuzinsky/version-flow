import React, { useState } from "react";
import { useDocumentDiff } from "@/hooks/useDocumentDiff";
import ChangesPanel from "./ChangesPanel";
import PreviewPanel from "./PreviewPanel";
import type { Change } from "@/types/change";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EditChangeModal } from "@/components/modals/EditChangeModal";

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
  onEdit,
}: {
  change: Change;
  side: "left" | "right";
  onAccept: () => void;
  onReject: () => void;
  onEdit?: () => void;
}) {
  const isRemoved = change.type === "removed";
  const isAdded = change.type === "added";
  const isNeutral = change.type === null;
  
  // Левая сторона: показываем неизменённые и удалённые
  if (side === "left" && !(isNeutral || isRemoved)) return null;
  // Правая сторона: показываем неизменённые, добавленные И удалённые (зачёркнуто)
  if (side === "right" && !isNeutral && !isAdded && !isRemoved) return null;

  const base = "px-0.5 rounded";
  let cls = "";
  if (isNeutral) {
    cls = "";
  } else if (isRemoved) {
    if (side === "left") {
      cls =
        change.status === "accepted"
          ? "bg-red-50 line-through opacity-70"  // Принятое удаление
          : change.status === "rejected"
          ? "bg-red-100"  // Отклонённое удаление (остаётся)
          : "bg-red-100";  // Ожидающее удаление
    } else {
      // Правая сторона - показываем удалённые как зачёркнутые
      cls =
        change.status === "accepted"
          ? "bg-red-50 line-through opacity-70"  // Принятое удаление
          : change.status === "rejected"
          ? "bg-red-100"  // Отклонённое удаление (восстанавливается)
          : "bg-red-100 line-through opacity-60";  // Ожидающее удаление (показываем зачёркнуто)
    }
  } else if (isAdded && side === "right") {
    cls =
      change.status === "accepted"
        ? "bg-green-50"
        : change.status === "rejected"
        ? "bg-transparent opacity-40 line-through"
        : "bg-green-100";
  }

  // Показываем кнопки на правой стороне для добавлений И удалений
  const showControls = side === "right" && (isAdded || isRemoved);

  return (
    <span 
      id={change.type !== null ? `change-${change.id}` : undefined}
      className={`${base} ${cls} transition-colors duration-500`}
    >
      {change.content}
      {showControls && (
        <span className="ml-2 select-none">
          {change.status !== "accepted" && (
            <button
              className="inline-block text-base px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onAccept}
              title={isRemoved ? "Удалить этот фрагмент" : "Принять добавление"}
            >
              ✓
            </button>
          )}
          {change.status !== "rejected" && (
            <button
              className="inline-block text-base px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 ml-1"
              onClick={onReject}
              title={isRemoved ? "Оставить этот фрагмент" : "Отклонить добавление"}
            >
              ✕
            </button>
          )}
          {onEdit && (
            <button
              className="inline-block text-base px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 ml-1"
              onClick={onEdit}
              title="Редактировать"
            >
              ✏️
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
  const [editingChange, setEditingChange] = useState<Change | null>(null);
  const { toast } = useToast();
  
  const { changes, applyChange, applyAll, rejectAll, resetAll, stats, updateChangeContent } =
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
    <div className="h-full flex">
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Сравнение версий{" "}
            {version1.isLatest ? "Latest" : `V${version1.version_number ?? "-"}`}{" "}
            ↔{" "}
            {version2.isLatest ? "Latest" : `V${version2.version_number ?? "-"}`}
          </h1>
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
            >
              ← Выйти из сравнения
            </Button>
          )}
        </div>

        {oneSideEmpty && (
          <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-4 py-3">
            Одна из версий не содержит сохранённого текста. Дифф может выглядеть
            как «сплошное добавление/удаление». Проверьте сохранение контента версии.
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* СТАРАЯ */}
          <section className="border rounded-lg p-4 bg-white min-h-[70vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Старая версия{" "}
                {version1.isLatest ? "(Latest)" : `V${version1.version_number ?? "-"}`}
              </h2>
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
          <section className="border rounded-lg p-4 bg-white min-h-[70vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Новая версия{" "}
                {version2.isLatest ? "(Latest)" : `V${version2.version_number ?? "-"}`}
              </h2>
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
                  onEdit={() => setEditingChange(ch)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Правый сайдбар */}
      <aside className="w-80 border-l bg-gray-50 p-4">
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

      <EditChangeModal 
        open={!!editingChange}
        onOpenChange={(open) => !open && setEditingChange(null)}
        change={editingChange}
        onSave={(content) => {
          if (editingChange && updateChangeContent) {
            updateChangeContent(editingChange.id, content);
          }
        }}
      />
    </div>
  );
}
