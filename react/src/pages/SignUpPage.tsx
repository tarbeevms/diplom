// filepath: src/pages/SignUpPage.tsx

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpUser } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { User, KeyRound, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameTaken, setUsernameTaken] = useState(false)
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setUsernameTaken(false)

    try {
      const { token } = await signUpUser(username, password)
      auth?.login(token, false)
      toast.success('Аккаунт успешно создан!')
      navigate('/')
    } catch (err: any) {
      console.error("Signup error:", err);
      
      // Parse the error message based on different possible formats
      let errorMessage: string;
      
      // Case 1: If err.message is already a string
      if (typeof err.message === 'string') {
        // Check if the message is JSON formatted
        if (err.message.startsWith('{') && err.message.endsWith('}')) {
          try {
            const parsedError = JSON.parse(err.message);
            errorMessage = parsedError.error || "Произошла ошибка при регистрации";
          } catch {
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      } 
      // Case 2: If err.response exists (Axios error)
      else if (err.response && err.response.data) {
        errorMessage = err.response.data.error || "Произошла ошибка при регистрации";
      }
      // Case 3: If err itself has an error property
      else if (err.error) {
        errorMessage = err.error;
      } 
      // Default fallback
      else {
        errorMessage = "Произошла ошибка при регистрации";
      }
      
      // Handle the specific error for username already taken
      if (errorMessage === 'User already exists') {
        setUsernameTaken(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    // Clear the username error when user starts typing again
    if (usernameTaken) {
      setUsernameTaken(false)
      setError(null)
    }
  }

  return (
    <motion.div 
      className="flex justify-center items-center min-h-[90vh] p-4 bg-gradient-to-b from-background to-muted/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <form onSubmit={handleSubmit} className="w-full bg-card p-8 rounded-2xl shadow-xl space-y-6 border border-border/40">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Создание аккаунта</h1>
            <p className="text-muted-foreground text-sm">Введите данные для начала работы с АлгоХаб</p>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="border border-red-300 text-red-800 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <User className={`absolute left-3 top-2.5 h-5 w-5 ${usernameTaken ? 'text-red-500' : 'text-muted-foreground'}`} />
              <Input 
                placeholder="Имя пользователя" 
                value={username} 
                onChange={handleUsernameChange}
                className={`pl-10 bg-background ${usernameTaken ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
                aria-invalid={usernameTaken}
                aria-describedby={usernameTaken ? "username-error" : undefined}
              />
              {usernameTaken && (
                <div className="flex items-center mt-1 text-xs text-red-600" id="username-error">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  <span>Это имя пользователя уже занято</span>
                </div>
              )}
            </div>
            
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="Пароль" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="pl-10 bg-background"
                required
                minLength={6}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            variant="sexy" 
            size="lg" 
            className="w-full font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Создание аккаунта...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Уже есть аккаунт?{' '}
              <Link className="font-medium text-blue-500 hover:text-blue-700 hover:underline transition-all" to="/login">
                Войти
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
