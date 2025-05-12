// src/pages/ProblemsPage.tsx
import { useEffect, useState } from 'react'
import { getProblems } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import ProblemCard from '../components/ProblemCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShuffleIcon, MagnifyingGlassIcon, CheckIcon } from '@radix-ui/react-icons'
import type { Problem } from '@/lib/types'

export default function ProblemsPage() {
  const { token } = useAuth()
  const [problems, setProblems] = useState<Problem[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  
  useEffect(() => {
    if (token) getProblems(token).then(setProblems).catch(console.error)
  }, [token])
  
  const getRandomProblem = () => {
    if (problems.length === 0) return
    const randomIndex = Math.floor(Math.random() * problems.length)
    const randomProblem = problems[randomIndex]
    window.location.href = `/problem/${randomProblem.uuid}`
  }

  const markAllAsDone = () => {
    setProblems((prevProblems) =>
      prevProblems.map((problem) => ({ ...problem, solved: true }))
    );
  };
  
  const visible = problems.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      (p.uuid && p.uuid.toLowerCase().includes(query.toLowerCase()))
    const matchesFilter = filter ? p.difficulty === filter : true
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Hero section with prominent title */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 shadow-lg text-center mb-8">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">Problems</h1>
        <p className="text-blue-100 mt-2 text-lg max-w-2xl mx-auto">
          Explore our collection of coding challenges and improve your skills
        </p>
      </div>
      
      <h2 className="text-3xl font-bold">Coding Problems</h2>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs defaultValue="all" onValueChange={(val) => setFilter(val === 'all' ? null : val)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 w-full md:w-[400px] bg-slate-100 p-1 shadow-inner">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:font-medium transition-all"
            >
              All
            </TabsTrigger>
            <TabsTrigger 
              value="easy" 
              className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:shadow-md data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Easy
            </TabsTrigger>
            <TabsTrigger 
              value="medium" 
              className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700 data-[state=active]:shadow-md data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              Medium
            </TabsTrigger>
            <TabsTrigger 
              value="hard" 
              className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700 data-[state=active]:shadow-md data-[state=active]:font-medium transition-all flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              Hard
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search by name or UUID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button 
            onClick={getRandomProblem}
            variant="outline"
            className="flex items-center gap-2 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
          >
            <ShuffleIcon className="h-4 w-4" />
            Random
          </Button>

          <Button 
            onClick={markAllAsDone}
            variant="outline"
            className="flex items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100 hover:text-green-700 transition-colors"
          >
            <CheckIcon className="h-4 w-4" />
            Mark All as Done
          </Button>
        </div>
      </div>
      
      {/* Problems Grid */}
      {problems.length === 0 ? (
        <div className="text-center py-10">Loading problems...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-10">No problems found matching your criteria.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((problem, index) => (
            <div 
              key={problem.uuid}
              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} rounded-lg p-1`}
            >
              <ProblemCard problem={problem} index={index + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
