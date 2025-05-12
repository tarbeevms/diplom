import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getProblem, submitSolution } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'
import { ReloadIcon, CheckIcon, CrossCircledIcon, CodeIcon, FileTextIcon } from '@radix-ui/react-icons'
import type { Problem } from '@/lib/types'

// Вынесенные константы для соотношений элементов интерфейса
const LAYOUT_CONSTANTS = {
  // Соотношение между описанием задачи и панелью кода (в процентах)
  PROBLEM_DESCRIPTION_WIDTH: 30, // Описание задачи занимает 30% ширины
  CODE_PANEL_WIDTH: 70, // Редактор и вывод занимают 70% ширины
}

type TabType = 'problem' | 'results';

export default function ProblemPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const { token } = useAuth()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('python')
  const [code, setCode] = useState(getDefaultTemplate('python'))
  const [output, setOutput] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('problem')
  
  // Фиксированное соотношение из констант
  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!uuid) return setLoading(false)
    getProblem(uuid, token || '')
      .then(setProblem)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [uuid, token])

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
      // Автоматически переключаемся на вкладку с результатами при получении ответа
      setActiveTab('results')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="p-8 rounded-xl bg-white shadow-lg border border-gray-100 flex flex-col items-center animate-fade-in transition-all duration-300 hover:shadow-xl">
        <ReloadIcon className="animate-spin h-10 w-10 text-blue-600 mb-4" />
        <p className="text-gray-700 font-medium">Загрузка задачи...</p>
      </div>
    </div>
  )
  
  if (!problem) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-64px)] bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="p-8 rounded-xl bg-white shadow-lg border border-gray-100 flex flex-col items-center max-w-md animate-fade-in transition-all duration-300 hover:shadow-xl">
        <CrossCircledIcon className="h-14 w-14 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Задача не найдена</h3>
        <p className="text-gray-600 text-center">Возможно, указанная задача не существует или у вас нет к ней доступа</p>
      </div>
    </div>
  )

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gradient-to-br from-gray-50 to-slate-100 overflow-hidden">
      <div ref={containerRef} className="flex flex-grow relative overflow-hidden p-4 gap-4">
        {/* Левая панель: редактор кода (фиксированная ширина) */}
        <div 
          className="h-full py-5 bg-white flex flex-col overflow-hidden rounded-2xl shadow-lg transition-all duration-300 border border-gray-100"
          style={{ width: `${LAYOUT_CONSTANTS.CODE_PANEL_WIDTH}%` }}
        >
          <div className="p-6 flex-grow flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => {
                      const lang = e.target.value as 'python' | 'cpp' | 'java'
                      setLanguage(lang)
                      setCode(getDefaultTemplate(lang))
                    }}
                    className="appearance-none pl-10 pr-10 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  >
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleRun}
                disabled={submitting}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 font-medium flex items-center gap-2 shadow-md transition-all duration-300 border border-green-600 transform hover:scale-105 hover:shadow-lg"
              >
                {submitting ? 
                  <ReloadIcon className="animate-spin w-4 h-4" /> : 
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                }
                <span>
                  {submitting ? 'Выполнение...' : 'Запустить код'}
                </span>
              </Button>
            </div>

            {/* Панель редактора кода на всю высоту */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Editor
                  language={language}
                  value={code}
                  onChange={(v) => setCode(v || '')}
                  theme="vs-light"
                  options={{
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, Consolas, monospace',
                    fontLigatures: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    folding: true,
                    lineNumbers: 'on',
                    tabSize: 2,
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    renderWhitespace: 'selection',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Правая панель: табы для переключения между условием и результатами */}
        <div 
          ref={rightPanelRef}
          className="h-full flex flex-col bg-white overflow-hidden rounded-2xl shadow-lg transition-all duration-300 border border-gray-100"
          style={{ width: `${LAYOUT_CONSTANTS.PROBLEM_DESCRIPTION_WIDTH}%` }}
        >
          {/* Навигационные табы */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                activeTab === 'problem'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('problem')}
            >
              <FileTextIcon className="w-4 h-4" />
              Условие
            </button>
            <button
              className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors duration-300 ${
                activeTab === 'results'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('results')}
            >
              <CodeIcon className="w-4 h-4" />
              Результаты
              {output && (
                <span className={`absolute top-2 right-2 h-2.5 w-2.5 rounded-full ${
                  output.status === 'success' ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
                }`}></span>
              )}
            </button>
          </div>

          {/* Содержимое табов */}
          <div className="flex-1 overflow-y-auto">
            {/* Таб с условием задачи */}
            {activeTab === 'problem' && (
              <div className="px-6 py-5 h-full">
                <div className="max-w-2xl">
                  <div className="mb-8 relative">
                    <div className="flex items-center gap-3 mb-3">
                      {problem.id !== undefined && (
                        <div className="inline-flex items-center justify-center font-mono text-white bg-gradient-to-br from-blue-500 to-blue-700 h-10 w-10 rounded-lg text-xl font-bold shadow-lg transition-transform duration-300 hover:scale-110">
                          #{problem.id}
                        </div>
                      )}
                      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{problem.name}</h1>
                    </div>
                    <div className="absolute top-0 right-0">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-md transition-transform duration-300 hover:scale-105 ${
                        problem.difficulty === 'easy' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                        problem.difficulty === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white' :
                        'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                      }`}>
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-white animate-pulse"></span>
                        {problem.difficulty === 'easy' ? 'Легкая' : 
                        problem.difficulty === 'medium' ? 'Средняя' : 'Сложная'}
                      </span>
                    </div>
                  </div>
                  <div className="prose max-w-none pb-8 prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:shadow-sm prose-pre:rounded-lg" dangerouslySetInnerHTML={{ __html: problem.description }} />
                </div>
              </div>
            )}

            {/* Таб с результатами выполнения */}
            {activeTab === 'results' && (
              <div className="p-4 h-full">
                {submitting && (
                  <div className="text-sm bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-center space-x-3 animate-pulse shadow-sm">
                    <ReloadIcon className="animate-spin w-5 h-5 text-blue-600" />
                    <span className="text-blue-700 font-medium">Проверка решения...</span>
                  </div>
                )}

                {!submitting && !output && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm font-medium mb-1">Нет результатов</p>
                    <p className="text-xs max-w-xs">Напишите код и нажмите «Запустить код», чтобы увидеть результаты выполнения</p>
                  </div>
                )}

                {output && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Performance metrics */}
                    {output.details && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">Показатели производительности</h3>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-200">
                          <div className="p-4 flex flex-col items-center justify-center">
                            <div className="flex items-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-semibold text-gray-500 uppercase">Время выполнения</span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-blue-700 font-bold text-2xl">{output.details.average_time_ms}</span>
                              <span className="text-blue-600 ml-1 text-sm">мс</span>
                            </div>
                          </div>
                          <div className="p-4 flex flex-col items-center justify-center">
                            <div className="flex items-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-semibold text-gray-500 uppercase">Память</span>
                            </div>
                            <div className="flex items-baseline">
                              <span className="text-purple-700 font-bold text-2xl">{output.details.average_memory_kb}</span>
                              <span className="text-purple-600 ml-1 text-sm">КБ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Failed tests accordion */}
                    {output.failed_tests?.length > 0 && (
                      <details className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" open>
                        <summary className="px-4 py-3 bg-red-50 border-b border-red-200 cursor-pointer flex justify-between items-center">
                          <div className="flex items-center">
                            <CrossCircledIcon className="w-5 h-5 mr-2 text-red-500" />
                            <h3 className="text-sm font-medium text-red-700">
                              Непройденные тесты
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                {output.failed_tests.length}
                              </span>
                            </h3>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="divide-y divide-gray-200">
                          {output.failed_tests.map((test: any, idx: number) => (
                            <div key={idx} className="p-0">
                              <details className="group">
                                <summary className="bg-gray-50 px-4 py-2 flex justify-between cursor-pointer items-center hover:bg-gray-100 transition-colors duration-150">
                                  <span className="text-sm font-medium text-gray-700 flex items-center">
                                    <span className="w-5 h-5 rounded-full bg-red-100 border border-red-200 inline-flex items-center justify-center mr-2 text-xs text-red-800 font-bold">{idx + 1}</span>
                                    Тест #{idx + 1}
                                  </span>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </summary>
                                <div className="p-4 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                        </svg>
                                        Входные данные
                                      </div>
                                      <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto border border-gray-200 font-mono text-gray-800 shadow-inner max-h-40">{test.input}</pre>
                                    </div>
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          Ожидаемый результат
                                        </div>
                                        <pre className="bg-green-50 p-3 rounded-md text-xs overflow-x-auto border border-green-200 font-mono text-green-800 shadow-inner max-h-20">{test.output}</pre>
                                      </div>
                                      <div>
                                        <div className="flex items-center text-xs font-semibold text-gray-500 uppercase mb-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          Фактический результат
                                        </div>
                                        <pre className="bg-red-50 p-3 rounded-md text-xs overflow-x-auto border border-red-200 font-mono text-red-800 shadow-inner max-h-20">{test.actual_output}</pre>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </details>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Successful tests summary */}
                    {output.status === 'success' && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                          <h3 className="text-sm font-medium text-green-700 flex items-center">
                            <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
                            Решение верно!
                          </h3>
                        </div>
                        <div className="p-4 text-sm text-gray-700">
                          <p className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Все тесты успешно пройдены
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}