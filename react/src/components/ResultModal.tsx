import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, CrossCircledIcon, ClockIcon, LayersIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    status: string;
    passed_tests: number;
    total_tests: number;
    details?: {
      average_time_ms: number;
      average_memory_kb: number;
    };
    failed_tests?: Array<{
      input: string;
      output: string;
      actual_output: string;
      error_message?: string;
    }>;
  };
}

const ResultModal = ({ isOpen, onClose, results }: ResultModalProps) => {
  const isSuccess = results.status === 'success';
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
                      {isSuccess ? (
                        <CheckIcon className="h-6 w-6 text-green-600" />
                      ) : (
                        <CrossCircledIcon className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        {isSuccess ? 'Решение верно!' : 'Решение содержит ошибки'}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-gray-500">
                        Пройдено тестов: {results.passed_tests} из {results.total_tests}
                      </Dialog.Description>
                    </div>
                  </div>
                  <StatusBadge status={results.status} size="lg" />
                </div>

                {/* Performance metrics */}
                {results.details && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6">
                    <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Показатели производительности</h3>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="p-4 flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <span className="text-sm font-semibold text-gray-500">Время выполнения</span>
                          <div className="flex items-baseline">
                            <span className="text-blue-700 font-bold text-xl">{results.details.average_time_ms}</span>
                            <span className="text-blue-600 ml-1 text-sm">мс</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-center">
                        <LayersIcon className="h-5 w-5 text-purple-500 mr-2" />
                        <div>
                          <span className="text-sm font-semibold text-gray-500">Использовано памяти</span>
                          <div className="flex items-baseline">
                            <span className="text-purple-700 font-bold text-xl">{results.details.average_memory_kb}</span>
                            <span className="text-purple-600 ml-1 text-sm">КБ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test cases */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Результаты тестов</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {isSuccess ? (
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                        <span className="text-green-800">Все тесты пройдены успешно!</span>
                      </div>
                    ) : (
                      results.failed_tests?.map((test, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex justify-between">
                            <span className="text-sm font-medium text-red-800">Тест #{idx + 1}</span>
                            <span className="text-xs text-red-600">Не пройден</span>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Входные данные</div>
                              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto border border-gray-200 max-h-24">{test.input}</pre>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Ожидаемый результат</div>
                                <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto border border-green-200 max-h-24">{test.output}</pre>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Фактический результат</div>
                                <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto border border-red-200 max-h-24">{test.actual_output}</pre>
                              </div>
                            </div>
                            {test.error_message && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Описание ошибки</div>
                                <pre className="bg-red-50 p-2 rounded text-xs overflow-x-auto border border-red-200 text-red-700">{test.error_message}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" className="mr-2" onClick={onClose}>
                    Закрыть
                  </Button>
                  {!isSuccess && (
                    <Button>
                      Исправить решение
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResultModal;