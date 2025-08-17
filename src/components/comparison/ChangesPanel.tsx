// src/components/comparison/ChangesPanel.tsx
import React from "react";
import { Change } from "@/types/change";

interface ChangesPanelProps {
  changes: Change[];
  applyChange: (id: number, status: "accepted" | "rejected" | "pending") => void;
  applyAll: () => void;
  rejectAll: () => void;
  resetAll: () => void;
  stats: { accepted: number; rejected: number; pending: number };
  onBack: () => void;
}

export default function ChangesPanel({
  changes,
  applyAll,
  rejectAll,
  resetAll,
  stats,
  onBack,
}: ChangesPanelProps) {
  return (
    <div className="w-72 border-r border-gray-200 p-4 bg-white">
      <h3 className="font-bold text-lg mb-4">Изменения</h3>

      <div className="mb-4 text-sm">
        <div>Принято: {stats.accepted}</div>
        <div>Отклонено: {stats.rejected}</div>
        <div>Ожидают: {stats.pending}</div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <button className="btn btn-sm btn-success" onClick={applyAll}>
          Принять всё
        </button>
        <button className="btn btn-sm btn-error" onClick={rejectAll}>
          Отклонить всё
        </button>
        <button className="btn btn-sm btn-secondary" onClick={resetAll}>
          Сбросить всё
        </button>
      </div>

      <div className="border-t pt-4">
        <button className="btn btn-sm btn-outline w-full" onClick={onBack}>
          ← Назад
        </button>
      </div>
    </div>
  );
}
