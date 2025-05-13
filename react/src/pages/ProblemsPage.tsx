import { useEffect, useState } from 'react'
import { getProblems } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ProblemCard from '../components/ProblemCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShuffleIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import type { Problem } from '@/lib/types'
import { motion } from 'framer-motion'

export default function ProblemsPage() {
  const { token } = useAuth()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true) // Add loading state
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  
  useEffect(() => {
    if (token) {
      setLoading(true)
      getProblems(token)
        .then(setProblems)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [token])
  
  const getRandomProblem = () => {
    if (problems.length === 0) return
    const randomIndex = Math.floor(Math.random() * problems.length)
    const randomProblem = problems[randomIndex]
    window.location.href = `/problem/${randomProblem.uuid}`
  }
  
  const visible = problems.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      (p.id && String(p.id).includes(query)) // Search by ID instead of UUID
    const matchesFilter = filter ? p.difficulty === filter : true
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero section with animated background */}
      <div className="relative rounded-lg p-8 shadow-lg text-center mb-8 overflow-hidden">
        {/* ... [existing hero section code] ... */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700 animate-gradient-x"
          style={{
            backgroundSize: '200% 200%',
            animation: 'gradient 20s ease infinite'
          }}
        >
          {/* Texture overlay */}
          <div className="absolute inset-0 opacity-0" 
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0z\' fill=\'%23FFFFFF\' fill-opacity=\'0.2\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat'
            }}>
          </div>
          {/* Moving particles effect */}
          <div className="absolute inset-0" 
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 2px)',
              backgroundSize: '30px 30px',
              animation: 'particles 20s linear infinite'
            }}>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">АлгоХаб</h1>
          <p className="text-blue-100 mt-2 text-lg max-w-2xl mx-auto">
          Практикуйтесь, обучайтесь и улучшайте свои навыки программирования
          </p>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold">Задачи по программированию</h2>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* ... [existing filter code] ... */}
        <Tabs defaultValue="all" onValueChange={(val) => setFilter(val === 'all' ? null : val)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-[400px] bg-slate-100 p-1 shadow-inner">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:font-medium transition-all"
            >
              Все
            </TabsTrigger>
            <TabsTrigger 
              value="easy" 
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Легкие
            </TabsTrigger>
            <TabsTrigger 
              value="medium" 
              className="data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Средние
            </TabsTrigger>
            <TabsTrigger 
              value="hard" 
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Сложные
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Поиск по названию или ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          
          <Button 
            onClick={getRandomProblem}
            variant="outline"
            className="flex items-center gap-2 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            disabled={problems.length === 0}
          >
            <ShuffleIcon className="h-4 w-4" />
            Случайная
          </Button>
        </div>
      </div>
      
      {/* Problems Grid with animations */}
      {loading ? (
        <div className="text-center py-10">Загрузка задач...</div>
      ) : problems.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Задачи отсутствуют</h3>
          <p className="text-gray-500 text-center max-w-md">
            В системе пока нет задач по программированию. Пожалуйста, попробуйте зайти позже.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10">Не найдено задач, соответствующих вашим критериям.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((problem, index) => (
            <motion.div 
              key={problem.uuid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="rounded-lg transition-all duration-300"
            >
              <ProblemCard 
                problem={problem} 
                index={index + 1}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Enhanced CSS animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes particles {
          0% { background-position: 0px 0px }
          100% { background-position: 100px 100px }
        }
      `}</style>
    </div>
  )
}