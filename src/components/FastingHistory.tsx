import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Calendar, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
}

interface FastingHistoryProps {
  fasts: Fast[];
  onDeleteFast: (id: string) => void;
  theme: string;
}

export function FastingHistory({ fasts, onDeleteFast, theme }: FastingHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
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

  const isDarkTheme = theme === 'dark' || theme === 'midnight';
  const durationColor = themeColors[theme as keyof typeof themeColors] || themeColors.blue;

  const toggleNoteExpansion = (fastId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(fastId)) {
      newExpanded.delete(fastId);
    } else {
      newExpanded.add(fastId);
    }
    setExpandedNotes(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Fasting History
          </h3>
          <span className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
            {fasts.length} total fasts
          </span>
        </div>
        
        <div className="space-y-3">
          {displayedFasts.map((fast) => {
            const isExpanded = expandedNotes.has(fast.id);
            const hasNotes = fast.notes && fast.notes.trim().length > 0;
            const shouldShowExpand = hasNotes && fast.notes!.length > 100;
            
            return (
              <div
                key={fast.id}
                className={`p-4 rounded-lg transition-colors duration-200 ${
                  isDarkTheme 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Calendar className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-medium ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                          {format(fast.startTime, 'MMM dd, yyyy')}
                        </p>
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                          {format(fast.startTime, 'h:mm a')} - {format(fast.endTime, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mx-4">
                    <p className={`text-lg font-bold ${durationColor}`}>
                      {Math.round(fast.duration)}h
                    </p>
                    <p className={`text-xs ${isDarkTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatDistanceToNow(fast.startTime, { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {hasNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNoteExpansion(fast.id)}
                        className={`${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFast(fast.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Notes section */}
                {hasNotes && (
                  <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-start space-x-2">
                      <FileText className={`w-4 h-4 mt-1 flex-shrink-0 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                      <div className="flex-1">
                        <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                          {isExpanded || !shouldShowExpand ? fast.notes : truncateText(fast.notes!, 100)}
                        </p>
                        
                        {shouldShowExpand && (
                          <button
                            onClick={() => toggleNoteExpansion(fast.id)}
                            className={`mt-2 text-xs font-medium flex items-center space-x-1 ${
                              isDarkTheme ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                <span>Show less</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                <span>Show more</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {fasts.length > 10 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}
            >
              {showAll ? 'Show Less' : `Show All ${fasts.length} Fasts`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}