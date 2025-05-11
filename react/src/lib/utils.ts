// src/lib/utils.ts
import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Удобный helper для объединения классов с поддержкой Tailwind Merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}