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
    if (!isFormValid()) return;
    await onRegister(formData);
  };

  const isFormValid = () => {
    return (
      formData.username.trim().length >= 3 &&
      formData.email.trim().includes('@') &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = formData.password.length >= 6;
  const isUsernameValid = formData.username.trim().length >= 3;
  const isEmailValid = formData.email.trim().includes('@');

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
            <p className={`mt-1 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Access your data from anywhere
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
              placeholder="Choose a username (min 3 characters)"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
              disabled={isLoading}
              className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''} ${
                formData.username && !isUsernameValid ? 'border-red-500' : ''
              }`}
            />

            <Input
              type="email"
              label="Email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading}
              className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''} ${
                formData.email && !isEmailValid ? 'border-red-500' : ''
              }`}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12' : 'pr-12'} ${
                  formData.password && !isPasswordValid ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50`}
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
                disabled={isLoading}
                className={`${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12' : 'pr-12'} ${
                  formData.confirmPassword && !passwordsMatch ? 'border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50`}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Validation Messages */}
            <div className="space-y-1">
              {formData.username && !isUsernameValid && (
                <p className="text-red-500 text-sm">Username must be at least 3 characters long</p>
              )}
              {formData.email && !isEmailValid && (
                <p className="text-red-500 text-sm">Please enter a valid email address</p>
              )}
              {formData.password && !isPasswordValid && (
                <p className="text-red-500 text-sm">Password must be at least 6 characters long</p>
              )}
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-sm">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 text-lg"
              disabled={isLoading || !isFormValid()}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onSwitchToLogin}
              disabled={isLoading}
              className={`inline-flex items-center text-sm font-medium ${iconColors[theme as keyof typeof iconColors]} hover:underline disabled:opacity-50`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </button>
          </div>


          {/* Cross-device info */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkTheme ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <p className={`text-xs text-center ${isDarkTheme ? 'text-green-300' : 'text-green-700'}`}>
              🌐 Your account will be accessible from all your devices
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}