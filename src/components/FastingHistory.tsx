import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Trash2, Calendar, Clock, FileText, ChevronDown, ChevronUp, Edit3, Save, X, BarChart3, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  onUpdateFast: (id: string, updates: Partial<Fast>) => void;
  theme: string;
}

export function FastingHistory({ fasts, onDeleteFast, onUpdateFast, theme }: FastingHistoryProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [editingNotes, setEditingNotes] = useState<Set<string>>(new Set());
  const [editedNotesText, setEditedNotesText] = useState<Record<string, string>>({});
  
  // Chart state
  const [chartFilter, setChartFilter] = useState<'10' | '20'>('10');
  const [chartOffset, setChartOffset] = useState(0);
  
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

  // Separate fasts by duration
  const shortFasts = sortedFasts.filter(fast => fast.duration < 48); // Less than 2 days
  const longFasts = sortedFasts.filter(fast => fast.duration >= 48); // 2 days or more

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

  // Prepare chart data
  const prepareChartData = (fastsData: Fast[], filterCount: number, offset: number) => {
    const startIndex = offset;
    const endIndex = offset + filterCount;
    const slicedFasts = fastsData.slice(startIndex, endIndex);
    
    return slicedFasts.reverse().map((fast, index) => ({
      name: format(fast.startTime, 'MMM dd'),
      duration: fast.duration,
      fullDate: format(fast.startTime, 'EEEE, MMMM do, yyyy'),
      startTime: format(fast.startTime, 'h:mm a'),
      endTime: format(fast.endTime, 'h:mm a'),
      exactDuration: fast.duration.toFixed(1)
    }));
  };

  const shortChartData = prepareChartData(shortFasts, parseInt(chartFilter), chartOffset);
  const longChartData = prepareChartData(longFasts, parseInt(chartFilter), chartOffset);

  const canScrollBack = chartOffset > 0;
  const canScrollForwardShort = chartOffset + parseInt(chartFilter) < shortFasts.length;
  const canScrollForwardLong = chartOffset + parseInt(chartFilter) < longFasts.length;

  const handleScrollChart = (direction: 'back' | 'forward') => {
    const filterNum = parseInt(chartFilter);
    if (direction === 'back' && canScrollBack) {
      setChartOffset(Math.max(0, chartOffset - filterNum));
    } else if (direction === 'forward') {
      setChartOffset(chartOffset + filterNum);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 border rounded-lg shadow-lg max-w-xs ${
          isDarkTheme ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
        }`}>
          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{data.fullDate}</p>
          <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            {data.startTime} → {data.endTime}
          </p>
          <p className={`font-bold mt-2 ${durationColor}`}>
            Duration: {data.exactDuration} hours
          </p>
        </div>
      );
    }
    return null;
  };

  const toggleNoteExpansion = (fastId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(fastId)) {
      newExpanded.delete(fastId);
    } else {
      newExpanded.add(fastId);
    }
    setExpandedNotes(newExpanded);
  };

  const startEditingNotes = (fastId: string, currentNotes: string) => {
    const newEditing = new Set(editingNotes);
    newEditing.add(fastId);
    setEditingNotes(newEditing);
    setEditedNotesText(prev => ({ ...prev, [fastId]: currentNotes || '' }));
  };

  const cancelEditingNotes = (fastId: string) => {
    const newEditing = new Set(editingNotes);
    newEditing.delete(fastId);
    setEditingNotes(newEditing);
    setEditedNotesText(prev => {
      const { [fastId]: _, ...rest } = prev;
      return rest;
    });
  };

  const saveEditedNotes = async (fastId: string) => {
    const newNotes = editedNotesText[fastId] || '';
    try {
      await onUpdateFast(fastId, { notes: newNotes });
      
      const newEditing = new Set(editingNotes);
      newEditing.delete(fastId);
      setEditingNotes(newEditing);
      setEditedNotesText(prev => {
        const { [fastId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes. Please try again.');
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-8">
      {/* Charts Section */}
      <Card className={isDarkTheme ? 'bg-gray-800 border-gray-700' : ''}>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BarChart3 className={`w-6 h-6 mr-3 ${durationColor}`} />
              <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Fasting Duration Charts
              </h3>
            </div>
            
            {/* Chart Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                <select
                  value={chartFilter}
                  onChange={(e) => {
                    setChartFilter(e.target.value as '10' | '20');
                    setChartOffset(0); // Reset offset when changing filter
                  }}
                  className={`px-3 py-1 rounded border text-sm ${
                    isDarkTheme 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                >
                  <option value="10">Last 10</option>
                  <option value="20">Last 20</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScrollChart('back')}
                  disabled={!canScrollBack}
                  className={`p-2 ${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScrollChart('forward')}
                  disabled={!canScrollForwardShort && !canScrollForwardLong}
                  className={`p-2 ${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Short Fasts Chart (< 2 days) */}
          {shortFasts.length > 0 && (
            <div className={`mb-8 p-6 rounded-lg ${isDarkTheme ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-md font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Short Fasts (&lt; 2 days) - Showing {Math.min(parseInt(chartFilter), shortFasts.length - chartOffset)} of {shortFasts.length}
              </h4>
              {shortChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={shortChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="name"
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        label={{ 
                          value: 'Hours', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  No short fasts in this range
                </p>
              )}
            </div>
          )}

          {/* Long Fasts Chart (≥ 2 days) */}
          {longFasts.length > 0 && (
            <div className={`p-6 rounded-lg ${isDarkTheme ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <h4 className={`text-md font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Long Fasts (≥ 2 days) - Showing {Math.min(parseInt(chartFilter), longFasts.length - chartOffset)} of {longFasts.length}
              </h4>
              {longChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={longChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="name"
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        label={{ 
                          value: 'Hours', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle' }
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="duration" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  No long fasts in this range
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History List */}
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
              const isEditing = editingNotes.has(fast.id);
              const hasNotes = fast.notes && fast.notes.trim().length > 0;
              const shouldShowExpand = hasNotes && fast.notes!.length > 100 && !isEditing;
              const currentNotes = isEditing ? editedNotesText[fast.id] || '' : fast.notes || '';
              
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
                      {(hasNotes || isEditing) && (
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
                  
                  {/* Notes section - Always allow editing */}
                  {(hasNotes || isEditing || isExpanded) && (
                    <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-start space-x-2">
                        <FileText className={`w-4 h-4 mt-1 flex-shrink-0 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                value={currentNotes}
                                onChange={(e) => setEditedNotesText(prev => ({ ...prev, [fast.id]: e.target.value }))}
                                placeholder="Add notes about this fast..."
                                className={`w-full h-24 p-3 border rounded-lg resize-none ${
                                  isDarkTheme 
                                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEditedNotes(fast.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelEditingNotes(fast.id)}
                                  className={isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {hasNotes ? (
                                <div>
                                  <div className="flex items-start justify-between">
                                    <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'} leading-relaxed flex-1 mr-2`}>
                                      {isExpanded || !shouldShowExpand ? fast.notes : truncateText(fast.notes!, 100)}
                                    </p>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditingNotes(fast.id, fast.notes || '')}
                                      className={`${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} flex-shrink-0`}
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
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
                              ) : (
                                <div className="flex items-center justify-between">
                                  <p className={`text-sm italic ${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>
                                    No notes for this fast
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingNotes(fast.id, '')}
                                    className={`${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                                  >
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    Add notes
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Add notes button for fasts without notes and not expanded */}
                  {!hasNotes && !isEditing && !isExpanded && (
                    <div className={`mt-4 pt-4 border-t ${isDarkTheme ? 'border-gray-600' : 'border-gray-200'}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditingNotes(fast.id, '')}
                        className={`${isDarkTheme ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Add notes
                      </Button>
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
    </div>
  );
}