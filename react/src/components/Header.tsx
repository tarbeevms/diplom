// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { ListTodo, Shield } from 'lucide-react'

export default function Header() {
  const { token, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 bg-white/90 backdrop-blur-sm shadow-md z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
          <ListTodo className="w-6 h-6" />
          AlgoHub
        </Link>

        <nav className="flex items-center gap-4">
          {token ? (
            <>
              <Button variant="sexy" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 flex items-center gap-2"
                  onClick={() => navigate('/admin')}
                >
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
