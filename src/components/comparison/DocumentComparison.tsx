import React from "react";
import { useDocumentDiff } from "@/hooks/useDocumentDiff";
import ChangesPanel from "./ChangesPanel";
import type { Change } from "@/types/change";

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
}

/**
 * Рендер одного кусочка дифа в колонке.
 * Для левой колонки показываем только removed/null.
 * Для правой — только added/null.
 */
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

  // Лево: показываем нейтральное + удалённое
  if (side === "left" && !(isNeutral || isRemoved)) return null;
  // Право: показываем нейтральное + добавленное
  if (side === "right" && !(isNeutral || isAdded)) return null;

  // Стиль по статусу и типу
  const base = "px-0.5 rounded";
  let cls = "";
  if (isNeutral) {
    cls = "";
  } else if (isRemoved && side === "left") {
    // удалённое (слева)
    cls =
      change.status === "accepted"
        ? "bg-red-50 line-through opacity-70"
        : change.status === "rejected"
        ? "bg-transparent opacity-40"
        : "bg-red-100";
  } else if (isAdded && side === "right") {
    // добавленное (справа)
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
    <span className={`${base} ${cls}`}>
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
}: Props) {
  const {
    changes,
    applyChange,
    applyAll,
    rejectAll,
    resetAll,
    stats,
  } = useDocumentDiff(version1.content, version2.content);

  return (
    <div className="grid grid-cols-[1fr_320px] gap-6 h-full">
      {/* Центр: ДВЕ колонки с текстом (без объединённого вида) */}
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

      {/* ПРАВЫЙ сайдбар: Одна панель изменений */}
      <aside className="border-l bg-gray-50 p-4">
        <ChangesPanel
          changes={changes}
          stats={stats}
          onApplyAll={applyAll}
          onRejectAll={rejectAll}
          onResetAll={resetAll}
        />
      </aside>
    </div>
  );
}
