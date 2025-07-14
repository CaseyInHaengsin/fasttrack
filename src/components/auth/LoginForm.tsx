import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, Eye, EyeOff, LogIn, UserPlus, RefreshCw } from 'lucide-react';
import { ThemeSelector } from '../ThemeSelector';
import { LoginCredentials } from '../../types/auth';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onSwitchToRegister: () => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function LoginForm({ 
  onLogin, 
  onSwitchToRegister, 
  theme, 
  onThemeChange, 
  isLoading, 
  error 
}: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
    if (!credentials.username.trim() || !credentials.password) {
      return;
    }
    
    setIsRetrying(false);
    await onLogin(credentials);
  };

  const handleRetry = async () => {
    if (!credentials.username.trim() || !credentials.password) {
      return;
    }
    
    setIsRetrying(true);
    await onLogin(credentials);
    setIsRetrying(false);
  };

  const isFormValid = credentials.username.trim() && credentials.password;

  return (
    <div className={`min-h-screen ${backgroundClasses[theme as keyof typeof backgroundClasses]} flex items-center justify-center p-4 relative`}>
      <Card className={`w-full max-w-md ${isDarkTheme ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95'} backdrop-blur-sm shadow-2xl`}>
        <CardContent>
          <div className="text-center mb-8">
            <Calendar className={`w-16 h-16 ${iconColors[theme as keyof typeof iconColors]} mx-auto mb-4`} />
            <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              FastTrack
            </h1>
            <p className={`mt-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Your personal fasting companion
            </p>
            <p className={`mt-1 text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Works across all your devices
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm mb-3">{error}</p>
              {error.includes('failed') && isFormValid && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isRetrying}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry Login'}
                </Button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              label="Username or Email"
              placeholder="Enter your username or email"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required
              disabled={isLoading}
              className={isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}
            />

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                className={isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-12' : 'pr-12'}
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

            <Button 
              type="submit" 
              className="w-full py-3 text-lg"
              disabled={isLoading || !isFormValid}
            >
              <LogIn className="w-5 h-5 mr-2" />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                disabled={isLoading}
                className={`font-medium ${iconColors[theme as keyof typeof iconColors]} hover:underline disabled:opacity-50`}
              >
                Create one
              </button>
            </p>
          </div>


          {/* Demo credentials info */}
          <div className={`mt-6 p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              Demo Credentials:
            </p>
            <div className={`text-xs space-y-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              <p><strong>Admin:</strong> admin / admin123</p>
              <p><strong>Or create a new account</strong></p>
            </div>
          </div>

          {/* Cross-device info */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkTheme ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <p className={`text-xs text-center ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
              🌐 Your account works on all devices and browsers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}