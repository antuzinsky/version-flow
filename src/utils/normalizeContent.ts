// src/utils/normalizeContent.ts

/**
 * Универсальная функция для приведения контента документа к строке,
 * чтобы diff-алгоритм мог с ним работать.
 */
export function normalizeContent(content: any): string {
  if (!content) return "";

  // Если уже строка — отдаем как есть
  if (typeof content === "string") return content;

  // Если это объект (например JSON от редактора)
  try {
    // Временно превращаем в форматированный JSON
    return JSON.stringify(content, null, 2);
  } catch (e) {
    // fallback на простое приведение
    return String(content);
  }
}
