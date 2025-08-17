// src/hooks/useDocumentDiff.ts
import { useEffect, useMemo, useState } from "react";
import { diffWordsWithSpace } from "diff";
import { Change } from "@/types/change";
import { bbcodeToPlainText } from "@/utils/formatBBCode";

/**
 * Считает diff между двумя строками и даёт утилиты для управления изменениями.
 * Использует plain text для сравнения, но сохраняет оригинальное форматирование.
 */
export function useDocumentDiff(oldText: string, newText: string) {
  /** Пересчитываем diff при изменении текста, используя plain text для сравнения */
  const computedChanges: Change[] = useMemo(() => {
    // Конвертируем в plain text для сравнения, но сохраняем оригинальные тексты
    const oldPlainText = bbcodeToPlainText(oldText || "");
    const newPlainText = bbcodeToPlainText(newText || "");
    const result = diffWordsWithSpace(oldPlainText, newPlainText);

    // На случай, если библиотека по каким-то причинам вернёт не массив
    const arr = Array.isArray(result) ? result : [];

    const mapped: Change[] = arr
      .filter((part) => part.value.trim() !== "") // Убираем пустые изменения
      .map((part, idx) => ({
        id: idx,
        type: part.added ? "added" : part.removed ? "removed" : null,
        content: part.value ?? "",
        status: "pending" as const,
      }));

    return mapped;
  }, [oldText, newText]);

  /** Живые изменения, с которыми работает пользователь */
  const [changes, setChanges] = useState<Change[]>(computedChanges);

  /**
   * ВАЖНО: когда diff пересчитался (поменялись входы), синхронизируем локальное
   * состояние — иначе в UI останутся старые изменения.
   */
  useEffect(() => {
    setChanges(computedChanges);
  }, [computedChanges]);

  /** Принять/отклонить/сбросить конкретное изменение */
  const applyChange = (
    id: number,
    status: "accepted" | "rejected" | "pending" | "edited"
  ) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  /** Пометить все изменения как принятые */
  const applyAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, status: "accepted" })));
  };

  /** Пометить все изменения как отклонённые */
  const rejectAll = () => {
    setChanges((prev) => prev.map((c) => ({ ...c, status: "rejected" })));
  };

  /** Сбросить к исходному diff */
  const resetAll = () => {
    setChanges(computedChanges);
  };

  /** Обновить содержимое конкретного изменения */
  const updateChangeContent = (id: number, content: string) => {
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content, status: "edited" } : c))
    );
  };

  /** Статистика по изменениям */
  const stats = useMemo(() => {
    return {
      accepted: changes.filter((c) => c.status === "accepted").length,
      rejected: changes.filter((c) => c.status === "rejected").length,
      pending: changes.filter((c) => c.status === "pending").length,
      edited: changes.filter((c) => c.status === "edited").length,
    };
  }, [changes]);

  return {
    changes,
    applyChange,
    applyAll,
    rejectAll,
    resetAll,
    updateChangeContent,
    stats,
  };
}
