import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { getProblem, submitSolution } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'
import { ReloadIcon, CheckIcon, CrossCircledIcon, CodeIcon, FileTextIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'
import type { Problem } from '@/lib/types'

// Вынесенные константы для соотношений элементов интерфейса
const LAYOUT_CONSTANTS = {
  // Соотношение между описанием задачи и панелью кода (в процентах)
  PROBLEM_DESCRIPTION_WIDTH: 40, // Описание задачи занимает 30% ширины
  CODE_PANEL_WIDTH: 60, // Редактор и вывод занимают 70% ширины
}

type TabType = 'problem' | 'results';

export default function ProblemPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const { token } = useAuth()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('python')
  
  // Вместо одной переменной code создаем объект с кодом для каждого языка
  const [codes, setCodes] = useState<Record<string, string>>({
    python: getDefaultTemplate('python'),
    cpp: getDefaultTemplate('cpp'),
    java: getDefaultTemplate('java')
  })
  
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
      .then((data) => {
        setProblem(data)
        
        // Если задача уже решена, устанавливаем язык и код из сохраненного решения
        if (data.solved && data.solution) {
          const solutionLanguage = data.solution.language as 'python' | 'cpp' | 'java'
          setLanguage(solutionLanguage)
          
          // Обновляем код только для данного языка
          setCodes(prevCodes => ({
            ...prevCodes,
            [solutionLanguage]: data.solution.code
          }))
          
          // Формируем объект output на основе данных из решения
          setOutput({
            status: 'success',
            message: 'All test cases passed!',
            details: {
              average_time_ms: data.solution.average_time_ms,
              average_memory_kb: data.solution.average_memory_kb
            }
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [uuid, token])

  useEffect(() => {
    if (problem && activeTab === 'problem') {
      // Give DOM time to render the HTML content
      const timer = setTimeout(() => {
        // Process all pre elements
        document.querySelectorAll('.problem-description pre').forEach(pre => {
          pre.setAttribute('style', 'white-space: pre-wrap !important; word-break: break-all !important; max-width: 100% !important; overflow-wrap: break-word !important; overflow-x: auto !important;');
          
          // Find all children that could contain text that might overflow
          const allChildElements = pre.querySelectorAll('*');
          allChildElements.forEach(el => {
            el.setAttribute('style', 'white-space: pre-wrap !important; word-break: break-all !important; max-width: 100% !important; overflow-wrap: break-word !important;');
          });
        });
        
        // Process strong elements that might contain explanation text
        document.querySelectorAll('.problem-description strong').forEach(strong => {
          strong.setAttribute('style', 'display: inline-block; word-break: break-all !important; max-width: 100% !important; overflow-wrap: break-word !important;');
        });
        
        // Handle specific code elements inside pre blocks
        document.querySelectorAll('.problem-description pre code').forEach(code => {
          code.setAttribute('style', 'white-space: pre-wrap !important; word-break: break-all !important; max-width: 100% !important; overflow-wrap: break-word !important;');
        });
        
        // Process all inline elements that might not wrap properly
        document.querySelectorAll('.problem-description span, .problem-description font, .problem-description em').forEach(el => {
          el.setAttribute('style', 'display: inline-block; word-break: break-all !important; max-width: 100% !important; overflow-wrap: break-word !important;');
        });
        
        // Fix potential issues with tables or other block elements
        document.querySelectorAll('.problem-description table, .problem-description ul, .problem-description ol').forEach(el => {
          el.setAttribute('style', 'max-width: 100% !important; overflow-wrap: break-word !important; table-layout: fixed !important;');
        });
        
        // Process all <li> elements to ensure proper wrapping
        document.querySelectorAll('.problem-description li').forEach(el => {
          el.setAttribute('style', 'word-break: break-all !important; overflow-wrap: break-word !important;');
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [problem, activeTab]);

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
      // Используем текущий код для выбранного языка
      const currentCode = codes[language]
      const res = await submitSolution(uuid, { language, code: currentCode }, token || '')
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
                      const newLanguage = e.target.value as 'python' | 'cpp' | 'java'
                      setLanguage(newLanguage)
                      // Мы больше не меняем код при переключении языка,
                      // так как теперь храним код для каждого языка отдельно
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
                
                {/* Добавляем индикатор решенной задачи */}
                {problem?.solved && (
                  <div className="ml-2 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200 flex items-center">
                    <CheckIcon className="w-4 h-4 mr-1 text-green-500" />
                    Решено
                  </div>
                )}
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
                  // Используем код для текущего выбранного языка
                  value={codes[language]}
                  onChange={(v) => {
                    // Обновляем только код для текущего языка
                    setCodes(prevCodes => ({
                      ...prevCodes,
                      [language]: v || ''
                    }))
                  }}
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
                  output.status === 'success' ? 'bg-green-500 animate-pulse' : 
                  output.message === 'Code compilation failed' ? 'bg-red-500 animate-pulse' :
                  output.message === 'Code execution failed' ? 'bg-amber-500 animate-pulse' :
                  'bg-red-500 animate-pulse'
                }`}></span>
              )}
            </button>
          </div>

          {/* При загрузке страницы, если есть сохраненное решение, автоматически переходим на таб с результатами */}
          {problem?.solved && output && activeTab === 'problem' && (
            <div className="p-4 bg-blue-50 text-blue-800 border-b border-blue-100">
              <p className="flex items-center text-sm">
                <CheckIcon className="w-4 h-4 mr-2 text-blue-500" />
                У вас уже есть решение к этой задаче.
                <Button
                  variant="link"
                  className="ml-2 p-0 h-auto text-blue-600 font-medium"
                  onClick={() => setActiveTab('results')}
                >
                  Посмотреть результат
                </Button>
              </p>
            </div>
          )}

          {/* Содержимое табов */}
          <div className="flex-1 overflow-y-auto">
            {/* Таб с условием задачи */}
            {activeTab === 'problem' && (
              <div className="px-6 py-5 h-full">
                <div className="max-w-full break-words">
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
                  <div className="problem-description">
                    <div 
                      className="prose prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:overflow-wrap prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:break-all prose-code:whitespace-pre-wrap prose-strong:break-words prose-strong:inline-block pb-8"
                      dangerouslySetInnerHTML={{ __html: problem.description }}
                    />
                  </div>
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
                    {/* Compilation Error Display */}
                    {output.status === 'failed' && output.message === 'Code compilation failed' && (
                      <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200 flex items-center">
                          <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
                          <h3 className="text-sm font-medium text-red-700">Ошибка компиляции</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-x-auto border border-red-100 text-red-800 shadow-inner max-h-80 whitespace-pre-wrap">
                            {output.error_details || "Во время компиляции произошла ошибка"}
                          </pre>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>Возможные причины ошибки:</p>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              <li>Синтаксические ошибки в коде</li>
                              <li>Нехватка памяти в тестирующей системе</li>
                              <li>Использование неопределенных переменных или функций</li>
                              <li>Неправильные типы данных или несоответствие типов</li>
                              <li>Отсутствие необходимых библиотек или зависимостей</li>
                            </ul>
                            <p className="mt-2">Пожалуйста, исправьте ошибки и попробуйте снова.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Runtime Error Display */}
                    {output.status === 'failed' && output.message === 'Code execution failed' && (
                      <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center">
                          <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-amber-500" />
                          <h3 className="text-sm font-medium text-amber-700">Ошибка выполнения</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-gray-50 p-3 rounded-md text-xs font-mono overflow-x-auto border border-amber-100 text-amber-800 shadow-inner max-h-80 whitespace-pre-wrap">
                            {output.error_details || "Во время выполнения программы произошла ошибка"}
                          </pre>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>Возможные причины ошибки:</p>
                              <ul className="list-disc ml-5 mt-2 space-y-1">
                                <li>Синтаксические ошибки (если вы используете, например, язык <span className="px-1 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-sm border border-blue-100">Python</span>)</li>
                                <li>Ошибка во время выполнения (<span className="px-1 py-0.5 bg-red-50 text-red-700 rounded font-mono text-sm border border-red-100">Runtime Error</span>)</li>
                                <li>Бесконечный цикл или превышение лимита времени</li>
                                <li>Нехватка памяти или переполнение стека</li>
                                <li>Неправильная обработка ввода/вывода</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Performance metrics */}
                    {output.details && !(output.status === 'failed' && 
                      (output.message === 'Code compilation failed' || output.message === 'Code execution failed')) && (
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
                    {output.failed_tests?.length > 0 && !(output.status === 'failed' && 
                      (output.message === 'Code compilation failed' || output.message === 'Code execution failed')) && (
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
                                  {/* Updated grid layout for better alignment */}
                                  <div className="grid grid-cols-1 gap-4">
                                    {/* Input data box */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                        <div className="flex items-center text-xs font-semibold text-gray-600">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                          </svg>
                                          ВХОДНЫЕ ДАННЫЕ
                                        </div>
                                      </div>
                                      <div className="p-3">
                                        <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto font-mono text-gray-800 shadow-inner min-h-[40px] whitespace-pre-wrap break-words">{test.input || "(пустой ввод)"}</pre>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      {/* Expected output box */}
                                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div className="px-3 py-2 bg-green-50 border-b border-green-200">
                                          <div className="flex items-center text-xs font-semibold text-green-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            ОЖИДАЕМЫЙ РЕЗУЛЬТАТ
                                          </div>
                                        </div>
                                        <div className="p-3">
                                          <pre className="bg-green-50 p-3 rounded-md text-xs overflow-x-auto font-mono text-green-800 shadow-inner min-h-[40px] whitespace-pre-wrap break-words">{test.output || "(пустой вывод)"}</pre>
                                        </div>
                                      </div>
                                      
                                      {/* Actual output box */}
                                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <div className="px-3 py-2 bg-red-50 border-b border-red-200">
                                          <div className="flex items-center text-xs font-semibold text-red-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            ФАКТИЧЕСКИЙ РЕЗУЛЬТАТ
                                          </div>
                                        </div>
                                        <div className="p-3">
                                          <pre className="bg-red-50 p-3 rounded-md text-xs overflow-x-auto font-mono text-red-800 shadow-inner min-h-[40px] whitespace-pre-wrap break-words">{test.actual_output || "(пустой вывод)"}</pre>
                                        </div>
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
                        <div className="px-4 py-3 bg-green-50 border-b border-green-200">                          <h3 className="text-sm font-medium text-green-700 flex items-center">                            <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
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