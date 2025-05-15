import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemPage from "./pages/ProblemPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import { AuthProvider, useAuth } from "./context/AuthContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return auth.token ? children : <Navigate to="/login" replace />;
}

// Route that requires admin privileges
function AdminRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth.token) return <Navigate to="/login" replace />;
  return auth.isAdmin ? children : <Navigate to="/" replace />;
}

// Add global auth monitor component
function AuthMonitor() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleAuthLogout = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      // If this is a forced logout, redirect to login
      if (customEvent.detail?.forced) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup') {
          // Add a slight delay to ensure auth context has been updated
          setTimeout(() => navigate('/login', { replace: true }), 50);
        }
      }
    };
    
    // Use capture to ensure this runs first
    window.addEventListener('auth:logout', handleAuthLogout, { capture: true });
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout, { capture: true });
    };
  }, [navigate]);
  
  return null; // This component doesn't render anything
}

export default function App() {
  return (
    <AuthProvider>
      {/* Add the auth monitor */}
      <AuthMonitor />
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
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Routes>
        </main>
        <Toaster richColors position="bottom-right" />
      </div>
    </AuthProvider>
  );
}