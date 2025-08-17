// src/components/comparison/ChangesPanel.tsx
import React from "react";
import { Change } from "@/types/change";

interface ChangesPanelProps {
  changes: Change[];
  stats: {
    accepted: number;
    rejected: number;
    pending: number;
    edited: number;
  };
  onApplyAll: () => void;
  onRejectAll: () => void;
  onResetAll: () => void;
  onNavigateToChange?: (changeId: number) => void;
  onShowPreview?: () => void;
}

export default function ChangesPanel({
  changes,
  stats,
  onApplyAll,
  onRejectAll,
  onResetAll,
  onNavigateToChange,
  onShowPreview,
}: ChangesPanelProps) {
  const actualChanges = changes.filter(ch => ch.type !== null);
  const hasProcessedChanges = actualChanges.some(ch => ch.status === "accepted" || ch.status === "rejected");

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-bold mb-4">Изменения</h2>

      {/* Счётчики */}
      <div className="space-y-1 text-sm mb-4">
        <p>✅ Принято: {stats?.accepted ?? 0}</p>
        <p>❌ Отклонено: {stats?.rejected ?? 0}</p>
        <p>⏳ Ожидает: {stats?.pending ?? 0}</p>
        <p>✏️ Изменено: {stats?.edited ?? 0}</p>
      </div>

      {/* Кнопки массовых действий */}
      <div className="space-y-2 mb-4">
        <button
          className="w-full px-3 py-1 bg-green-500 text-white rounded text-sm"
          onClick={onApplyAll}
        >
          Принять всё
        </button>
        <button
          className="w-full px-3 py-1 bg-red-500 text-white rounded text-sm"
          onClick={onRejectAll}
        >
          Отклонить всё
        </button>
        <button
          className="w-full px-3 py-1 bg-gray-400 text-white rounded text-sm"
          onClick={onResetAll}
        >
          Сбросить
        </button>
        
        {hasProcessedChanges && onShowPreview && (
          <button
            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium mt-2"
            onClick={onShowPreview}
          >
            Завершить разбор правок
          </button>
        )}
      </div>

      {/* Список изменений */}
      <div className="flex-1 overflow-auto">
        <h3 className="font-medium text-sm mb-2">Список расхождений ({actualChanges.length})</h3>
        <div className="space-y-1">
          {actualChanges.map((change) => {
            const preview = change.content.trim().substring(0, 40);
            const typeLabel = change.type === "added" ? "Добавлено" : "Удалено";
            const typeIcon = change.type === "added" ? "+" : "-";
            const statusIcon = 
              change.status === "accepted" ? "✅" : 
              change.status === "rejected" ? "❌" : 
              "⏳";

            return (
              <button
                key={change.id}
                onClick={() => onNavigateToChange?.(change.id)}
                className="w-full text-left p-2 text-xs border rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${
                    change.type === "added" ? "text-green-600" : "text-red-600"
                  }`}>
                    {typeIcon} {typeLabel}
                  </span>
                  <span>{statusIcon}</span>
                </div>
                <div className="text-gray-600 truncate">
                  {preview}{preview.length >= 40 ? "..." : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
