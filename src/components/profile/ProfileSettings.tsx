import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Settings, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { AvatarUpload } from '../auth/AvatarUpload';
import { ThemeSelector } from '../ThemeSelector';
import { authService } from '../../services/authService';
import { User as UserType } from '../../types/auth';

interface ProfileSettingsProps {
  user: UserType;
  theme: string;
  onThemeChange: (theme: string) => void;
  onUserUpdate: (user: UserType) => void;
}

export function ProfileSettings({ user, theme, onThemeChange, onUserUpdate }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

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

  const handleAvatarChange = async (avatarDataUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await authService.updateAvatar(avatarDataUrl);
      onUserUpdate(updatedUser);
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await authService.updateProfile({ avatar: undefined });
      onUserUpdate(updatedUser);
      setSuccess('Avatar removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile({
        username: formData.username,
        email: formData.email
      });
      
      onUserUpdate(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await authService.changePassword(formData.currentPassword, formData.newPassword);
      
      setIsChangingPassword(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <Settings className={`w-6 h-6 ${iconColors[theme as keyof typeof iconColors]} mr-3`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Profile Settings
          </h2>
          {user.isAdmin && (
            <div className="ml-auto flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className={`text-sm font-medium ${isDarkTheme ? 'text-purple-300' : 'text-purple-600'}`}>
                Administrator
              </span>
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

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Theme Selection */}
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              Theme Preferences
            </h3>
            <div className="flex justify-center">
              <ThemeSelector currentTheme={theme} onThemeChange={onThemeChange} />
            </div>
          </div>

          {/* Avatar Section */}
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              Profile Picture
            </h3>
            <AvatarUpload
              currentAvatar={user.avatar}
              onAvatarChange={handleAvatarChange}
              onRemoveAvatar={handleRemoveAvatar}
              theme={theme}
            />
          </div>

          {/* Profile Information */}
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Profile Information
              </h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <Input
                  type="text"
                  label="Username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
                
                <Input
                  type="email"
                  label="Email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(prev => ({
                        ...prev,
                        username: user.username,
                        email: user.email
                      }));
                    }}
                    className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username
                  </label>
                  <p className={`${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{user.username}</p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <p className={`${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{user.email}</p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Member Since
                  </label>
                  <p className={`${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                    {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Password
              </h3>
              {!isChangingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(true)}
                  className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}
                >
                  Change Password
                </Button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPasswords.current ? 'text' : 'password'}
                    label="Current Password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className={`${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 pr-12' : 'pr-12'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showPasswords.new ? 'text' : 'password'}
                    label="New Password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className={`${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 pr-12' : 'pr-12'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className={`${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400 pr-12' : 'pr-12'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className={`absolute right-3 top-8 ${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setFormData(prev => ({
                        ...prev,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      }));
                    }}
                    className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                ••••••••••••
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}