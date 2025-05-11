import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemPage from "./pages/ProblemPage";
import DashboardPage from "./pages/DashboardPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return auth.token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            <Route
              path="/"
              element={
                <PrivateRoute>
                  <ProblemsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/problem/:uuid"
              element={
                <PrivateRoute>
                  <ProblemPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Toaster richColors position="bottom-right" />
      </div>
    </AuthProvider>
  );
}