// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { ListTodo } from 'lucide-react'

export default function Header() {
  const { token, logout } = useAuth()       // token и logout гарантированно существуют
  const navigate = useNavigate()            // добавили хук

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
