import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Shield, Users, Trash2, UserCheck, UserX, Search, Calendar, Activity } from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types/auth';
import { format } from 'date-fns';

interface AdminPanelProps {
  theme: string;
  currentUser: User;
}

export function AdminPanel({ theme, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  const themeClasses = {
    blue: 'from-blue-50 to-indigo-100 border-blue-200',
    purple: 'from-purple-50 to-violet-100 border-purple-200',
    green: 'from-green-50 to-emerald-100 border-green-200',
    orange: 'from-orange-50 to-amber-100 border-orange-200',
    pink: 'from-pink-50 to-rose-100 border-pink-200',
    teal: 'from-teal-50 to-cyan-100 border-teal-200',
    dark: 'from-gray-800 to-gray-900 border-gray-700 text-white',
    midnight: 'from-slate-900 to-black border-slate-700 text-white'
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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allUsers = authService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      setError('Cannot delete your own account');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await authService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (userId === currentUser.id) {
      setError('Cannot modify your own admin status');
      return;
    }

    try {
      setIsLoading(true);
      await authService.toggleUserAdmin(userId);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    adminUsers: users.filter(u => u.isAdmin).length,
    recentUsers: users.filter(u => {
      const daysSinceCreation = (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 7;
    }).length,
    activeUsers: users.filter(u => {
      if (!u.lastLogin) return false;
      const daysSinceLogin = (Date.now() - u.lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 30;
    }).length
  };

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <Shield className={`w-6 h-6 ${iconColors[theme as keyof typeof iconColors]} mr-3`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Admin Panel
          </h2>
          {isLoading && (
            <div className={`ml-auto text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading...
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-4 text-center`}>
            <Users className={`w-8 h-8 ${iconColors[theme as keyof typeof iconColors]} mx-auto mb-2`} />
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              {stats.totalUsers}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
          </div>

          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-4 text-center`}>
            <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              {stats.adminUsers}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Admins</p>
          </div>

          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-4 text-center`}>
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              {stats.recentUsers}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>New (7d)</p>
          </div>

          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-4 text-center`}>
            <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              {stats.activeUsers}
            </div>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Active (30d)</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <Input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${isDarkTheme ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : ''}`}
            />
          </div>
        </div>

        {/* Users List */}
        <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            User Management ({filteredUsers.length})
          </h3>

          {filteredUsers.length === 0 ? (
            <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm ? 'No users found matching your search' : 'No users found'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    isDarkTheme ? 'bg-gray-600/50' : 'bg-gray-50'
                  } ${user.id === currentUser.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                          {user.username}
                          {user.id === currentUser.id && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              You
                            </span>
                          )}
                        </p>
                        {user.isAdmin && (
                          <Shield className="w-4 h-4 text-purple-500" />
                        )}
                      </div>
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        {user.email}
                      </p>
                      <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                        Joined: {format(user.createdAt, 'MMM dd, yyyy')}
                        {user.lastLogin && (
                          <span className="ml-2">
                            • Last login: {format(user.lastLogin, 'MMM dd, yyyy')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {user.id !== currentUser.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id)}
                          disabled={isLoading}
                          className={`${
                            user.isAdmin
                              ? 'text-purple-600 border-purple-300 hover:bg-purple-50'
                              : 'text-green-600 border-green-300 hover:bg-green-50'
                          }`}
                        >
                          {user.isAdmin ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Make Admin
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isLoading}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}