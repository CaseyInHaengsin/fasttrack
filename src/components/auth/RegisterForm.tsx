import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';
import { RegisterData } from '../../types/auth';

interface RegisterFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
  onSwitchToLogin: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function RegisterForm({ 
  onRegister, 
  onSwitchToLogin, 
  theme, 
  onThemeChange, 
  isLoading, 
  error 
}: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  const backgroundClasses = {
    blue: 'bg-gradient-to-br from-blue-50 via-white to-indigo-100',
    purple: 'bg-gradient-to-br from-purple-50 via-white to-violet-100',
    green: 'bg-gradient-to-br from-green-50 via-white to-emerald-100',
    orange: 'bg-gradient-to-br from-orange-50 via-white to-amber-100',
    pink: 'bg-gradient-to-br from-pink-50 via-white to-rose-100',
    teal: 'bg-gradient-to-br from-teal-50 via-white to-cyan-100',
    dark: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white',
    midnight: 'bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white'
  };

  const iconColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    teal: 'text-teal-600',
    dark: 'text-gray-300',
    midnight: 'text-slate-300'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegister(formData);
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = formData.password.length >= 6;

  return (
    <div className={`min-h-screen ${backgroundClasses[theme as keyof typeof backgroundClasses]} flex items-center justify-center p-4 relative`}>
      <Card className={`w-full max-w-md ${isDarkTheme ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95'} backdrop-blur-sm shadow-2xl`}>
        <CardContent>
          <div className="text-center mb-8">
            <Calendar className={`w-16 h-16 ${iconColors[theme as keyof typeof iconColors]} mx-auto mb-4`} />
            <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              Create Account
            </h1>
            <p className={`mt-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Join the FastTrack community
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
              className={isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}
            />

            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className={isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12' : 'pr-12'} ${
                  formData.password && !isPasswordValid ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12' : 'pr-12'} ${
                  formData.confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {formData.password && !isPasswordValid && (
              <p className="text-red-500 text-sm">Password must be at least 6 characters long</p>
            )}

            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-red-500 text-sm">Passwords do not match</p>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 text-lg"
              disabled={isLoading || !passwordsMatch || !isPasswordValid}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToLogin}
              className={`inline-flex items-center text-sm font-medium ${iconColors[theme as keyof typeof iconColors]} hover:underline`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-center relative z-[200]">
              <ThemeSelector currentTheme={theme} onThemeChange={onThemeChange} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}