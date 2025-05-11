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
export const getProblems = (token: string) => request("/admin/problems", {}, token);
export const getProblem = (id: string, token: string) => request(`/problem/${id}`, {}, token);
export const submitSolution = (id: string, payload: any, token: string) =>
  request(`/problem/${id}`, { method: "POST", body: JSON.stringify(payload) }, token);
export const getDashboard = (token: string) => request("/admin/dashboard", {}, token);
export const getProfile = (token: string) => request("/profile", {}, token);