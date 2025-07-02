import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Trophy, Target, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface FastingStatsProps {
  fasts: Fast[];
  theme: string;
}

export function FastingStats({ fasts, theme }: FastingStatsProps) {
  if (fasts.length === 0) return null;

  const durations = fasts.map(f => f.duration);
  const longestFastDuration = Math.max(...durations);
  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  
  // Round to nearest hour
  const longestFastHours = Math.round(longestFastDuration);
  const averageHours = Math.round(averageDuration);
  
  const longestFast = fasts.find(f => f.duration === longestFastDuration);
  
  // Calculate recent trend (last 5 vs previous 5)
  const recentFasts = fasts.slice(-5);
  const previousFasts = fasts.slice(-10, -5);
  const recentAverage = recentFasts.length > 0 ? 
    recentFasts.reduce((a, b) => a + b.duration, 0) / recentFasts.length : 0;
  const previousAverage = previousFasts.length > 0 ? 
    previousFasts.reduce((a, b) => a + b.duration, 0) / previousFasts.length : 0;
  const trend = recentAverage - previousAverage;

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  const themeClasses = {
    blue: 'from-blue-50 to-indigo-100 border-blue-200',
    purple: 'from-purple-50 to-violet-100 border-purple-200',
    green: 'from-green-50 to-emerald-100 border-green-200',
    orange: 'from-orange-50 to-amber-100 border-orange-200',
    pink: 'from-pink-50 to-rose-100 border-pink-200',
    teal: 'from-teal-50 to-cyan-100 border-teal-200',
    dark: 'from-gray-800 to-gray-900 border-gray-700',
    midnight: 'from-slate-900 to-black border-slate-700'
  };

  const stats = [
    {
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      title: "Longest Fast",
      value: `${longestFastHours}h`,
      subtitle: longestFast ? format(longestFast.startTime, 'MMM dd, yyyy') : '',
      color: isDarkTheme ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-yellow-50 to-orange-100 border-yellow-200'
    },
    {
      icon: <Target className="w-8 h-8 text-blue-500" />,
      title: "Average Length",
      value: `${averageHours}h`,
      subtitle: `Based on ${fasts.length} fasts`,
      color: isDarkTheme ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-blue-50 to-indigo-100 border-blue-200'
    },
    {
      icon: <Calendar className="w-8 h-8 text-green-500" />,
      title: "Total Fasts",
      value: fasts.length.toString(),
      subtitle: "Completed successfully",
      color: isDarkTheme ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-green-50 to-emerald-100 border-green-200'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      title: "Recent Trend",
      value: trend >= 0 ? `+${Math.round(trend)}h` : `${Math.round(trend)}h`,
      subtitle: "vs previous 5 fasts",
      color: trend >= 0 
        ? (isDarkTheme ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-green-50 to-emerald-100 border-green-200')
        : (isDarkTheme ? 'from-gray-700 to-gray-800 border-gray-600' : 'from-red-50 to-pink-100 border-red-200')
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className={`text-2xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Fasting Statistics</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow duration-300`}>
            <CardContent className="text-center">
              <div className="flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <h3 className={`text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>{stat.title}</h3>
              <p className={`text-3xl font-bold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{stat.value}</p>
              <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}