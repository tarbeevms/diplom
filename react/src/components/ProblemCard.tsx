// src/components/ProblemCard.tsx
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import type { Problem } from '@/lib/types'

interface ProblemCardProps {
  problem: Problem
  index: number
}

export default function ProblemCard({ problem, index }: ProblemCardProps) {
  const badgeClasses = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  }[problem.difficulty]

  // Используем problem.id вместо index, если доступно
  const displayId = problem.id !== undefined ? problem.id : index

  return (
    <Link to={`/problem/${problem.uuid}`}>
      <Card className="transform hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-xl h-full">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-500 font-semibold">{`#${displayId}`}</span>
              <h3 className="font-semibold text-lg line-clamp-1">{problem.name}</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-sm font-medium ${badgeClasses}`}>
              {problem.difficulty}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 line-clamp-2">{problem.description}</p>
            {problem.solved && (
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 ml-2" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
