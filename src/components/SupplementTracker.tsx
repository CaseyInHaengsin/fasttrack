import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Pill, Plus, Trash2, Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { apiService } from '../services/apiService';

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
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: 'mg',
    time: format(new Date(), 'HH:mm'),
    notes: ''
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
      
      // Reset form
      setFormData({
        name: '',
        quantity: '',
        unit: 'mg',
        time: format(new Date(), 'HH:mm'),
        notes: ''
      });
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

  // Get unique supplement names for selection
  const uniqueSupplements = Array.from(new Set(supplements.map(s => s.name))).sort();

  // Prepare chart data for selected supplement
  const getChartData = () => {
    if (!selectedSupplement) return [];
    
    const filteredSupplements = supplements
      .filter(s => s.name === selectedSupplement)
      .sort((a, b) => a.time.getTime() - b.time.getTime())
      .slice(-30); // Last 30 entries
    
    return filteredSupplements.map(supplement => ({
      date: format(supplement.time, 'MMM dd'),
      time: format(supplement.time, 'HH:mm'),
      quantity: supplement.quantity,
      fullDate: format(supplement.time, 'EEEE, MMMM do, yyyy'),
      unit: supplement.unit
    }));
  };

  const chartData = getChartData();

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

        <div className="space-y-8">
          {/* Add Supplement Form */}
          <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
              Add Supplement
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Supplement Name"
                  placeholder="e.g., Vitamin D, Magnesium"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
                
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

          {/* Chart Section */}
          {uniqueSupplements.length > 0 && (
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  Supplement History
                </h3>
                <div className="flex items-center space-x-2">
                  <BarChart3 className={`w-4 h-4 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`} />
                  <select
                    value={selectedSupplement}
                    onChange={(e) => setSelectedSupplement(e.target.value)}
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
              </div>

              {selectedSupplement && chartData.length > 0 && (
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
              )}

              {selectedSupplement && chartData.length === 0 && (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  No data available for {selectedSupplement}
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
      </CardContent>
    </Card>
  );
}