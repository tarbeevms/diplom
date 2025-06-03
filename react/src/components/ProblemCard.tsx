// src/components/ProblemCard.tsx
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import type { Problem } from '@/lib/types'
import { useEffect, useRef } from 'react'

interface ProblemCardProps {
  problem: Problem
  index: number
  isAlternate?: boolean // kept for backward compatibility
}

export default function ProblemCard({ problem, index, isAlternate = false }: ProblemCardProps) {
  // Updated gradient difficulty styles
  const difficultyStyles = {
    easy: 'from-green-500 to-emerald-600',
    medium: 'from-amber-500 to-orange-600',
    hard: 'from-red-500 to-rose-600',
  }[problem.difficulty]

  // Используем problem.id вместо index, если доступно
  const displayId = problem.id !== undefined ? problem.id : index
  
  // Названия сложности на русском
  const difficultyNames = {
    easy: 'Легкая',
    medium: 'Средняя',
    hard: 'Сложная',
  }

  // Reference to the HTML content container
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Apply styling to HTML elements inside the description after rendering
  useEffect(() => {
    if (descriptionRef.current) {
      // Process all HTML elements that might need styling
      const container = descriptionRef.current;
      
      // Remove any code formatting that would make the card too large
      const preElements = container.querySelectorAll('pre');
      preElements.forEach(pre => {
        pre.style.display = 'none'; // Hide pre elements in cards
      });
      
      // Style code snippets for better display
      const codeElements = container.querySelectorAll('code');
      codeElements.forEach(code => {
        code.style.fontFamily = 'monospace';
        code.style.backgroundColor = '#f1f5f9';
        code.style.padding = '0.1rem 0.2rem';
        code.style.borderRadius = '0.2rem';
        code.style.fontSize = '0.9em';
        code.style.wordBreak = 'normal';
        code.style.overflowWrap = 'break-word';
      });
      
      // Make images responsive
      const imgElements = container.querySelectorAll('img');
      imgElements.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      });
      
      // Process all inline elements to ensure proper text display
      const inlineElements = container.querySelectorAll('span, em, strong, a');
      inlineElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = 'inline';
        htmlEl.style.overflow = 'hidden';
        htmlEl.style.textOverflow = 'ellipsis';
        htmlEl.style.wordBreak = 'normal';
        htmlEl.style.overflowWrap = 'break-word';
      });
    }
  }, [problem.description]);

  // Extract plain text from HTML for backup display
  const getPlainTextFromHtml = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  return (
    <Link to={`/problem/${problem.uuid}`}>
      <Card className="transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl h-full border-0 bg-white">
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {/* Modern number badge with gradient - FIXED WIDTH */}
              <div className="inline-flex items-center justify-center font-mono text-white bg-gradient-to-br from-blue-500 to-blue-700 h-10 min-w-[2.5rem] w-10 rounded-lg text-xl font-bold shadow-lg transition-transform duration-300 hover:scale-110">
                #{displayId}
              </div>
              <h3 className="font-semibold text-lg line-clamp-1">{problem.name}</h3>
            </div>
            
            {/* Enhanced difficulty badge with gradient */}
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-transform duration-300 hover:scale-105 bg-gradient-to-r ${difficultyStyles} text-white`}>
              {difficultyNames[problem.difficulty]}
            </div>
          </div>
          
          <div className="flex items-start bg-slate-50 rounded-lg p-3">
            <div className="card-description-container flex-1 min-w-0 mr-3">
              {/* Render HTML content safely with fallback */}
              <div 
                ref={descriptionRef}
                className="text-sm text-gray-700 line-clamp-2 prose prose-sm max-w-full break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              ></div>
              
              {/* Fallback for complex HTML that might not display well */}
              <div className="text-sm text-gray-700 line-clamp-2 hidden">
                {getPlainTextFromHtml(problem.description)}
              </div>
            </div>
            {problem.solved && (
              <div className="flex-shrink-0 bg-green-100 p-1.5 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
