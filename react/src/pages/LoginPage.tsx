import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await loginUser(username, password);
      if (auth) {
        auth.login(token);
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-center">Sign in to AlgoHub</h2>
        <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md border border-blue-700">Login</Button>
        <p className="text-center text-sm">
          Don't have an account? <Link className="text-primary" to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
}