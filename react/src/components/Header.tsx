import { useState, useRef, useEffect } from 'react'
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
  Home
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
  const headerRef = useRef<HTMLElement>(null)
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuOpen && headerRef.current && 
          !headerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  // Close the mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])
  
  const isActive = (path: string) => location.pathname === path

  return (
    <header ref={headerRef} className="sticky top-0 bg-white z-20 w-full border-b border-blue-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between relative">
        {/* Logo and brand */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-primary flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Code2 className="w-6 h-6 text-blue-600" />
            <span className="text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">АлгоХаб</span>
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

        {/* Mobile Navigation - Dropdown style */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden md:hidden"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ 
                duration: 0.2,
                ease: 'easeInOut'
              }}
            >
              <div className="py-2 px-1">
                <MobileNavItem 
                  to="/" 
                  active={isActive("/")} 
                  icon={<Home className="h-4 w-4 mr-3" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Обзор
                </MobileNavItem>
                
                {token && (
                  <>
                    <div className="h-px bg-gray-200 my-1.5 mx-3" />
                    
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
                    
                    <div className="h-px bg-gray-200 my-1.5 mx-3" />
                    
                    <button 
                      className="flex items-center rounded-md px-4 py-2 w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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
                    <div className="h-px bg-gray-200 my-2 mx-3" />
                    <div className="grid grid-cols-2 gap-2 p-2">
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
      </div>
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
        "flex items-center rounded-md px-4 py-2 mx-1 text-sm font-medium transition-colors",
        active 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  )
}