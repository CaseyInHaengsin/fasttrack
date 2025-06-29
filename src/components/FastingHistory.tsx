import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Calendar, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface FastingHistoryProps {
  fasts: Fast[];
  onDeleteFast: (id: string) => void;
  theme: string;
}

export function FastingHistory({ fasts, onDeleteFast, theme }: FastingHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (fasts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No fasting history yet</p>
          <p className="text-sm text-gray-400 mt-2">Start your first fast to see it here!</p>
        </CardContent>
      </Card>
    );
  }

  const sortedFasts = [...fasts].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  const displayedFasts = showAll ? sortedFasts : sortedFasts.slice(0, 10);

  const themeColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    teal: 'text-teal-600',
    dark: 'text-gray-300',
    midnight: 'text-slate-300'
  };

  const durationColor = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Fasting History</h3>
          <span className="text-sm text-gray-500">{fasts.length} total fasts</span>
        </div>
        
        <div className="space-y-3">
          {displayedFasts.map((fast) => (
            <div
              key={fast.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {format(fast.startTime, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(fast.startTime, 'h:mm a')} - {format(fast.endTime, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mx-4">
                <p className={`text-lg font-bold ${durationColor}`}>
                  {Math.round(fast.duration)}h
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(fast.startTime, { addSuffix: true })}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteFast(fast.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {fasts.length > 10 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${fasts.length} Fasts`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}