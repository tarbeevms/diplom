import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getProblem, submitSolution } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'
import { ReloadIcon, CheckIcon, CrossCircledIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import type { Problem } from '@/lib/types'

export default function ProblemPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const { token } = useAuth()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('python')
  const [code, setCode] = useState(getDefaultTemplate('python'))
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // State for resizable panels
  const [leftPanelWidth, setLeftPanelWidth] = useState(50) // percentage
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    if (!uuid) return setLoading(false)
    getProblem(uuid, token || '')
      .then(setProblem)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [uuid, token])

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || dragStartX.current === null) return
      
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (!containerRect) return
      
      // Calculate percentage based on container width, not window width
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      // Limit the minimum width of panels
      if (newLeftWidth >= 30 && newLeftWidth <= 70) {
        setLeftPanelWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      dragStartX.current = null
      document.body.classList.remove('cursor-col-resize')
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStartX.current = e.clientX
    document.body.classList.add('cursor-col-resize')
  }

  function getDefaultTemplate(lang: string) {
    if (lang === 'cpp') {
      return [
        '#include <iostream>',
        'using namespace std;',
        'int main() {',
        '  // Write your code here',
        '  return 0;',
        '}',
      ].join('\n')
    }
    if (lang === 'java') {
      return [
        'public class Solution {',
        '  public static void main(String[] args) {',
        '    // Write your code here',
        '  }',
        '}',
      ].join('\n')
    }
    return '# Write your code here\n'
  }

  const handleRun = async () => {
    if (!uuid) return
    setSubmitting(true)
    setOutput(null)
    try {
      const res = await submitSolution(uuid, { language, code }, token || '')
      setOutput(res)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-[calc(100vh-64px)]"><ReloadIcon className="animate-spin h-8 w-8 text-blue-600" /></div>
  if (!problem) return <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)]"><CrossCircledIcon className="h-12 w-12 text-red-500 mb-4" /><p className="text-xl font-medium">Задача не найдена</p></div>

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 overflow-hidden">
      {/* Main content container with resizable panels */}
      <div ref={containerRef} className="flex flex-grow relative overflow-hidden">
        {/* Left panel: Problem description */}
        <div 
          className="h-full overflow-y-auto px-6 py-5 bg-white shadow-sm" 
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex-shrink-0 rounded-full bg-blue-100 p-1.5">
                <ChevronRightIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{problem.name}</h1>
            </div>
            
            <div className="prose max-w-none pb-8" dangerouslySetInnerHTML={{ __html: problem.description }} />
          </div>
        </div>
        
        {/* Resizer handle - fixed positioning to stay within the container */}
        <div 
          className="w-4 bg-transparent cursor-col-resize flex items-center justify-center z-[5] hover:bg-gray-100 absolute top-0 bottom-0 rounded-t-lg rounded-b-lg"
          style={{ left: `${leftPanelWidth}%` }}
          onMouseDown={handleResizeStart}
        >
          <div className="w-1 h-16 bg-gray-300 rounded-full hover:bg-gray-400"></div>
        </div>
        
        {/* Right panel: Code editor */}
        <div 
          className="h-full py-5 bg-white flex flex-col overflow-hidden" 
          style={{ width: `${100 - leftPanelWidth - 0.25}%` }}
        >
          <div className="px-6 flex-grow flex flex-col overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <select
                value={language}
                onChange={(e) => {
                  const lang = e.target.value as 'python' | 'cpp' | 'java'
                  setLanguage(lang)
                  setCode(getDefaultTemplate(lang))
                }}
                className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>

              <Button
                onClick={handleRun}
                disabled={submitting}
                variant="runCode"
                className="rounded-md flex items-center gap-2 px-4 py-1.5 text-sm"
              >
                {submitting ? 
                  <ReloadIcon className="animate-spin w-4 h-4" /> : 
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                }
                <span className="font-medium">
                  {submitting ? 'Выполнение...' : 'Запустить код'}
                </span>
              </Button>
            </div>

            {/* Code Editor with better styling */}
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <Editor
                language={language}
                value={code}
                onChange={(v) => setCode(v || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  folding: true,
                  lineNumbers: 'on',
                  tabSize: 2,
                }}
              />
            </div>

            {/* Output area with improved styling */}
            <div className="mt-4 flex flex-col space-y-2 overflow-y-auto max-h-[30vh]">
              {/* Inline loading indicator under editor */}
              {submitting && (
                <div className="text-sm bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-center space-x-2">
                  <ReloadIcon className="animate-spin w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Проверка решения...</span>
                </div>
              )}

              {/* Result with improved styling */}
              {output && (
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Результат выполнения</h2>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        output.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {output.status === 'success' ? (
                        <>
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Тесты пройдены
                        </>
                      ) : (
                        <>
                          <CrossCircledIcon className="w-4 h-4 mr-1" />
                          Тесты не пройдены
                        </>
                      )}
                    </span>
                  </div>

                  {output.message && (
                    <div className="bg-gray-50 p-3 rounded-md text-gray-800">{output.message}</div>
                  )}

                  {output.failed_tests?.length > 0 && (
                    <div className="space-y-3">
                      <p className="font-medium text-gray-900">Непройденные тесты:</p>
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        {output.failed_tests.map((test: any, idx: number) => (
                          <div key={idx} className={`py-3 px-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase mb-1 block">Входные данные</span>
                                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{test.input}</pre>
                              </div>
                              <div>
                                <span className="text-xs font-medium text-gray-500 uppercase mb-1 block">Ожидаемый результат</span>
                                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">{test.output}</pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {output.details && (
                    <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-200 mt-3">
                      <div className="bg-blue-50 px-4 py-2 rounded-lg">
                        <span className="text-xs font-medium text-gray-500 uppercase block">Среднее время</span>
                        <span className="text-blue-700 font-medium">{output.details.average_time_ms} мс</span>
                      </div>
                      <div className="bg-purple-50 px-4 py-2 rounded-lg">
                        <span className="text-xs font-medium text-gray-500 uppercase block">Среднее потребление памяти</span>
                        <span className="text-purple-700 font-medium">{output.details.average_memory_kb} КБ</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
