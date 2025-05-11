// filepath: src/pages/SignUpPage.tsx

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUpUser } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SignUpPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const auth = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { token } = await signUpUser(username, password)
      auth?.login(token)
      navigate('/')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="flex justify-center items-center h-[80vh]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg space-y-4">
        <h2 className="text-2xl font-semibold text-center">Sign up for AlgoHub</h2>
        <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" className="w-full">Sign Up</Button>
        <p className="text-center text-sm">
          Already have an account? <Link className="text-primary" to="/login">Login</Link>
        </p>
      </form>
    </div>
  )
}
