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

// Add this function to handle unauthorized errors
function handleAuthError(errorText: string): boolean {
  // Check if the error contains "Not authorized" phrase
  if (typeof errorText === 'string' && 
      (errorText.includes('Not authorized') || 
       errorText.includes('Unauthorized') || 
       errorText.toLowerCase().includes('not authorized'))) {
    
    console.warn("Auth error detected:", errorText);
    
    // Dispatch custom event to notify the app about auth failure
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { message: errorText, forced: true }
    }));
    
    return true;
  }
  
  return false;
}

export async function request(url: string, options: RequestInit = {}, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    // Always include credentials to send cookies with every request
    const res = await fetch(`${BASE_URL}${url}`, { 
      ...options, 
      credentials: "include", // This ensures cookies are sent with the request
      headers 
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorObj;
      
      try {
        // Try to parse as JSON
        errorObj = JSON.parse(errorText);
        
        // Check if this is an auth error
        if (errorObj.error && handleAuthError(errorObj.error)) {
          // If it's an auth error, throw a simple error that won't show a toast
          throw new Error('Authentication required');
        }
        
      } catch (parseError) {
        // If parsing fails, use the raw text
        if (handleAuthError(errorText)) {
          throw new Error('Authentication required');
        }
        throw new Error(errorText);
      }
      
      throw new Error(errorObj.error || 'Unknown error');
    }
    
    return res.json();
  } catch (error) {
    // Only re-throw if it's not already handled as an auth error
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    
    const errorMessage = extractErrorMessage(error);
    if (!handleAuthError(errorMessage)) {
      // Only throw the original error if it's not an auth error
      throw error;
    } else {
      // For auth errors, throw a special error
      throw new Error('Authentication required');
    }
  }
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

export const getProblems = async (token: string) => {
  try {
    return await request("/problems", {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      // This is already handled by the auth event
      throw error;
    }
    
    // For other errors, show the error message
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить задачи: ${errorMessage}`);
  }
};

export const getProblem = async (id: string, token: string) => {
  try {
    return await request(`/problem/${id}`, {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить задачу: ${errorMessage}`);
  }
};

export const submitSolution = async (id: string, payload: any, token: string) => {
  try {
    const response = await fetch(`${BASE_URL}/problem/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    // Even if the response indicates failure, return the data 
    // so we can display the error details
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось отправить решение: ${errorMessage}`);
  }
};

export const getDashboard = async (token: string) => {
  try {
    return await request("/admin/dashboard", {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить панель управления: ${errorMessage}`);
  }
};

export const getProfile = async (token: string) => {
  try {
    return await request("/profile", {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить профиль: ${errorMessage}`);
  }
};

// Add this function to get solution history
export const getSolutionHistory = async (token: string, problemUUID?: string) => {
  try {
    const url = problemUUID ? `/solutions?problem_uuid=${problemUUID}` : '/solutions';
    return await request(url, {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить историю решений: ${errorMessage}`);
  }
};

// Admin API endpoints
export const createProblem = async (problem: { name: string; difficulty: string; description: string }, token: string) => {
  try {
    return await request("/admin/problem", { method: "POST", body: JSON.stringify(problem) }, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось создать задачу: ${errorMessage}`);
  }
};

export const deleteProblem = async (problemId: string, token: string) => {
  try {
    return await request(`/admin/problem/${problemId}`, { method: "DELETE" }, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось удалить задачу: ${errorMessage}`);
  }
};

export const getTestCases = async (problemId: string, token: string) => {
  try {
    return await request(`/admin/problem/${problemId}/testcases`, {}, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось загрузить тестовые случаи: ${errorMessage}`);
  }
};

export const addTestCase = async (problemId: string, testCase: { input: string; output: string }, token: string) => {
  try {
    return await request(`/admin/problem/${problemId}/testcase`, { method: "POST", body: JSON.stringify(testCase) }, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось добавить тестовый случай: ${errorMessage}`);
  }
};

export const deleteTestCase = async (testCaseId: string, token: string) => {
  try {
    return await request(`/admin/testcase/${testCaseId}`, { method: "DELETE" }, token);
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      throw error;
    }
    const errorMessage = extractErrorMessage(error);
    throw new Error(`Не удалось удалить тестовый случай: ${errorMessage}`);
  }
};