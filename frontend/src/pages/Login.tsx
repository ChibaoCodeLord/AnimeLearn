import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { ApiError } from '@/api/client';

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = await authApi.login<{ token?: string }>({ email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      try {
        await authApi.getMe();
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.status === 403) {
          const banData = profileError.data as { error?: string } | undefined;
          if (banData?.error === 'User is banned') {
            try {
              sessionStorage.setItem('banInfo', JSON.stringify(banData));
            } catch (e) {
              console.error('Cannot persist ban info', e);
            }
            navigate('/banned');
            return;
          }
        }
        throw profileError;
      }

      await queryClient.invalidateQueries({ queryKey: ['current-user'] });
      navigate('/home');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ email: error.message || 'Invalid email or password', password: '' });
      } else {
        setErrors({ email: 'Connection error. Please try again.', password: '' });
      }
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 items-center bg-white overflow-hidden relative">
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
      <div 
        className="hidden lg:flex flex-col justify-between min-h-screen p-12 relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: 'url(/src/assets/images/Shinra.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <div className="relative z-10 space-y-12 flex flex-col justify-between h-full">
          <div className="pt-16">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">AnimeLearn</h1>
            <p className="text-white/80 text-lg font-light">Unlock the World of Japanese</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-white leading-tight">
              Unlock the World<br />of Nihongo.
            </h2>
            <p className="text-white/80 text-lg leading-relaxed max-w-lg">
              Master the language of your passion through an immersive, editorialize learning experience designed for the modern otaku.
            </p>
          </div>

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

      <div className="flex items-center justify-center w-full p-6 lg:p-0">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden">
            <h1 className="text-3xl font-black text-slate-900">AnimeLearn</h1>
          </div>

          <div className="w-full text-left">
            <h2 className="text-3xl font-bold !text-red-600 mb-1">Welcome Back</h2>
            <p className="text-slate-600">Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 w-full text-left">
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
            <div className="space-y-2">
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

          <p className="text-center text-slate-600 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-red-600 hover:text-red-700 font-bold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
