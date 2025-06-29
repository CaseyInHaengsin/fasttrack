import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from './ui/Button';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes = [
  { id: 'blue', name: 'Ocean Blue', colors: 'from-blue-500 to-indigo-600' },
  { id: 'purple', name: 'Royal Purple', colors: 'from-purple-500 to-violet-600' },
  { id: 'green', name: 'Forest Green', colors: 'from-green-500 to-emerald-600' },
  { id: 'orange', name: 'Sunset Orange', colors: 'from-orange-500 to-amber-600' },
  { id: 'pink', name: 'Rose Pink', colors: 'from-pink-500 to-rose-600' },
  { id: 'teal', name: 'Teal Breeze', colors: 'from-teal-500 to-cyan-600' },
  { id: 'dark', name: 'Dark Mode', colors: 'from-gray-700 to-gray-900' },
  { id: 'midnight', name: 'Midnight', colors: 'from-slate-800 to-black' }
];

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'midnight';

  return (
    <>
      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[150]" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center ${
            isDarkTheme 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Palette className="w-4 h-4 mr-2" />
          Theme
        </Button>

        {isOpen && (
          <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl border z-[151] ${
            isDarkTheme 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-4">
              <h3 className={`text-sm font-semibold mb-3 ${
                isDarkTheme ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Choose Theme
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onThemeChange(theme.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      currentTheme === theme.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : isDarkTheme
                          ? 'border-gray-600 hover:border-gray-500'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded bg-gradient-to-r ${theme.colors} mb-2`} />
                    <p className={`text-xs font-medium ${
                      isDarkTheme ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {theme.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}