// src/lib/types.ts
export interface Problem {
  uuid: string
  id?: number
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  solved?: boolean
}