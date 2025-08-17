// src/utils/normalizeContent.ts

/**
 * Приводит любое содержимое документа к строке, сохраняя BB коды.
 * Поддержка:
 *  - строки (возвращаем как есть для сохранения BB кодов)
 *  - Quill Delta (ops)
 *  - JSON-объекты
 *  - fallback → String()
 */
export function normalizeContent(content: any): string {
  if (!content) return "";

  // Если это уже строка - возвращаем как есть (сохраняем BB коды)
  if (typeof content === "string") {
    return content;
  }

  // Если это объект с Quill Delta (content.ops)
  if (typeof content === "object") {
    try {
      if (Array.isArray(content.ops)) {
        return content.ops.map((op: any) => op.insert || "").join("");
      }
      return JSON.stringify(content); // Fallback для произвольных объектов
    } catch (e) {
      console.warn("normalizeContent: error parsing object", e);
      return String(content);
    }
  }

  // Всё остальное → строка
  return String(content);
}
