const BASE_URL = "http://localhost:8080/api";

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

export const loginUser = (username: string, password: string) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
export const signUpUser = (username: string, password: string) =>
  request("/auth/signup", { method: "POST", body: JSON.stringify({ username, password }) });
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