const BASE_URL = "http://localhost:8080/api";

/**
 * Extract readable error message from different error formats
 */
export function extractErrorMessage(error: any): string {
  // If the error is already a string
  if (typeof error === 'string') {
    // Check if it's JSON formatted
    if (error.startsWith('{') && error.endsWith('}')) {
      try {
        const parsed = JSON.parse(error);
        return parsed.error || error;
      } catch {
        return error;
      }
    }
    return error;
  }
  
  // If error has a response property (Axios error)
  if (error.response && error.response.data) {
    if (typeof error.response.data === 'string') {
      try {
        const parsed = JSON.parse(error.response.data);
        return parsed.error || 'Ошибка сервера';
      } catch {
        return error.response.data;
      }
    }
    return error.response.data.error || 'Ошибка сервера';
  }
  
  // If error has message property
  if (error.message) {
    return error.message;
  }
  
  // If error has an error property
  if (error.error) {
    return error.error;
  }
  
  // Default
  return 'Неизвестная ошибка';
}

export async function request(url: string, options: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // Добавляем credentials: "include" для всех запросов
  const res = await fetch(`${BASE_URL}${url}`, { ...options, credentials: "include", headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при входе');
    }
    
    return data;
  } catch (error) {
    // Use the extractErrorMessage helper to get a clean error
    throw new Error(extractErrorMessage(error));
  }
};

export const signUpUser = async (username: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при регистрации');
    }
    
    return data;
  } catch (error) {
    // Use the extractErrorMessage helper to get a clean error
    throw new Error(extractErrorMessage(error));
  }
};

export const getProblems = (token: string) => request("/problems", {}, token);
export const getProblem = (id: string, token: string) => request(`/problem/${id}`, {}, token);
export const submitSolution = (id: string, payload: any, token: string) =>
  request(`/problem/${id}`, { method: "POST", body: JSON.stringify(payload) }, token);
export const getDashboard = (token: string) => request("/admin/dashboard", {}, token);
export const getProfile = (token: string) => request("/profile", {}, token);

// Admin API endpoints
export const createProblem = (problem: { name: string; difficulty: string; description: string }, token: string) =>
  request("/admin/problem", { method: "POST", body: JSON.stringify(problem) }, token);

export const deleteProblem = (problemId: string, token: string) =>
  request(`/admin/problem/${problemId}`, { method: "DELETE" }, token);

export const getTestCases = (problemId: string, token: string) =>
  request(`/admin/problem/${problemId}/testcases`, {}, token);

export const addTestCase = (problemId: string, testCase: { input: string; output: string }, token: string) =>
  request(`/admin/problem/${problemId}/testcase`, { method: "POST", body: JSON.stringify(testCase) }, token);

export const deleteTestCase = (testCaseId: string, token: string) =>
  request(`/admin/testcase/${testCaseId}`, { method: "DELETE" }, token);