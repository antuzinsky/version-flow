// src/components/comparison/DocumentComparison.tsx
import React from "react";
import { Change } from "@/types/change";
import { useDocumentDiff } from "@/hooks/useDocumentDiff";
import ChangesPanel from "./ChangesPanel";
import { normalizeContent } from "@/utils/normalizeContent";

interface DocumentComparisonProps {
  version1: { content: string };
  version2: { content: string };
  onBack?: () => void;
}

export default function DocumentComparison({
  version1,
  version2,
  onBack,
}: DocumentComparisonProps) {
  console.log("Comparing contents:", {
    version1: version1?.content,
    version2: version2?.content,
  });

// хук для вычисления diff
const {
  changes,
  applyChange,
  applyAll,
  rejectAll,
  resetAll,
  stats,
} = useDocumentDiff(
  normalizeContent(version1?.content || ""),
  normalizeContent(version2?.content || "")
);

// вот тут уже отдельно можно логать
console.log("version1.content type:", typeof version1?.content, version1?.content);
console.log("version2.content type:", typeof version2?.content, version2?.content);
console.log("Generated changes:", changes);
console.log("Stats:", stats);

  return (
    <div className="flex h-full">
      {/* Левая панель управления изменениями */}
      <ChangesPanel
        changes={changes}
        stats={stats}
        onApplyAll={applyAll}
        onRejectAll={rejectAll}
        onResetAll={resetAll}
      />

      {/* Правая часть: отображение документа с изменениями */}
      <div className="flex-1 p-4 overflow-auto">
        <h2 className="text-lg font-bold mb-4">Сравнение документа</h2>
        {changes.length === 0 ? (
          <p className="text-gray-500">Изменений не найдено</p>
        ) : (
          <ul className="space-y-2">
            {changes.map((change: Change) => (
              <li
                key={change.id}
                className={`p-2 rounded border ${
                  change.type === "added"
                    ? "bg-green-100 border-green-300"
                    : "bg-red-100 border-red-300"
                }`}
              >
                <span className="font-mono">{change.content}</span>
                <div className="mt-1 space-x-2">
                  <button
                    className="px-2 py-1 text-sm bg-green-500 text-white rounded"
                    onClick={() => applyChange(change.id, "accepted")}
                  >
                    Принять
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                    onClick={() => applyChange(change.id, "rejected")}
                  >
                    Отклонить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
