import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })

  const validateForm = () => {
    const newErrors = { email: '', password: '' }
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return !newErrors.email && !newErrors.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        navigate('/home')
      } else {
        const errorData = await response.json()
        setErrors({ email: errorData.error || 'Invalid email or password', password: '' })
      }
    } catch (error) {
      setErrors({ email: 'Connection error. Please try again.', password: '' })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
  <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 items-center bg-white overflow-hidden relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-xl 
                   bg-white/10 backdrop-blur-md border border-white/20 
                   text-white font-semibold text-sm
                   hover:bg-white/20 hover:border-white/30 
                   transition-all duration-300 shadow-lg group"
      >
        <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform duration-300" />
        Back
      </button>
      {/* Left Side - Hero Section */}
      <div 
        className="hidden lg:flex flex-col justify-between min-h-screen p-12 relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: 'url(/src/assets/images/Shinra.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="relative z-10 space-y-12 flex flex-col justify-between h-full">
          {/* Logo */}
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">AnimeLearn</h1>
            <p className="text-white/80 text-lg font-light">Unlock the World of Japanese</p>
          </div>

          {/* Main Heading */}
          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-tight">
              Unlock the World<br />of Nihongo.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-lg">
              Master the language of your passion through an immersive, editorialize learning experience designed for the modern otaku.
            </p>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">👤</div>
              <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">👤</div>
              <div className="w-10 h-10 rounded-full bg-purple-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">👤</div>
            </div>
            <p className="text-white font-semibold text-sm">JOIN 50,000+ LEARNERS</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center w-full p-6 lg:p-0">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo */}
          <div className="lg:hidden">
            <h1 className="text-3xl font-black text-slate-900">AnimeLearn</h1>
          </div>

       {/* Form Header */}
          <div className="w-full text-left">
            <h2 className="text-3xl font-bold !text-red-600 mb-1">Welcome Back</h2>
            <p className="text-slate-600">Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 w-full text-left">
            {/* Các trường input của bạn ở đây */}
 
           {/* Email Field */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-11 text-left h-11 bg-slate-100 border rounded-lg transition-all
                  ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-red-500'
                  }`}
                />
              </div>

              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors">
                  FORGOT PASSWORD?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-11 pr-11 h-11 bg-slate-100 border-slate-200 rounded-lg transition-all ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-red-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 mt-7"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign in →'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-slate-500 font-semibold">OR CONTINUE WITH</span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-sm"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-sm"
            >
              <svg className="w-4 h-4 mr-2 fill-current text-slate-900" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-slate-600 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-600 hover:text-red-700 font-bold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}