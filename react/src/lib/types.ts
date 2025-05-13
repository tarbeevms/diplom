// src/lib/types.ts
export interface Problem {
  uuid: string
  id?: number
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  solved?: boolean
  solution?: {
    average_time_ms: number
    average_memory_kb: number
    created_at: string
    code: string
    language: string
  }
}