import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Code2, 
  Shield, 
  LogOut,
  User,
  ChevronDown,
  Search
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function Header() {
  const { token, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md z-20 w-full border-b border-blue-200 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and brand */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-primary flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Code2 className="w-6 h-6 text-indigo-600" />
            <span className="text-xl tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text">АлгоХаб</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link 
            to="/" 
            className={cn(
              "text-sm font-medium py-2 px-3 rounded-md transition-colors",
              isActive("/") 
                ? "bg-indigo-50 text-indigo-700" 
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            Обзор
          </Link>
          
          <div className="ml-2 h-6 border-l border-slate-200"></div>

          {token ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2 ml-1 bg-slate-50 hover:bg-slate-100 text-slate-800"
                >
                  <User className="h-4 w-4 text-indigo-500" />
                  <span>Аккаунт</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2 text-purple-500" />
                      Панель Админа
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2 text-indigo-500" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-500">
                  <LogOut className="w-4 h-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/login')}
                className="hover:bg-slate-100 text-slate-700 hover:text-slate-900"
              >
                Вход
              </Button>
              <Button 
                variant="sexy" 
                size="sm" 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
              >
                Регистрация
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-3">
          {token && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-slate-50 text-indigo-600" 
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="fixed inset-0 bg-white z-50 pt-16 px-4 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex flex-col space-y-1">
              <MobileNavItem 
                to="/" 
                active={isActive("/")} 
                icon={<Search className="h-4 w-4 mr-3" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                Обзор
              </MobileNavItem>
              
              <MobileNavItem 
                to="/search" 
                active={isActive("/search")} 
                icon={<Search className="h-4 w-4 mr-3" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                Поиск
              </MobileNavItem>
              
              {token && (
                <>
                  <div className="h-px bg-border/60 my-1.5" />
                  
                  <MobileNavItem 
                    to="/profile" 
                    active={isActive("/profile")} 
                    icon={<User className="h-4 w-4 mr-3 text-indigo-500" />}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Профиль
                  </MobileNavItem>
                  
                  {isAdmin && (
                    <MobileNavItem 
                      to="/admin" 
                      active={isActive("/admin")} 
                      icon={<Shield className="h-4 w-4 mr-3 text-purple-500" />}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Панель Админа
                    </MobileNavItem>
                  )}
                  
                  <div className="h-px bg-border/60 my-1.5" />
                  
                  <button 
                    className="flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Выйти
                  </button>
                </>
              )}
              
              {!token && (
                <>
                  <div className="h-px bg-border/60 my-2" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        navigate('/login')
                        setMobileMenuOpen(false)
                      }}
                    >
                      Вход
                    </Button>
                    <Button 
                      variant="sexy" 
                      className="w-full" 
                      onClick={() => {
                        navigate('/signup')
                        setMobileMenuOpen(false)
                      }}
                    >
                      Регистрация
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

interface MobileNavItemProps {
  to: string
  active: boolean
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
}

function MobileNavItem({ to, active, children, icon, onClick }: MobileNavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center rounded-md px-3 py-2.5 text-sm font-medium",
        active 
          ? "bg-primary/10 text-primary" 
          : "text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  )
}