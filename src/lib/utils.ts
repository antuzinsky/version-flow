import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sanitize file names for Supabase Storage keys
export function sanitizeFileName(name: string) {
  const dot = name.lastIndexOf(".")
  const base = dot !== -1 ? name.slice(0, dot) : name
  const ext = dot !== -1 ? name.slice(dot) : ""

  // Remove accents, then keep a-z0-9 only, turn others into dashes
  const normalized = base.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const safeBase = slug || "file"
  const safeExt = ext.replace(/[^a-z0-9.]/gi, "")
  return `${safeBase}${safeExt}`
}
