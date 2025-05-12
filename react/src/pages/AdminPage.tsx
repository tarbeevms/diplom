import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getProblems,
  createProblem,
  deleteProblem,
  getTestCases,
  addTestCase,
  deleteTestCase
} from '@/lib/api';
import { toast } from 'sonner';
import { 
  ReloadIcon, 
  PlusIcon, 
  Cross1Icon, 
  TrashIcon, 
  CheckIcon, 
  ArrowRightIcon, 
  ChevronRightIcon,
  ExternalLinkIcon,
  HomeIcon,
  DashboardIcon,
  Cross2Icon
} from '@radix-ui/react-icons';
import type { Problem } from '@/lib/types';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// TypeScript interface for test cases
interface TestCase {
  id: string | number;
  input: string;
  output: string;
  problem_uuid: string;
}

// Dialog/Modal component for test cases
const TestCasesDialog = ({ 
  isOpen, 
  onClose, 
  problemName,
  problemUuid,
  testCases,
  loading,
  onAddTestCase,
  onDeleteTestCase
}: { 
  isOpen: boolean;
  onClose: () => void;
  problemName: string;
  problemUuid: string;
  testCases: TestCase[];
  loading: boolean;
  onAddTestCase: (input: string, output: string) => Promise<void>;
  onDeleteTestCase: (id: string | number) => Promise<void>;
}) => {
  const [newTestCase, setNewTestCase] = useState({
    input: '',
    output: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddTestCase(newTestCase.input, newTestCase.output);
    setNewTestCase({ input: '', output: '' });
  };

  // Reset form when dialog opens with new problem
  useEffect(() => {
    if (isOpen) {
      setNewTestCase({ input: '', output: '' });
    }
  }, [isOpen, problemUuid]);

  if (!isOpen) return null;

  // Helper function to safely format IDs
  const formatId = (id: string | number | undefined): string => {
    if (id === undefined) return 'Unknown';
    return String(id);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Dialog Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Test Cases: {problemName}
          </h2>
          <button 
            onClick={onClose} 
            className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
          >
            <Cross2Icon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Dialog Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="bg-white rounded-lg border border-purple-100 shadow-sm">
            <div className="px-5 py-4 border-b border-purple-100 bg-purple-50 rounded-t-lg">
              <h3 className="font-medium text-purple-800">Add New Test Case</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="input" className="block text-sm font-medium text-gray-700">Input</label>
                  <div className="relative">
                    <textarea
                      id="input"
                      value={newTestCase.input}
                      onChange={(e) => setNewTestCase({...newTestCase, input: e.target.value})}
                      required
                      className="w-full h-40 min-h-[10rem] resize-y px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      placeholder="Enter test case input"
                    ></textarea>
                    {newTestCase.input && (
                      <button 
                        type="button" 
                        onClick={() => setNewTestCase({...newTestCase, input: ''})}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <Cross1Icon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="output" className="block text-sm font-medium text-gray-700">Expected Output</label>
                  <div className="relative">
                    <textarea
                      id="output"
                      value={newTestCase.output}
                      onChange={(e) => setNewTestCase({...newTestCase, output: e.target.value})}
                      required
                      className="w-full h-40 min-h-[10rem] resize-y px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      placeholder="Enter expected output"
                    ></textarea>
                    {newTestCase.output && (
                      <button 
                        type="button" 
                        onClick={() => setNewTestCase({...newTestCase, output: ''})}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                      >
                        <Cross1Icon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white flex items-center gap-2"
                >
                  {loading ? <ReloadIcon className="animate-spin h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  Add Test Case
                </Button>
              </div>
            </form>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Existing Test Cases
              </h3>
              <span className="text-sm text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full font-medium">
                {testCases.length} {testCases.length === 1 ? 'test case' : 'test cases'}
              </span>
            </div>

            {testCases.length === 0 ? (
              <div className="text-center py-10 border rounded-lg border-dashed border-gray-300 bg-gray-50">
                <p className="text-gray-500">No test cases found for this problem.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <motion.div 
                    key={testCase.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3 border-b flex justify-between items-center">
                      <span className="font-medium text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-700" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Test Case #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">ID: {formatId(testCase.id)}</span>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => onDeleteTestCase(testCase.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0 flex items-center justify-center"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                      <div className="p-4">
                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          Input
                        </h4>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md text-sm overflow-x-auto border text-gray-800 max-h-60 font-mono">
                          {testCase.input || <span className="text-gray-400 italic">Empty input</span>}
                        </pre>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Expected Output
                        </h4>
                        <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md text-sm overflow-x-auto border text-gray-800 max-h-60 font-mono">
                          {testCase.output || <span className="text-gray-400 italic">Empty output</span>}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Dialog Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-5"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminPage() {
  const { token, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTab, setActiveTab] = useState('problems');
  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  
  // State for new problem form
  const [newProblem, setNewProblem] = useState({
    name: '',
    difficulty: 'easy',
    description: ''
  });
  
  // Helper function to safely format IDs
  const formatId = (id: string | number | undefined): string => {
    if (id === undefined) return 'Unknown';
    return String(id);
  };
  
  // Handle selection of a problem and load its test cases
  const handleSelectProblem = async (problem: Problem) => {
    if (!token) return;
    
    setSelectedProblem(problem);
    setLoading(true);
    
    try {
      const testCases = await getTestCases(problem.uuid, token);
      setTestCases(Array.isArray(testCases) ? testCases : []);
      setTestCaseDialogOpen(true);
    } catch (error: any) {
      toast.error(`Failed to load test cases: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Load all problems when component mounts
  useEffect(() => {
    if (!token) return;
    
    setLoading(true);
    getProblems(token)
      .then(setProblems)
      .catch(error => toast.error(`Failed to load problems: ${error.message}`))
      .finally(() => setLoading(false));
  }, [token]);
  
  // Handle adding a new problem
  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    try {
      const problem = await createProblem(newProblem, token);
      setProblems([...problems, problem]);
      setNewProblem({ name: '', difficulty: 'easy', description: '' });
      toast.success('Problem created successfully!');
      setActiveTab('problems');
    } catch (error: any) {
      toast.error(`Failed to create problem: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new test case
  const handleAddTestCase = async (input: string, output: string) => {
    if (!token || !selectedProblem) return;
    
    setLoading(true);
    try {
      const testCase = await addTestCase(selectedProblem.uuid, { input, output }, token);
      setTestCases([...testCases, testCase]);
      toast.success('Test case added successfully!');
    } catch (error: any) {
      toast.error(`Failed to add test case: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting a problem
  const handleDeleteProblem = async (problem: Problem) => {
    if (!token || !window.confirm(`Are you sure you want to delete "${problem.name}"?`)) return;
    
    setLoading(true);
    try {
      await deleteProblem(problem.uuid, token);
      setProblems(problems.filter(p => p.uuid !== problem.uuid));
      if (selectedProblem?.uuid === problem.uuid) {
        setSelectedProblem(null);
        setTestCases([]);
      }
      toast.success('Problem deleted successfully!');
    } catch (error: any) {
      toast.error(`Failed to delete problem: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle deleting a test case
  const handleDeleteTestCase = async (testCaseId: string | number) => {
    if (!token || !window.confirm('Are you sure you want to delete this test case?')) return;
    
    setLoading(true);
    try {
      // Convert testCaseId to string to match the expected parameter type
      await deleteTestCase(String(testCaseId), token);
      setTestCases(testCases.filter(tc => tc.id !== testCaseId));
      toast.success('Test case deleted successfully!');
    } catch (error: any) {
      toast.error(`Failed to delete test case: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Redirect non-admin users 
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Admin Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex items-center space-x-1 text-sm text-indigo-100 mb-2">
          <Link to="/" className="hover:text-white flex items-center">
            <HomeIcon className="w-3.5 h-3.5 mr-1" />
            <span>Home</span>
          </Link>
          <ChevronRightIcon className="w-3 h-3" />
          <span className="font-medium">Admin</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold flex items-center">
            <DashboardIcon className="w-7 h-7 mr-3" />
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-xs bg-indigo-800 bg-opacity-50 px-3 py-1 rounded-full">
              Total Problems: {problems.length}
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Improved tabs styling */}
        <TabsList className="mb-6 bg-white rounded-lg shadow border w-full flex space-x-1 p-1">
          <TabsTrigger 
            value="problems" 
            className="flex-1 py-2.5 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Problems
          </TabsTrigger>
          <TabsTrigger 
            value="create" 
            className="flex-1 py-2.5 font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
          >
            Create Problem
          </TabsTrigger>
        </TabsList>
        
        {/* Problems Tab */}
        <TabsContent value="problems">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border shadow-lg overflow-hidden">
                {/* Fixed card header background fill */}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      Manage Problems
                    </span>
                    {loading && <ReloadIcon className="animate-spin h-5 w-5 text-blue-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {problems.length === 0 ? (
                    <div className="text-center py-12 px-4 flex flex-col items-center">
                      <div className="rounded-full bg-blue-50 p-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-6">No problems found in the system.</p>
                      <Button 
                        onClick={() => setActiveTab('create')}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                      >
                        Create Your First Problem
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {problems.map((problem) => (
                        <motion.div 
                          key={problem.uuid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50"
                        >
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                              {problem.name}
                              <Link to={`/problem/${problem.uuid}`} className="text-blue-500 hover:text-blue-700 inline-flex items-center">
                                <ExternalLinkIcon className="h-3.5 w-3.5" />
                              </Link>
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  problem.difficulty === 'easy' ? 'bg-green-500' :
                                  problem.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></span>
                                <span className={`capitalize text-sm ${
                                  problem.difficulty === 'easy' ? 'text-green-700' :
                                  problem.difficulty === 'medium' ? 'text-yellow-700' : 'text-red-700'
                                }`}>
                                  {problem.difficulty}
                                </span>
                              </div>
                              
                              {/* Display both ID and UUID without truncation */}
                              {problem.id && (
                                <span className="text-sm text-gray-500">ID: {problem.id}</span>
                              )}
                              <span className="text-sm text-gray-500">UUID: {problem.uuid}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 ml-auto">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectProblem(problem)}
                              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Test Cases
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteProblem(problem)}
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex items-center gap-1.5 transition-all"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        
        {/* Create Problem Tab */}
        <TabsContent value="create">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border shadow-lg overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create New Problem
                    </span>
                    {loading && <ReloadIcon className="animate-spin h-5 w-5 text-emerald-500" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddProblem} className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Problem Name</label>
                        <Input
                          id="name"
                          value={newProblem.name}
                          onChange={(e) => setNewProblem({...newProblem, name: e.target.value})}
                          required
                          placeholder="Enter problem name"
                          className="shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                        <div className="relative">
                          <select
                            id="difficulty"
                            value={newProblem.difficulty}
                            onChange={(e) => setNewProblem({...newProblem, difficulty: e.target.value})}
                            required
                            className="w-full h-10 pl-3 pr-10 py-2 border rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <div 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer ${
                              newProblem.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => setNewProblem({...newProblem, difficulty: 'easy'})}
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Easy</span>
                          </div>
                          <div 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer ${
                              newProblem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => setNewProblem({...newProblem, difficulty: 'medium'})}
                          >
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            <span>Medium</span>
                          </div>
                          <div 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer ${
                              newProblem.difficulty === 'hard' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            onClick={() => setNewProblem({...newProblem, difficulty: 'hard'})}
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span>Hard</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (HTML)</label>
                        <textarea
                          id="description"
                          value={newProblem.description}
                          onChange={(e) => setNewProblem({...newProblem, description: e.target.value})}
                          required
                          className="w-full h-60 min-h-[15rem] resize-y px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm"
                          placeholder="Enter problem description in HTML format"
                        ></textarea>
                        <div className="bg-yellow-50 rounded-md p-3 mt-2 border border-yellow-200 flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="text-xs text-yellow-800">
                            <p className="font-medium mb-1">HTML formatting is supported:</p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li><code className="bg-yellow-100 px-1 py-0.5 rounded">&lt;h1&gt;Title&lt;/h1&gt;</code> - For headings</li>
                              <li><code className="bg-yellow-100 px-1 py-0.5 rounded">&lt;p&gt;Paragraph&lt;/p&gt;</code> - For paragraphs</li>
                              <li><code className="bg-yellow-100 px-1 py-0.5 rounded">&lt;code&gt;Code&lt;/code&gt;</code> - For inline code</li>
                              <li><code className="bg-yellow-100 px-1 py-0.5 rounded">&lt;pre&gt;Code block&lt;/pre&gt;</code> - For code blocks</li>
                              <li><code className="bg-yellow-100 px-1 py-0.5 rounded">&lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;</code> - For lists</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 text-base shadow-md"
                      >
                        {loading ? <ReloadIcon className="animate-spin h-5 w-5 mr-2" /> : <PlusIcon className="h-5 w-5 mr-2" />}
                        Create Problem
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Test Cases Modal Dialog */}
      {selectedProblem && (
        <TestCasesDialog 
          isOpen={testCaseDialogOpen}
          onClose={() => setTestCaseDialogOpen(false)}
          problemName={selectedProblem.name}
          problemUuid={selectedProblem.uuid}
          testCases={testCases}
          loading={loading}
          onAddTestCase={handleAddTestCase}
          onDeleteTestCase={handleDeleteTestCase}
        />
      )}
    </div>
  );
}