// src/components/comparison/DocumentComparison.tsx
import React from "react";
import { Change } from "@/types/change";
import { useDocumentDiff } from "@/hooks/useDocumentDiff";
import ChangesPanel from "./ChangesPanel";

interface Version {
  id: string;
  version_number: number;
  content: string;
  created_at: string;
  created_by: string;
}

interface DocumentComparisonProps {
  version1: Version;
  version2: Version;
  onBack: () => void;
}

export default function DocumentComparison({
  version1,
  version2,
  onBack,
}: DocumentComparisonProps) {
  // Логируем, что именно пойдёт в diff
  console.log("Comparing contents:", {
    left: typeof version1.content,
    right: typeof version2.content,
    leftSample: typeof version1.content === "string" ? version1.content.slice(0, 100) : version1.content,
    rightSample: typeof version2.content === "string" ? version2.content.slice(0, 100) : version2.content,
  });

  // хук для управления изменениями
  const {
    changes,
    applyChange,
    applyAll,
    rejectAll,
    resetAll,
    stats,
  } = useDocumentDiff(version1.content, version2.content);

  return (
    <div className="flex w-full h-full">
      {/* Панель с управлением изменениями */}
      <ChangesPanel
        changes={changes}
        applyChange={applyChange}
        applyAll={applyAll}
        rejectAll={rejectAll}
        resetAll={resetAll}
        stats={stats}
        onBack={onBack}
      />

      {/* Область сравнения */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">
          Сравнение версий {version1.version_number} и {version2.version_number}
        </h2>

        {changes.map((c) => (
          <div
            key={c.id}
            className={`p-2 mb-2 rounded ${
              c.status === "accepted"
                ? "bg-green-100"
                : c.status === "rejected"
                ? "bg-red-100"
                : "bg-yellow-50"
            }`}
          >
            <div className="font-mono whitespace-pre-wrap">{c.content}</div>
            <div className="mt-2 space-x-2">
              <button
                className="btn btn-xs btn-success"
                onClick={() => applyChange(c.id, "accepted")}
              >
                Принять
              </button>
              <button
                className="btn btn-xs btn-error"
                onClick={() => applyChange(c.id, "rejected")}
              >
                Отклонить
              </button>
              <button
                className="btn btn-xs btn-secondary"
                onClick={() => applyChange(c.id, "pending")}
              >
                Сбросить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
