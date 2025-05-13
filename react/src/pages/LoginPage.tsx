import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInvalidCredentials(false);

    try {
      const { token } = await loginUser(username, password);
      if (auth) {
        auth.login(token, rememberMe);
      }
      toast.success("Вы успешно вошли в систему!");
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Parse the error message based on different possible formats
      let errorMessage: string;
      
      // Case 1: If err.message is already a string
      if (typeof err.message === 'string') {
        // Check if the message is JSON formatted
        if (err.message.startsWith('{') && err.message.endsWith('}')) {
          try {
            const parsedError = JSON.parse(err.message);
            errorMessage = parsedError.error || "Произошла ошибка при входе";
          } catch {
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      } 
      // Case 2: If err.response exists (Axios error)
      else if (err.response && err.response.data) {
        errorMessage = err.response.data.error || "Произошла ошибка при входе";
      }
      // Case 3: If err itself has an error property
      else if (err.error) {
        errorMessage = err.error;
      } 
      // Default fallback
      else {
        errorMessage = "Произошла ошибка при входе";
      }
      
      // Handle the specific error for invalid credentials
      if (errorMessage === 'Invalid username or password') {
        setInvalidCredentials(true);
        setError("Неверное имя пользователя или пароль");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    if (invalidCredentials) {
      setInvalidCredentials(false);
      setError(null);
    }
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Вход в аккаунт</h1>
            <p className="text-muted-foreground text-sm">Введите свои данные для входа в систему</p>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="border border-red-300 text-red-800 bg-red-50">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Логин" 
                value={username} 
                onChange={(e) => {
                  setUsername(e.target.value);
                  handleInputChange();
                }} 
                className={`pl-10 bg-background ${invalidCredentials ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
            </div>
            
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input 
                type="password" 
                placeholder="Пароль" 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }} 
                className={`pl-10 bg-background ${invalidCredentials ? 'border-red-500 focus:ring-red-500' : ''}`}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="rememberMe" 
                checked={rememberMe} 
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label 
                htmlFor="rememberMe" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Запомнить меня
              </label>
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
                Вход...
              </>
            ) : (
              'Войти'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Еще нет аккаунта?{' '}
              <Link className="font-medium text-blue-500 hover:text-blue-700 hover:underline transition-all" to="/signup">
                Создать аккаунт
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}