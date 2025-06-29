import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Scale, Activity, TrendingUp, Calculator, Target, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';
import { apiService } from '../services/apiService';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  bmi: number;
  unit: 'kg' | 'lb';
}

interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number;
  heightUnit: 'cm' | 'in';
  currentWeight: number;
  weightUnit: 'kg' | 'lb';
  goalWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

interface HealthTrackerProps {
  fasts: Fast[];
  theme: string;
  user: string;
}

export function HealthTracker({ fasts, theme, user }: HealthTrackerProps) {
  const [activeTab, setActiveTab] = useState('weight');
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    age: 30,
    gender: 'male',
    height: 170,
    heightUnit: 'cm',
    currentWeight: 70,
    weightUnit: 'kg',
    goalWeight: 65,
    activityLevel: 'moderate'
  });
  const [newWeight, setNewWeight] = useState('');
  const [isMetric, setIsMetric] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from API
  useEffect(() => {
    if (user) {
      loadDataFromAPI();
    }
  }, [user]);

  // Update profile when metric toggle changes
  useEffect(() => {
    const newProfile = {
      ...profile,
      weightUnit: isMetric ? 'kg' as const : 'lb' as const,
      heightUnit: isMetric ? 'cm' as const : 'in' as const
    };
    
    // Convert existing values if switching units
    if (isMetric && profile.weightUnit === 'lb') {
      newProfile.currentWeight = profile.currentWeight * 0.453592;
      newProfile.goalWeight = profile.goalWeight * 0.453592;
      newProfile.height = profile.height * 2.54;
    } else if (!isMetric && profile.weightUnit === 'kg') {
      newProfile.currentWeight = profile.currentWeight / 0.453592;
      newProfile.goalWeight = profile.goalWeight / 0.453592;
      newProfile.height = profile.height / 2.54;
    }
    
    if (newProfile.weightUnit !== profile.weightUnit || newProfile.heightUnit !== profile.heightUnit) {
      saveProfile(newProfile);
    }
  }, [isMetric]);

  const loadDataFromAPI = async () => {
    try {
      setIsLoading(true);
      
      // Load profile
      const profileFromAPI = await apiService.getProfile(user);
      if (profileFromAPI) {
        setProfile(profileFromAPI);
        setIsMetric(profileFromAPI.weightUnit === 'kg');
      }
      
      // Load weights
      const weightsFromAPI = await apiService.getWeights(user);
      setWeightEntries(weightsFromAPI);
    } catch (error) {
      console.error('Failed to load health data from API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save data to API
  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await apiService.saveProfile(user, newProfile);
      setProfile(newProfile);
    } catch (error) {
      console.error('Failed to save profile to API:', error);
    }
  };

  // Calculate BMI
  const calculateBMI = (weight: number, height: number, weightUnit: 'kg' | 'lb', heightUnit: 'cm' | 'in') => {
    let weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    let heightM = heightUnit === 'in' ? height * 0.0254 : height / 100;
    return weightKg / (heightM * heightM);
  };

  // Calculate BMR (Basal Metabolic Rate)
  const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female', weightUnit: 'kg' | 'lb', heightUnit: 'cm' | 'in') => {
    let weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
    let heightCm = heightUnit === 'in' ? height * 2.54 : height;
    
    // Harris-Benedict Equation
    if (gender === 'male') {
      return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
    }
  };

  // Calculate calories burned during fasting
  const calculateFastingCalories = (duration: number, bmr: number) => {
    const hourlyBurn = bmr / 24;
    // During fasting, metabolism can increase by 3-14% due to increased norepinephrine
    const fastingMultiplier = 1.12;
    return duration * hourlyBurn * fastingMultiplier;
  };

  // Add weight entry
  const handleAddWeight = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) return;
    
    try {
      setIsLoading(true);
      const weight = parseFloat(newWeight);
      const bmi = calculateBMI(weight, profile.height, profile.weightUnit, profile.heightUnit);
      
      const savedWeight = await apiService.saveWeight(user, {
        weight,
        bmi,
        unit: profile.weightUnit
      });
      
      const updatedEntries = [...weightEntries, savedWeight].sort((a, b) => b.date.getTime() - a.date.getTime());
      setWeightEntries(updatedEntries);
      
      // Update current weight in profile
      await saveProfile({ ...profile, currentWeight: weight });
      setNewWeight('');
    } catch (error) {
      console.error('Failed to save weight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete weight entry
  const handleDeleteWeight = async (id: string) => {
    try {
      setIsLoading(true);
      await apiService.deleteWeight(user, id);
      const updatedEntries = weightEntries.filter(entry => entry.id !== id);
      setWeightEntries(updatedEntries);
    } catch (error) {
      console.error('Failed to delete weight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  // Calculate fasting statistics
  const calculateFastingStats = () => {
    const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender, profile.weightUnit, profile.heightUnit);
    
    const fastsWithCalories = fasts.map(fast => {
      const calories = calculateFastingCalories(fast.duration, bmr);
      return {
        ...fast,
        caloriesBurned: calories,
        bmi: calculateBMI(profile.currentWeight, profile.height, profile.weightUnit, profile.heightUnit)
      };
    });

    const totalCalories = fastsWithCalories.reduce((sum, fast) => sum + fast.caloriesBurned, 0);
    const totalHours = fasts.reduce((sum, fast) => sum + fast.duration, 0);
    
    return {
      fastsWithCalories,
      totalCalories,
      averageCaloriesPerFast: fasts.length > 0 ? totalCalories / fasts.length : 0,
      totalHours,
      bmr
    };
  };

  const stats = calculateFastingStats();
  const currentBMI = calculateBMI(profile.currentWeight, profile.height, profile.weightUnit, profile.heightUnit);
  const bmiInfo = getBMICategory(currentBMI);

  // Prepare chart data with proper BMI values and reasonable Y-axis range
  const chartData = weightEntries.length > 0 ? [...weightEntries].reverse().map(entry => ({
    ...entry,
    date: entry.date.getTime(), // Use timestamp for proper sorting
    formattedDate: format(entry.date, 'MMM dd'),
    bmi: Number(entry.bmi.toFixed(1)) // Ensure BMI is a proper number
  })) : [];

  // Calculate reasonable BMI range for Y-axis
  const getBMIRange = () => {
    if (chartData.length === 0) return [15, 40];
    
    const bmiValues = chartData.map(d => d.bmi);
    const minBMI = Math.min(...bmiValues);
    const maxBMI = Math.max(...bmiValues);
    
    // Add padding and ensure reasonable range
    const padding = (maxBMI - minBMI) * 0.1 || 2;
    const rangeMin = Math.max(15, Math.floor(minBMI - padding));
    const rangeMax = Math.min(50, Math.ceil(maxBMI + padding));
    
    return [rangeMin, rangeMax];
  };

  const bmiRange = getBMIRange();

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

  const isDarkTheme = theme === 'dark' || theme === 'midnight';

  const tabs = [
    { id: 'weight', label: 'Weight', icon: <Scale className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'calories', label: 'Calories', icon: <Activity className="w-4 h-4" /> }
  ];

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <Scale className={`w-6 h-6 ${iconColors[theme as keyof typeof iconColors]} mr-3`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Health Tracker</h2>
          {isLoading && (
            <div className={`ml-auto text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Syncing...
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className={`flex space-x-1 mb-6 ${isDarkTheme ? 'bg-gray-700/50' : 'bg-white/20'} rounded-lg p-1`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

        {/* Weight Tab */}
        {activeTab === 'weight' && (
          <div className="space-y-6">
            {/* Unit Toggle */}
            <div className="flex justify-center">
              <div className={`${isDarkTheme ? 'bg-gray-700' : 'bg-white/90'} rounded-lg p-1 flex`}>
                <button
                  onClick={() => setIsMetric(true)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isMetric ? 'bg-blue-600 text-white shadow-sm' : `${isDarkTheme ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`
                  }`}
                >
                  KG / CM
                </button>
                <button
                  onClick={() => setIsMetric(false)}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    !isMetric ? 'bg-blue-600 text-white shadow-sm' : `${isDarkTheme ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`
                  }`}
                >
                  LB / IN
                </button>
              </div>
            </div>

            {/* Current Weight Display */}
            <div className={`text-center ${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-8`}>
              <div className={`text-6xl font-bold ${iconColors[theme as keyof typeof iconColors]} mb-2`}>
                {profile.currentWeight.toFixed(1)}
              </div>
              <div className={`text-lg mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                {profile.weightUnit}
              </div>
              <p className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Don't give up, results will come!</p>
            </div>

            {/* Add Weight */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <div className="flex space-x-4">
                <Input
                  type="number"
                  placeholder={`Enter weight in ${profile.weightUnit}`}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className={`flex-1 ${isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}`}
                />
                <Button onClick={handleAddWeight} className="px-8" disabled={isLoading}>
                  Update Weight
                </Button>
              </div>
            </div>

            {/* Goal Section */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Goal</h3>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Start</p>
                  <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{profile.currentWeight.toFixed(1)} {profile.weightUnit}</p>
                </div>
                <div className={`${isDarkTheme ? 'text-gray-500' : 'text-gray-400'}`}>→</div>
                <div>
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Goal</p>
                  <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>{profile.goalWeight.toFixed(1)} {profile.weightUnit}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const goal = prompt('Enter your goal weight:');
                  if (goal && !isNaN(parseFloat(goal))) {
                    saveProfile({ ...profile, goalWeight: parseFloat(goal) });
                  }
                }}
                className="w-full"
              >
                Set Goal
              </Button>
            </div>

            {/* BMI Section */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-xl font-bold ${iconColors[theme as keyof typeof iconColors]} mb-4`}>Body Mass Index (BMI)</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  type="number"
                  label="Age"
                  value={profile.age}
                  onChange={(e) => saveProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>Gender</label>
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={() => saveProfile({ ...profile, gender: 'male' })}
                      className={`flex-1 py-2 px-4 text-sm font-medium ${
                        profile.gender === 'male' ? 'bg-blue-600 text-white' : `${isDarkTheme ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => saveProfile({ ...profile, gender: 'female' })}
                      className={`flex-1 py-2 px-4 text-sm font-medium ${
                        profile.gender === 'female' ? 'bg-blue-600 text-white' : `${isDarkTheme ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <Input
                  type="number"
                  label={`Weight (${profile.weightUnit})`}
                  value={profile.currentWeight.toFixed(1)}
                  onChange={(e) => saveProfile({ ...profile, currentWeight: parseFloat(e.target.value) || 0 })}
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
                <Input
                  type="number"
                  label={`Height (${profile.heightUnit})`}
                  value={profile.height.toFixed(profile.heightUnit === 'cm' ? 0 : 1)}
                  onChange={(e) => saveProfile({ ...profile, height: parseFloat(e.target.value) || 0 })}
                  className={isDarkTheme ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : ''}
                />
              </div>

              <div className="text-center mb-4">
                <div className={`text-4xl font-bold ${iconColors[theme as keyof typeof iconColors]} mb-2`}>
                  {currentBMI.toFixed(1)}
                </div>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${bmiInfo.bgColor} ${bmiInfo.color}`}>
                  {bmiInfo.category}
                </div>
              </div>

              {/* BMI Scale */}
              <div className="relative">
                <div className="h-4 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-400 rounded-full"></div>
                <div className={`flex justify-between text-xs mt-2 ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span>Underweight</span>
                  <span>Normal</span>
                  <span>Overweight</span>
                  <span>Obese</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Weight Progress Chart */}
            {weightEntries.length > 1 && (
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Weight Progress</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="formattedDate"
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        domain={['dataMin - 2', 'dataMax + 2']}
                      />
                      <Tooltip 
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return format(new Date(payload[0].payload.date), 'MMM dd, yyyy');
                          }
                          return label;
                        }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(1)} ${weightEntries[0]?.unit || 'kg'}`, 
                          'Weight'
                        ]}
                        contentStyle={{
                          backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
                          border: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Track your progress over time
                  </p>
                </div>
              </div>
            )}

            {/* BMI Progress Chart */}
            {weightEntries.length > 1 && (
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>BMI Progress</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="formattedDate"
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                        domain={bmiRange}
                        tickCount={6}
                      />
                      <Tooltip 
                        labelFormatter={(label, payload) => {
                          if (payload && payload[0]) {
                            return format(new Date(payload[0].payload.date), 'MMM dd, yyyy');
                          }
                          return label;
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}`, 'BMI']}
                        contentStyle={{
                          backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
                          border: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="bmi" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    BMI range: {bmiRange[0]}-{bmiRange[1]} (Normal: 18.5-25)
                  </p>
                </div>
              </div>
            )}

            {/* Weight History List */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Weight History</h3>
              {weightEntries.length === 0 ? (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No weight entries yet</p>
              ) : (
                <div className="space-y-3">
                  {weightEntries.slice(0, 10).map((entry, index) => {
                    const prevEntry = weightEntries[index + 1];
                    const change = prevEntry ? entry.weight - prevEntry.weight : 0;
                    const bmiCategory = getBMICategory(entry.bmi);
                    
                    return (
                      <div key={entry.id} className={`flex items-center justify-between p-4 rounded-lg ${isDarkTheme ? 'bg-gray-600/50' : 'bg-gray-50'}`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                                {entry.weight.toFixed(1)} {entry.unit}
                              </p>
                              <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                                {format(entry.date, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${bmiCategory.bgColor} ${bmiCategory.color}`}>
                              BMI: {entry.bmi.toFixed(1)}
                            </div>
                            {change !== 0 && (
                              <div className={`text-sm font-medium ${
                                change > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {change > 0 ? '+' : ''}{change.toFixed(1)} {entry.unit}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWeight(entry.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {weightEntries.length > 10 && (
                    <p className={`text-center text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                      Showing latest 10 entries of {weightEntries.length} total
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Calories Tab */}
        {activeTab === 'calories' && (
          <div className="space-y-6">
            {/* Calorie Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6 text-center`}>
                <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {Math.round(stats.totalCalories).toLocaleString()}
                </div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Total Calories Burned</p>
              </div>
              
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6 text-center`}>
                <Calculator className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {Math.round(stats.averageCaloriesPerFast).toLocaleString()}
                </div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Avg per Fast</p>
              </div>
              
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6 text-center`}>
                <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                  {Math.round(stats.bmr).toLocaleString()}
                </div>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>Daily BMR</p>
              </div>
            </div>

            {/* Fasting Records with Calories */}
            <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Fasting Records</h3>
              {stats.fastsWithCalories.length === 0 ? (
                <p className={`text-center py-8 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>No fasting records yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.fastsWithCalories.slice(0, 10).map((fast) => (
                    <div key={fast.id} className={`flex items-center justify-between p-4 rounded-lg ${isDarkTheme ? 'bg-gray-600/50' : 'bg-gray-50'}`}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className={`font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>
                              {format(fast.startTime, 'MMM dd, yyyy')}
                            </p>
                            <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                              {format(fast.startTime, 'h:mm a')} - {format(fast.endTime, 'h:mm a')}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-blue-600">
                              {Math.round(fast.duration)}h
                            </p>
                            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-orange-600">
                              {Math.round(fast.caloriesBurned)}
                            </p>
                            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>Calories</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-green-600">
                              {fast.bmi.toFixed(1)}
                            </p>
                            <p className={`text-xs ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>BMI</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calorie Burn Chart */}
            {stats.fastsWithCalories.length > 0 && (
              <div className={`${isDarkTheme ? 'bg-gray-700/80' : 'bg-white/90'} rounded-xl p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Calorie Burn History</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.fastsWithCalories.slice(-10).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkTheme ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="startTime" 
                        tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkTheme ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip 
                        labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                        formatter={(value: number) => [`${Math.round(value)} calories`, 'Burned']}
                        contentStyle={{
                          backgroundColor: isDarkTheme ? '#374151' : '#ffffff',
                          border: `1px solid ${isDarkTheme ? '#4b5563' : '#e5e7eb'}`,
                          color: isDarkTheme ? '#ffffff' : '#000000',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="caloriesBurned" 
                        fill="#f97316"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}