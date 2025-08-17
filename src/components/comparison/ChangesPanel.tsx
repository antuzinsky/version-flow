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
}

export default function ChangesPanel({
  changes,
  stats,
  onApplyAll,
  onRejectAll,
  onResetAll,
}: ChangesPanelProps) {
  console.log("ChangesPanel stats:", stats);
  console.log("ChangesPanel changes:", changes);

  return (
    <aside className="w-72 bg-gray-50 border-r p-4 overflow-auto">
      <h2 className="text-lg font-bold mb-4">Изменения</h2>

      {/* Счётчики */}
      <div className="space-y-1 text-sm mb-4">
        <p>✅ Принято: {stats?.accepted ?? 0}</p>
        <p>❌ Отклонено: {stats?.rejected ?? 0}</p>
        <p>⏳ Ожидает: {stats?.pending ?? 0}</p>
        <p>✏️ Изменено: {stats?.edited ?? 0}</p>
      </div>

      {/* Кнопки массовых действий */}
      <div className="space-y-2">
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
      </div>
    </aside>
  );
}
