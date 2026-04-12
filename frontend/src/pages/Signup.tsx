import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, User, CheckCircle, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  };

  const isPasswordStrong = Object.values(passwordStrength).filter(Boolean).length >= 4;

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!isPasswordStrong) {
      newErrors.password = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(e => !e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        navigate('/home');
      } else {
        const errorData = await response.json();
        setErrors(prev => ({
          ...prev,
          email: errorData.message || 'Error registering user',
        }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        email: 'Connection error. Please try again.',
      }));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col bg-white overflow-hidden overflow-x-hidden overflow-x-clip touch-none select-none relative">
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
        
        <div 
          className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-cover bg-center"
          style={{
            backgroundImage: 'url(/src/assets/images/Shinra.png)',
          }}
        >
          <div className="absolute inset-0 bg-[#b90000] mix-blend-multiply opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/80 to-transparent opacity-60"></div>

          <div className="relative z-10 space-y-12 flex flex-col justify-center h-full max-w-lg mx-auto w-full">
            <div className="space-y-6">
              <h2 className="text-5xl font-black text-white leading-tight tracking-tight">
                Master Japanese<br />through the lens of<br />
                <span className="italic font-black underline decoration-[6px] underline-offset-4 decoration-red-900/50">
                  your passion.
                </span>
              </h2>
              <p className="text-white/90 text-base leading-relaxed">
                Access premium curriculum designed for fans, by experts. Join our global community and level up your skills today.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-center bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.81 2 16.5S6.5 26.747 12 26.747s10-4.557 10-10.247S17.5 6.253 12 6.253z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Curated Library</h3>
                  <p className="text-white/70 text-xs">1,000+ anime-specific grammar guides</p>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a3 3 0 013-3h4a3 3 0 013 3v2H5v-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm mb-0.5">Active Community</h3>
                  <p className="text-white/70 text-xs">Discuss episodes and learn with peers</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <div className="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=11" alt="User" className="w-9 h-9 rounded-full border-2 border-red-800 object-cover" />
                <img src="https://i.pravatar.cc/100?img=5" alt="User" className="w-9 h-9 rounded-full border-2 border-red-800 object-cover" />
                <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-9 h-9 rounded-full border-2 border-red-800 object-cover" />
              </div>
              <p className="text-white font-medium text-sm">+24k learners already joined</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-[440px] space-y-8">
            
            <div className="w-full text-left">
              <h2 className="text-[32px] font-bold !text-slate-900 mb-2 tracking-tight">
                Create Account
              </h2>
              <p className="text-slate-500 text-sm">
                Join thousands of anime learners today
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
<div className="space-y-5 text-left">

  <div className="space-y-1.5">
    <label htmlFor="fullName" className="block text-xs font-bold text-slate-700">
      Full Name
    </label>
    <div className="relative">
      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        id="fullName"
        name="fullName"
        type="text"
        placeholder="Tanaka Kun"
        value={formData.fullName}
        onChange={handleChange}
        className={`pl-10 text-left h-11 bg-slate-50/50 border rounded-lg transition-all
        ${errors.fullName
          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200'
          : 'border-transparent hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-100'
        }`}
      />
    </div>
    {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
  </div>

  <div className="space-y-1.5">
    <label htmlFor="email" className="block text-xs font-bold text-slate-700">
      Email
    </label>
    <div className="relative">
      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        id="email"
        name="email"
        type="email"
        placeholder="tanaka@animelearn.com"
        value={formData.email}
        onChange={handleChange}
        className={`pl-10 text-left h-11 bg-slate-50/50 border rounded-lg transition-all
        ${errors.email
          ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200'
          : 'border-transparent hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-100'
        }`}
      />
    </div>
    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    <div className="space-y-1.5">
      <label htmlFor="password" className="block text-xs font-bold text-slate-700">
        Password
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          className={`pl-10 pr-10 text-left h-11 bg-slate-50/50 border rounded-lg transition-all
          ${errors.password
            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200'
            : 'border-transparent hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-100'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
    </div>

    <div className="space-y-1.5">
      <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700">
        Confirm Password
      </label>
      <div className="relative">
        <CheckCircle
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 
          ${
            formData.confirmPassword &&
            formData.password === formData.confirmPassword
              ? 'text-green-500'
              : 'text-slate-400'
          }`}
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`pl-10 pr-10 text-left h-11 bg-slate-50/50 border rounded-lg transition-all
          ${
            errors.confirmPassword
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-200'
              : 'border-transparent hover:border-slate-200 focus:bg-white focus:border-slate-300 focus:ring-1 focus:ring-slate-100'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {errors.confirmPassword && (
        <p className="text-xs text-red-600">{errors.confirmPassword}</p>
      )}
    </div>

  </div>
</div>
              <div className="flex gap-2 text-xs text-slate-500 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  defaultChecked
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4 mt-0.5"
                />
                <label htmlFor="terms" className="cursor-pointer">
                  I agree to the{' '}
                  <a href="#" className="text-red-600 hover:underline font-bold">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-red-600 hover:underline font-bold">
                    Privacy Policy
                  </a>.
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#cc0000] hover:bg-[#aa0000] text-white font-bold rounded-lg transition-all duration-200 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="relative pt-2">
              <div className="absolute inset-0 flex items-center pt-2">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center pt-2">
                <span className="px-3 bg-white text-[10px] uppercase tracking-wider text-slate-500 font-bold">OR SIGN UP WITH</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-600 text-sm shadow-sm"
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
                className="h-11 border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-slate-600 text-sm shadow-sm"
              >
                <svg className="w-4 h-4 mr-2 fill-blue-600" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>

            <p className="text-center text-slate-500 text-sm pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-[#cc0000] hover:underline font-bold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="w-full bg-[#f8fafc] border-t border-slate-200 py-6 px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <div className="font-bold text-slate-800 mb-4 md:mb-0">
          AnimeLearn
        </div>
        <div className="mb-4 md:mb-0">
          © 2024 AnimeLearn. Master the language of your passion.
        </div>
        <div className="flex gap-6 font-medium">
          <a href="#" className="hover:text-slate-800">Privacy</a>
          <a href="#" className="hover:text-slate-800">Terms</a>
          <a href="#" className="hover:text-slate-800">Support</a>
          <a href="#" className="hover:text-slate-800">Careers</a>
        </div>
      </footer>
    </div>
  );
}