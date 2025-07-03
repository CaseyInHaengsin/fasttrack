import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Pill, Plus, Trash2, Calendar, Clock, BarChart3, TrendingUp, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isSameDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { apiService } from '../services/apiService';
import 'react-day-picker/dist/style.css';

interface SupplementEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  time: Date;
  notes?: string;
}

interface SupplementTrackerProps {
  theme: string;
  user: string;
}

export function SupplementTracker({ theme, user }: SupplementTrackerProps) {
  const [supplements, setSupplements] = useState<SupplementEntry[]>([]);
  const [selectedSupplement, setSelectedSupplement] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'history' | 'calendar'>('add');
  
  // Chart state
  const [chartFilter, setChartFilter] = useState<'10' | '20'>('10');
  const [chartOffset, setChartOffset] = useState(0);
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'mg',
    time: format(new Date(), 'HH:mm'),
    notes: ''
  });

  // Suggestions for supplement names
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    if (user) {
      loadSupplements();
    }
  }, [user]);

  const loadSupplements = async () => {
    try {
      setIsLoading(true);
      const supplementsFromAPI = await apiService.getSupplements(user);
      setSupplements(supplementsFromAPI);
    } catch (error) {
      console.error('Failed to load supplements:', error);
      setError('Failed to load supplements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique supplement names for suggestions and selection
  const uniqueSupplements = Array.from(new Set(supplements.map(s => s.name))).sort();

  // Filter suggestions based on current input
  const filteredSuggestions = uniqueSupplements.filter(name =>
    name.toLowerCase().includes(formData.name.toLowerCase()) && 
    name.toLowerCase() !== formData.name.toLowerCase()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.quantity) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const [hours, minutes] = formData.time.split(':').map(Number);
      const entryTime = new Date();
      entryTime.setHours(hours, minutes, 0, 0);
      
      const newSupplement = await apiService.saveSupplement(user, {
        name: formData.name.trim(),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        time: entryTime,
        notes: formData.notes.trim()
      });
      
      setSupplements(prev => [newSupplement, ...prev]);
      
      // Reset form but keep the supplement name for easy re-entry
      setFormData(prev => ({
        name: prev.name, // Keep the supplement name
        quantity: '',
        unit: prev.unit, // Keep the unit
        time: format(new Date(), 'HH:mm'),
        notes: ''
      }));
      setShowSuggestions(false);
    } catch (error) {
      console.error('Failed to save supplement:', error);
      setError('Failed to save supplement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await apiService.deleteSupplement(user, id);
      setSupplements(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete supplement:', error);
      setError('Failed to delete supplement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
  };

  const selectSuggestion = (name: string) => {
    // Find the most recent entry for this supplement to get common unit
    const recentEntry = supplements.find(s => s.name === name);
    setFormData(prev => ({ 
      ...prev, 
      name,
      unit: recentEntry?.unit || prev.unit
    }));
    setShowSuggestions(false);
  };

  // Prepare chart data for selected supplement with pagination
  const getChartData = () => {
    if (!selectedSupplement) return [];
    
    const filteredSupplements = supplements
      .filter(s => s.name === selectedSupplement)
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    const filterNum = parseInt(chartFilter);
    const startIndex = chartOffset;
    const endIndex = chartOffset + filterNum;
    const paginatedSupplements = filteredSupplements.slice(startIndex, endIndex);
    
    return paginatedSupplements.map(supplement => ({
      date: format(supplement.time, 'MMM dd'),
      time: format(supplement.time, 'HH:mm'),
      quantity: supplement.quantity,
      fullDate: format(supplement.time, 'EEEE, MMMM do, yyyy'),
      unit: supplement.unit
    }));
  };

  const chartData = getChartData();
  
  // Chart navigation
  const selectedSupplementEntries = supplements.filter(s => s.name === selectedSupplement);
  const canScrollBack = chartOffset > 0;
  const canScrollForward = chartOffset + parseInt(chartFilter) < selectedSupplementEntries.length;

  const handleScrollChart = (direction: 'back' | 'forward') => {
    const filterNum = parseInt(chartFilter);
    if (direction === 'back' && canScrollBack) {
      setChartOffset(Math.max(0, chartOffset - filterNum));
    } else if (direction === 'forward' && canScrollForward) {
      setChartOffset(chartOffset + filterNum);
    }
  };

  // Get supplements for selected calendar date
  const getSupplementsForDate = (date: Date) => {
    return supplements.filter(supplement => 
      isSameDay(supplement.time, date)
    ).sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const supplementsForSelectedDate = getSupplementsForDate(selectedDate);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 border rounded-lg shadow-lg max-w-xs ${
          isDarkTheme ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
        }`}>
          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{data.fullDate}</p>
          <p className={`text-sm mt-1 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
            Time: {data.time}
          </p>
          <p className={`font-bold mt-2 ${iconColors[theme as keyof typeof iconColors]}`}>
            {data.quantity} {data.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const tabs = [
    { id: 'add', label: 'Add', icon: <Plus className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> }
  ];

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <Pill className={`w-6 h-6 ${iconColors[theme as keyof typeof iconColors]} mr-3`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
            Supplement Tracker
          </h2>
          {isLoading && (
            <div className={`ml-auto text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Syncing...
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

        {/* Tab Navigation */}
        <div className={`flex space-x-1 mb-6 ${isDarkTheme ? 'bg-gray-700/50' : 'bg-white/20'} rounded-lg p-1`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? `${isDarkTheme ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'} shadow-sm`
                  : `${isDarkTheme ? 'text-gray-300 hover:text-white hover:bg-gray-600/50' : 'text-gray-600 hover:text-gray-800 hover:bg-white/30'}`
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Add Supplement Tab */}
        {activeTab === 'add' && (
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              Add Supplement
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="text"
                    label="Supplement Name"
                    placeholder="e.g., Vitamin D, Magnesium"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => setShowSuggestions(formData.name.length > 0 && filteredSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    required
                    className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                  />
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-40 overflow-y-auto ${
                      isDarkTheme ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                    }`}>
                      {filteredSuggestions.map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectSuggestion(name)}
                          className={`w-full text-left px-4 py-2 hover:bg-opacity-50 ${
                            isDarkTheme 
                              ? 'text-white hover:bg-gray-600' 
                              : 'text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    label="Quantity"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                    step="0.1"
                    min="0"
                    className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                  />
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDarkTheme 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    >
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                      <option value="mcg">mcg</option>
                      <option value="IU">IU</option>
                      <option value="ml">ml</option>
                      <option value="tablets">tablets</option>
                      <option value="capsules">capsules</option>
                      <option value="drops">drops</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Time Taken"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white' : ''}
                />
                
                <Input
                  type="text"
                  label="Notes (Optional)"
                  placeholder="With food, before workout, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? 'Adding...' : 'Add Supplement'}
              </Button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Chart Section */}
            {uniqueSupplements.length > 0 && (
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                    Supplement History
                  </h3>
                  
                  <div className="flex items-center space-x-4">
                    {/* Supplement Selection */}
                    <div className="flex items-center space-x-2">
                      <BarChart3 className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                      <select
                        value={selectedSupplement}
                        onChange={(e) => {
                          setSelectedSupplement(e.target.value);
                          setChartOffset(0); // Reset offset when changing supplement
                        }}
                        className={`px-3 py-1 rounded border text-sm ${
                          isDarkTheme 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      >
                        <option value="">Select supplement</option>
                        {uniqueSupplements.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter and Navigation */}
                    {selectedSupplement && (
                      <>
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
                                ? 'bg-gray-600 border-gray-500 text-white' 
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
                            disabled={!canScrollForward}
                            className={`p-2 ${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedSupplement && chartData.length > 0 && (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                          <XAxis 
                            dataKey="date"
                            stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                            fontSize={12}
                          />
                          <YAxis 
                            stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                            fontSize={12}
                            label={{ 
                              value: chartData[0]?.unit || 'Quantity', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="quantity" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        Showing entries {chartOffset + 1}-{Math.min(chartOffset + parseInt(chartFilter), selectedSupplementEntries.length)} of {selectedSupplementEntries.length} total
                      </p>
                    </div>
                  </>
                )}

                {selectedSupplement && chartData.length === 0 && (
                  <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    No data available for {selectedSupplement} in this range
                  </p>
                )}

                {!selectedSupplement && (
                  <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    Select a supplement to view its history
                  </p>
                )}
              </div>
            )}

            {/* Recent Entries */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Recent Supplements
              </h3>
              
              {supplements.length === 0 ? (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  No supplements recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {supplements.slice(0, 10).map((supplement) => (
                    <div
                      key={supplement.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isDarkTheme ? 'bg-gray-600/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <Pill className={`w-5 h-5 ${iconColors[theme as keyof typeof iconColors]}`} />
                        <div>
                          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                            {supplement.name}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {supplement.quantity} {supplement.unit}
                            {supplement.notes && ` • ${supplement.notes}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                            {format(supplement.time, 'MMM dd, yyyy')}
                          </p>
                          <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                            {format(supplement.time, 'h:mm a')}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplement.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {supplements.length > 10 && (
                    <p className={`text-center text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Showing latest 10 entries of {supplements.length} total
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Date Selection */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  Select Date
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`${isDarkTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(selectedDate, 'MMM dd, yyyy')}
                </Button>
              </div>

              {showCalendar && (
                <div className={`p-4 border rounded-lg ${
                  isDarkTheme ? 'bg-gray-600 border-gray-500 dark-theme' : 'bg-white border-gray-200'
                }`}>
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setShowCalendar(false);
                      }
                    }}
                    className="mx-auto"
                  />
                </div>
              )}
            </div>

            {/* Supplements for Selected Date */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                Supplements on {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </h3>
              
              {supplementsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className={`w-12 h-12 mx-auto mb-4 ${isDarkTheme ? 'text-gray-500' : 'text-gray-300'}`} />
                  <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                    No supplements recorded for this date
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplementsForSelectedDate.map((supplement) => (
                    <div
                      key={supplement.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        isDarkTheme ? 'bg-gray-600/50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${iconColors[theme as keyof typeof iconColors].replace('text-', 'bg-')}`} />
                        <div>
                          <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                            {supplement.name}
                          </p>
                          <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                            {supplement.quantity} {supplement.unit}
                            {supplement.notes && ` • ${supplement.notes}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-sm font-medium ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                          {format(supplement.time, 'h:mm a')}
                        </p>
                        <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                          {format(supplement.time, 'MMM dd')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Daily Summary */}
              {supplementsForSelectedDate.length > 0 && (
                <div className={`mt-6 p-4 rounded-lg ${isDarkTheme ? 'bg-gray-600/30' : 'bg-blue-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                    Daily Summary
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Supplements</p>
                      <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                        {supplementsForSelectedDate.length}
                      </p>
                    </div>
                    <div>
                      <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Unique Types</p>
                      <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                        {new Set(supplementsForSelectedDate.map(s => s.name)).size}
                      </p>
                    </div>
                    <div>
                      <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>First Taken</p>
                      <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                        {format(supplementsForSelectedDate[0].time, 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}