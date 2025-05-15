import React, { useState, useEffect } from 'react';
import { getProfile, getSolutionHistory } from '@/lib/api';
import axios from 'axios';
import { Container, Row, Col } from 'react-bootstrap';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Zap, 
  CheckCircle, 
  LineChart, 
  Clock, 
  User, 
  Layout, 
  Calendar, 
  Code, 
  BarChart4, 
  Circle, 
  AlertCircle,
  Eye,
  ChevronDown
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface Problem {
  id: number;
  uuid: string;
  name: string;
  difficulty: string;
  description: string;
  solved: boolean;
}

interface Solution {
  average_time_ms: number;
  average_memory_kb: number;
  created_at: string;
  code: string;
  language: string;
  status: string;
}

interface SolutionCounts {
  [key: string]: number;
}

interface ProfileData {
  username: string;
  role: string;
  userID: string;
  streak: number;
  longestStreak: number;
  successRate: number;
  problems: Problem[];
  problemsByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function ProfilePage() {
  const { token } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [solutionCounts, setSolutionCounts] = useState<SolutionCounts>({});
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null);

  // Colors for charts and UI elements
  const COLORS = {
    easy: '#10b981',    // Green for easy problems
    medium: '#f59e0b',  // Amber for medium problems
    hard: '#ef4444',    // Red for hard problems
    primary: '#6366f1', // Indigo for primary elements
    background: '#f8fafc' // Light background
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) return;

      try {
        setLoading(true);

        // Use the API function that makes the correct request
        const data = await getProfile(token);
        console.log('API Response:', data);

        // Set the profile data directly from API without modifications
        setProfileData(data);
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
        setError('Не удалось загрузить данные профиля');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [token]);

  useEffect(() => {
    const fetchSolutions = async () => {
      if (!token || !expandedProblem) {
        setSolutions([]);
        return;
      }
      
      try {
        setSolutionsLoading(true);
        const data = await getSolutionHistory(token, expandedProblem);
        setSolutions(data.solutions || []);
      } catch (err) {
        console.error('Failed to fetch solutions:', err);
        setSolutions([]);
      } finally {
        setSolutionsLoading(false);
      }
    };
    
    fetchSolutions();
  }, [token, expandedProblem]);

  useEffect(() => {
    const fetchAllSolutionCounts = async () => {
      if (!token || !profileData?.problems) return;
      
      try {
        const counts: SolutionCounts = {};
        
        // Fetch solutions for each problem to count them
        const promises = profileData.problems.map(async (problem) => {
          try {
            const data = await getSolutionHistory(token, problem.uuid);
            counts[problem.uuid] = (data.solutions || []).length;
          } catch (error) {
            console.error(`Failed to fetch solutions for problem ${problem.uuid}:`, error);
            counts[problem.uuid] = 0;
          }
        });
        
        await Promise.all(promises);
        setSolutionCounts(counts);
      } catch (error) {
        console.error('Failed to fetch solution counts:', error);
      }
    };
    
    fetchAllSolutionCounts();
  }, [token, profileData]);

  // Calculate problem statistics
  const calculateProblemStats = () => {
    if (!profileData) return { total: 0, solved: 0, solvedPercentage: 0 };

    // Get problems array (ensure it exists)
    const problems = profileData.problems || [];

    // Calculate total and solved problems
    const total = problems.length;
    const solved = problems.filter(problem => problem.solved).length;

    // Calculate percentage (avoid division by zero)
    const solvedPercentage = total > 0 ? (solved / total) * 100 : 0;

    return { total, solved, solvedPercentage };
  };

  // Prepare data for the difficulty distribution chart
  const prepareDifficultyData = () => {
    if (!profileData) return [];

    // Add null check for problemsByDifficulty
    const problemsByDifficulty = profileData.problemsByDifficulty || { easy: 0, medium: 0, hard: 0 };

    return [
      { name: 'Легкие', value: problemsByDifficulty.easy || 0, color: COLORS.easy },
      { name: 'Средние', value: problemsByDifficulty.medium || 0, color: COLORS.medium },
      { name: 'Сложные', value: problemsByDifficulty.hard || 0, color: COLORS.hard }
    ].filter(item => item.value > 0); // Only include non-zero values
  };

  // Prepare data for problems distribution chart
  const prepareProblemStatusData = () => {
    if (!profileData) return [];

    const { total, solved } = calculateProblemStats();

    return [
      { name: "Решено", value: solved, color: COLORS.primary },
      { name: "Не решено", value: total - solved, color: "#e2e8f0" }
    ].filter(item => item.value > 0); // Only include non-zero values
  };

  // Helper function to get difficulty badge variant
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Легкая</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Средняя</Badge>;
      case 'hard':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Сложная</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  // NEW: Function to count problems by difficulty in total (not just solved ones)
  const countTotalProblemsByDifficulty = () => {
    if (!profileData?.problems) return { easy: 0, medium: 0, hard: 0 };
    
    const counts = {
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    profileData.problems.forEach(problem => {
      if (problem.difficulty in counts) {
        counts[problem.difficulty as keyof typeof counts]++;
      }
    });
    
    return counts;
  };

  // Helper function for formatting dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateStr;
    }
  };

  // Helper function for solution status badge
  const getSolutionStatusBadge = (status: string) => {
    return status === 'accepted' ? (
      <Badge variant="success">Принято</Badge>
    ) : (
      <Badge variant="danger">Отклонено</Badge>
    );
  };

  // Filter problems to show only those that are solved or have attempts
  const getFilteredProblems = () => {
    if (!profileData?.problems) return [];
    
    return profileData.problems.filter(problem => {
      // Include if problem is solved
      if (problem.solved) return true;
      
      // Include if problem has at least one solution attempt
      if (solutionCounts[problem.uuid] && solutionCounts[problem.uuid] > 0) return true;
      
      // Otherwise, don't include
      return false;
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-20 w-24" />
            <Skeleton className="h-20 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>

        <Skeleton className="h-96" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle size={20} />
              Ошибка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              className="mt-4 w-full"
              onClick={() => window.location.reload()}
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render empty state if no profile data
  if (!profileData) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Card className="w-full max-w-md bg-white">
          <CardHeader>
            <CardTitle>Профиль не найден</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Информация о профиле недоступна</p>
            <Button 
              className="mt-4 w-full"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate problem statistics
  const { total: totalProblems, solved: solvedProblems, solvedPercentage } = calculateProblemStats();
  const difficultyData = prepareDifficultyData();
  const problemStatusData = prepareProblemStatusData();

  return (
    <motion.div 
      className="container mx-auto py-8 space-y-6 bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Profile Header */}
      <motion.div 
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-md border border-gray-100"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {(profileData.username || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profileData.username || 'User'}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={profileData.role === 'admin' ? 
                "bg-red-50 text-red-700 border-red-200" : 
                "bg-blue-50 text-blue-700 border-blue-200"
              }>
                {profileData.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </Badge>
              <span className="text-gray-500 text-sm">ID: {profileData.userID || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 self-stretch md:self-auto">

          <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center">
            <div className="text-green-600 text-sm font-medium">Серия</div>
            <div className="text-green-800 font-bold flex items-center gap-1">
              <Zap size={16} className="text-amber-500" />
              {profileData.streak} {profileData.streak === 1 ? 'день' : 
               profileData.streak > 1 && profileData.streak < 5 ? 'дня' : 'дней'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Успешность</p>
                  <h3 className="text-2xl font-bold mt-1">{profileData.successRate}%</h3>
                  <p className="text-sm text-gray-600 mt-1">Решенных задач</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <LineChart size={20} className="text-green-500" />
                </div>
              </div>
              <Progress 
                value={profileData.successRate} 
                className="h-1 mt-4 bg-gray-100" 
                indicatorClassName="bg-gradient-to-r from-green-400 to-green-600" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Текущая серия</p>
                  <h3 className="text-2xl font-bold mt-1">{profileData.streak} {profileData.streak === 1 ? 'день' : 'дней'}</h3>
                  <p className="text-sm text-gray-600 mt-1">Решений подряд</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Zap size={20} className="text-amber-500" />
                </div>
              </div>
              <Progress 
                value={profileData.streak > 0 ? (profileData.streak / Math.max(profileData.streak, 7) * 100) : 0} 
                className="h-1 mt-4 bg-gray-100" 
                indicatorClassName="bg-gradient-to-r from-amber-400 to-amber-600" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Лучшая серия</p>
                  <h3 className="text-2xl font-bold mt-1">{profileData.longestStreak} {profileData.longestStreak === 1 ? 'день' : 'дней'}</h3>
                  <p className="text-sm text-gray-600 mt-1">Максимальная серия</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Trophy size={20} className="text-purple-500" />
                </div>
              </div>
              <Progress 
                value={Math.min(100, (profileData.longestStreak / 14) * 100)} 
                className="h-1 mt-4 bg-gray-100" 
                indicatorClassName="bg-gradient-to-r from-purple-400 to-purple-600" 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">Решено задач</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {profileData.problems && profileData.problems.filter(p => p.solved).length}/
                    {profileData.problems ? profileData.problems.length : 0}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {((profileData.problems && profileData.problems.filter(p => p.solved).length) / 
                      Math.max(1, profileData.problems ? profileData.problems.length : 1) * 100).toFixed(0)}% выполнено
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle size={20} className="text-blue-500" />
                </div>
              </div>
              <Progress 
                value={(profileData.problems && profileData.problems.filter(p => p.solved).length) / 
                  Math.max(1, profileData.problems ? profileData.problems.length : 1) * 100} 
                className="h-1 mt-4 bg-gray-100" 
                indicatorClassName="bg-gradient-to-r from-blue-400 to-blue-600" 
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for detailed statistics */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-gray-100">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <BarChart4 size={16} className="mr-2" />
              Общая статистика
            </TabsTrigger>
            <TabsTrigger value="problems" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Code size={16} className="mr-2" />
              Решенные и попытки решения
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Improved Progress and Distribution Card */}
            <Card className="overflow-hidden bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart4 size={18} className="mr-2 text-indigo-500" />
                  Прогресс и распределение задач
                </CardTitle>
                <CardDescription>
                  Статистика решенных задач по уровням сложности
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Main content with gradient background */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6">
                  <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
                    {/* Left side: Circular progress with total stats */}
                    <div className="relative w-44 h-44 flex-shrink-0">
                      {/* Background Circle */}
                      <div className="absolute inset-0 rounded-full border-[10px] border-gray-100"></div>
                      
                      {/* Progress Circle */}
                      <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="45" 
                          fill="none" 
                          stroke="url(#progressGradient)" 
                          strokeWidth="10"
                          strokeDasharray={`${solvedPercentage * 2.83}, 1000`} 
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#4338ca" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-indigo-700">{solvedPercentage.toFixed(0)}%</span>
                        <div className="flex items-center mt-1">
                          <CheckCircle size={14} className="text-green-500 mr-1" />
                          <span className="text-sm text-gray-600 font-medium">{solvedProblems}/{totalProblems}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side: Distribution chart - UPDATED to remove labels */}
                    <div className="w-full lg:max-w-[240px] h-44 flex-shrink-0">
                      {difficultyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={difficultyData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={70}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="value"
                              paddingAngle={2}
                              // Removed the label prop to avoid overflow
                            >
                              {difficultyData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.color} 
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [`${value} задач (${solvedProblems > 0 ? ((value as number) / solvedProblems * 100).toFixed(0) : 0}%)`, name]}
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                borderRadius: '8px', 
                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
                                border: 'none',
                                padding: '8px 12px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-center text-gray-400">
                            <Circle size={40} className="mx-auto mb-2 stroke-gray-300" />
                            <p className="text-sm">Нет решенных задач</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Right side: Difficulty breakdown */}
                    <div className="flex-1 w-full space-y-4 mt-2 lg:mt-0">
                      {/* Calculate total problems by difficulty */}
                      {(() => {
                        const totalsByDifficulty = countTotalProblemsByDifficulty();
                        
                        return (
                          <>
                            {/* Easy problems */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                  <span className="font-medium text-gray-800">Легкие</span>
                                </div>
                                <span className="text-sm font-semibold">
                                  {profileData.problemsByDifficulty.easy || 0} из {totalsByDifficulty.easy}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" 
                                  style={{ width: `${totalsByDifficulty.easy ? 
                                    (profileData.problemsByDifficulty.easy / totalsByDifficulty.easy * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Medium problems */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                  <span className="font-medium text-gray-800">Средние</span>
                                </div>
                                <span className="text-sm font-semibold">
                                  {profileData.problemsByDifficulty.medium || 0} из {totalsByDifficulty.medium}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" 
                                  style={{ width: `${totalsByDifficulty.medium ? 
                                    (profileData.problemsByDifficulty.medium / totalsByDifficulty.medium * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Hard problems */}
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                  <span className="font-medium text-gray-800">Сложные</span>
                                </div>
                                <span className="text-sm font-semibold">
                                  {profileData.problemsByDifficulty.hard || 0} из {totalsByDifficulty.hard}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full" 
                                  style={{ width: `${totalsByDifficulty.hard ? 
                                    (profileData.problemsByDifficulty.hard / totalsByDifficulty.hard * 100) : 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Summary footer with more detailed legend */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-6">
                      {difficultyData.map((entry, index) => (
                        <div key={`stat-${index}`} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-sm text-gray-600">
                            {entry.name}: <span className="font-semibold">{entry.value}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({(entry.value / solvedProblems * 100).toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-indigo-500" />
                      <span>Всего решено {solvedProblems} из {totalProblems} задач</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              
            {/* ...rest of the content... */}
            
          </TabsContent>

          {/* Problems Tab */}
          <TabsContent value="problems" className="space-y-6">
            <Card className="bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Code size={18} className="mr-2 text-indigo-500" />
                  Решенные и попытки решения
                </CardTitle>
                <CardDescription>
                  История ваших решенных задач и попыток решения
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Calculate filtered problems */}
                {(() => {
                  const filteredProblems = getFilteredProblems();
                  
                  if (filteredProblems.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full mx-auto p-6 w-16 h-16 flex items-center justify-center mb-4">
                          <Code size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Нет попыток решения</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                          У вас пока нет решенных задач или попыток решения
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-6">
                      {/* Problem List with Solution Counts - Using grid */}
                      <div className="overflow-hidden">
                        <div className="rounded-md border bg-white">
                          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50">
                            <div className="col-span-1 font-medium text-sm">ID</div>
                            <div className="col-span-5 font-medium text-sm">Название</div>
                            <div className="col-span-2 text-center font-medium text-sm">Сложность</div>
                            <div className="col-span-2 text-center font-medium text-sm">Статус</div>
                            <div className="col-span-2 text-center font-medium text-sm">Решения</div>
                          </div>
                          <div className="divide-y">
                            {filteredProblems.map((problem, index) => (
                              <React.Fragment key={problem.uuid}>
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05, duration: 0.2 }}
                                  className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${
                                    expandedProblem === problem.uuid ? 'bg-muted/40' : 'bg-white'
                                  }`}
                                >
                                  <div className="col-span-1 text-center text-gray-500">{problem.id}</div>
                                  <div className="col-span-5 font-medium">{problem.name}</div>
                                  <div className="col-span-2 text-center">
                                    {getDifficultyBadge(problem.difficulty)}
                                  </div>
                                  <div className="col-span-2 text-center">
                                    {problem.solved ? (
                                      <Badge variant="success">Решено</Badge>
                                    ) : (
                                      <Badge variant="warning">Попытка</Badge>
                                    )}
                                  </div>
                                  <div className="col-span-2 text-center">
                                    {/* Solution count button */}
                                    <button 
                                      onClick={() => setExpandedProblem(prev => prev === problem.uuid ? null : problem.uuid)}
                                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium
                                        ${solutionCounts[problem.uuid] > 0 
                                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' 
                                          : 'bg-gray-50 text-gray-500'}`}
                                    >
                                      <span>{
                                        solutionCounts[problem.uuid] !== undefined 
                                          ? `${solutionCounts[problem.uuid]} попыток` 
                                          : "Загрузка..."
                                      }</span>
                                      <ChevronDown 
                                        className={`ml-1 h-4 w-4 transition-transform ${
                                          expandedProblem === problem.uuid ? 'rotate-180' : ''
                                        }`} 
                                      />
                                    </button>
                                  </div>
                                </motion.div>
                                
                                {/* Expanded solutions section */}
                                {expandedProblem === problem.uuid && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="col-span-12 bg-gray-100 px-4 py-3"
                                  >
                                    {solutionsLoading ? (
                                      <div className="flex justify-center py-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                      </div>
                                    ) : solutions.length === 0 ? (
                                      <div className="text-center py-6 bg-white rounded-md p-4">
                                        <p className="text-gray-500">Нет данных о решениях</p>
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-md border overflow-hidden shadow-sm">
                                        {/* Solutions table header */}
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/20 font-medium text-xs text-gray-600">
                                          <div className="col-span-3">Дата</div>
                                          <div className="col-span-2">Статус</div>
                                          <div className="col-span-2">Язык</div>
                                          <div className="col-span-2 text-right">Время, мс</div>
                                          <div className="col-span-2 text-right">Память, КБ</div>
                                          <div className="col-span-1 text-center">Код</div>
                                        </div>
                                        
                                        {/* Solutions list */}
                                        <div className="divide-y">
                                          {solutions.map((solution, idx) => (
                                            <div 
                                              key={`${expandedProblem}-${idx}`} 
                                              className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50"
                                            >
                                              <div className="col-span-3">{formatDate(solution.created_at)}</div>
                                              <div className="col-span-2">
                                                {solution.status === 'accepted' ? (
                                                  <Badge variant="success">Принято</Badge>
                                                ) : (
                                                  <Badge variant="danger">Отклонено</Badge>
                                                )}
                                              </div>
                                              <div className="col-span-2">{solution.language}</div>
                                              <div className="col-span-2 text-right">{solution.average_time_ms.toFixed(2)}</div>
                                              <div className="col-span-2 text-right">{solution.average_memory_kb.toFixed(2)}</div>
                                              <div className="col-span-1 text-center">
                                                <Button 
                                                  variant="outline" 
                                                  size="sm" 
                                                  onClick={() => {
                                                    alert(solution.code || 'Код не доступен');
                                                  }}
                                                >
                                                  <Eye size={14} />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Action Cards */}
    
    </motion.div>
  );
}
