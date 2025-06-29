import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, History, User, Database, Activity, Settings, Shield } from 'lucide-react';
import { CalendarFastEntry } from './components/CalendarFastEntry';
import { FastingChart } from './components/FastingChart';
import { FastingStats } from './components/FastingStats';
import { FastingHistory } from './components/FastingHistory';
import { DataManager } from './components/DataManager';
import { HealthTracker } from './components/HealthTracker';
import { ThemeSelector } from './components/ThemeSelector';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AdminPanel } from './components/admin/AdminPanel';
import { Button } from './components/ui/Button';
import { authService } from './services/authService';
import { apiService } from './services/apiService';
import { User as UserType, LoginCredentials, RegisterData } from './types/auth';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [fasts, setFasts] = useState<Fast[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [theme, setTheme] = useState<string>(localStorage.getItem('fastingTheme') || 'blue');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await loadFastsFromAPI(currentUser.id);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Failed to verify authentication. Please try logging in again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('fastingTheme', theme);
  }, [theme]);

  const loadFastsFromAPI = async (userId: string) => {
    try {
      setError(null);
      const fastsFromAPI = await apiService.getFasts(userId);
      setFasts(fastsFromAPI);
    } catch (error) {
      console.error('Failed to load fasts from API:', error);
      setError('Failed to load data from server. Please try refreshing the page.');
    }
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
      await loadFastsFromAPI(loggedInUser.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newUser = await authService.register(data);
      setUser(newUser);
      await loadFastsFromAPI(newUser.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setFasts([]);
      setError(null);
      setActiveTab('calendar');
    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even if API call fails
      setUser(null);
      setFasts([]);
      setError(null);
      setActiveTab('calendar');
    }
  };

  const handleUserUpdate = (updatedUser: UserType) => {
    setUser(updatedUser);
  };

  const handleAddFast = async (startTime: Date, endTime: Date, notes?: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      const newFast = await apiService.saveFast(user.id, {
        startTime,
        endTime,
        duration,
        notes
      });
      
      setFasts(prevFasts => [...prevFasts, newFast]);
    } catch (error) {
      console.error('Failed to save fast:', error);
      setError('Failed to save fast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFast = async (id: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      await apiService.deleteFast(user.id, id);
      setFasts(prevFasts => prevFasts.filter(fast => fast.id !== id));
    } catch (error) {
      console.error('Failed to delete fast:', error);
      setError('Failed to delete fast. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFasts = (importedFasts: Fast[]) => {
    setFasts(importedFasts);
  };

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

  const headerClasses = {
    blue: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-blue-200',
    purple: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-purple-200',
    green: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-green-200',
    orange: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-orange-200',
    pink: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-pink-200',
    teal: 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-teal-200',
    dark: 'bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-700',
    midnight: 'bg-slate-800/95 backdrop-blur-sm shadow-sm border-b border-slate-700'
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

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  // Show loading screen during initial auth check
  if (isLoading && user === null && !error) {
    return (
      <div className={`min-h-screen ${backgroundClasses[theme as keyof typeof backgroundClasses]} flex items-center justify-center`}>
        <div className="text-center">
          <Calendar className={`w-16 h-16 ${iconColors[theme as keyof typeof iconColors]} mx-auto mb-4 animate-pulse`} />
          <h1 className={`text-3xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'} mb-2`}>
            FastTrack
          </h1>
          <p className={`${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading your fasting journey...
          </p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not logged in
  if (!user) {
    if (authMode === 'register') {
      return (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={() => setAuthMode('login')}
          theme={theme}
          onThemeChange={setTheme}
          isLoading={isLoading}
          error={error}
        />
      );
    }

    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthMode('register')}
        theme={theme}
        onThemeChange={setTheme}
        isLoading={isLoading}
        error={error}
      />
    );
  }

  const tabs = [
    { id: 'calendar', label: 'Add Fast', icon: <Calendar className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'health', label: 'Health', icon: <Activity className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile', icon: <Settings className="w-4 h-4" /> },
    ...(user.isAdmin ? [{ id: 'admin', label: 'Admin', icon: <Shield className="w-4 h-4" /> }] : [])
  ];

  return (
    <div className={`min-h-screen ${backgroundClasses[theme as keyof typeof backgroundClasses]}`}>
      {/* Header */}
      <header className={headerClasses[theme as keyof typeof headerClasses]}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Calendar className={`w-8 h-8 ${iconColors[theme as keyof typeof iconColors]} mr-3`} />
              <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>FastTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
              <div className={`flex items-center space-x-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {user.avatar && (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span>{user.username}</span>
                  {user.isAdmin && (
                    <Shield className="w-4 h-4 ml-2 text-purple-500" />
                  )}
                </div>
              </div>
              {isLoading && (
                <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  Syncing...
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setError(null)}
                className="text-yellow-400 hover:text-yellow-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={headerClasses[theme as keyof typeof headerClasses]}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? `border-${isDarkTheme ? 'gray-300' : theme + '-500'} text-${isDarkTheme ? 'gray-300' : theme + '-600'}`
                    : `border-transparent ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} hover:border-gray-300`
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' && (
          <div className="space-y-8">
            <CalendarFastEntry onAddFast={handleAddFast} theme={theme} />
            {fasts.length > 0 && <FastingStats fasts={fasts} theme={theme} />}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <FastingStats fasts={fasts} theme={theme} />
            <FastingChart fasts={fasts} theme={theme} />
          </div>
        )}

        {activeTab === 'history' && (
          <FastingHistory fasts={fasts} onDeleteFast={handleDeleteFast} theme={theme} />
        )}

        {activeTab === 'health' && (
          <HealthTracker fasts={fasts} theme={theme} user={user.id} />
        )}

        {activeTab === 'data' && (
          <DataManager 
            fasts={fasts} 
            onImportFasts={handleImportFasts} 
            theme={theme} 
            user={user.id}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            user={user}
            theme={theme}
            onUserUpdate={handleUserUpdate}
          />
        )}

        {activeTab === 'admin' && user.isAdmin && (
          <AdminPanel
            theme={theme}
            currentUser={user}
          />
        )}
      </main>
    </div>
  );
}

export default App;