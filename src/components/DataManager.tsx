import React, { useRef, useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { format } from 'date-fns';

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

interface DataManagerProps {
  fasts: Fast[];
  onImportFasts: (fasts: Fast[]) => void;
  theme: string;
  user: string;
}

export function DataManager({ fasts, onImportFasts, theme, user }: DataManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load weight entries and health profile from localStorage
  const getWeightEntries = (): WeightEntry[] => {
    const savedWeights = localStorage.getItem(`weightEntries_${user}`);
    if (savedWeights) {
      return JSON.parse(savedWeights).map((entry: any) => ({
        ...entry,
        date: new Date(entry.date)
      }));
    }
    return [];
  };

  const getHealthProfile = () => {
    const savedProfile = localStorage.getItem(`healthProfile_${user}`);
    return savedProfile ? JSON.parse(savedProfile) : null;
  };

  // Calculate calories for fasts
  const calculateFastingCalories = (duration: number, profile: any) => {
    if (!profile) return 0;
    
    const calculateBMR = (weight: number, height: number, age: number, gender: 'male' | 'female', weightUnit: 'kg' | 'lb', heightUnit: 'cm' | 'in') => {
      let weightKg = weightUnit === 'lb' ? weight * 0.453592 : weight;
      let heightCm = heightUnit === 'in' ? height * 2.54 : height;
      
      if (gender === 'male') {
        return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
      }
    };

    const bmr = calculateBMR(profile.currentWeight, profile.height, profile.age, profile.gender, profile.weightUnit, profile.heightUnit);
    const hourlyBurn = bmr / 24;
    const fastingMultiplier = 1.12; // 12% increase during fasting
    return duration * hourlyBurn * fastingMultiplier;
  };

  const handleExport = () => {
    if (fasts.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No fasting data to export'
      });
      return;
    }

    const weightEntries = getWeightEntries();
    const healthProfile = getHealthProfile();

    // Prepare fasting data with calories
    const fastingData = fasts.map(fast => {
      const calories = calculateFastingCalories(fast.duration, healthProfile);
      return {
        type: 'fast',
        id: fast.id,
        startTime: fast.startTime.toISOString(),
        endTime: fast.endTime.toISOString(),
        duration: fast.duration,
        startDate: format(fast.startTime, 'yyyy-MM-dd'),
        startHour: format(fast.startTime, 'HH:mm'),
        endDate: format(fast.endTime, 'yyyy-MM-dd'),
        endHour: format(fast.endTime, 'HH:mm'),
        durationHours: Math.round(fast.duration),
        caloriesBurned: Math.round(calories),
        // Weight data (empty for fasting records)
        weight: '',
        bmi: '',
        weightUnit: ''
      };
    });

    // Prepare weight data
    const weightData = weightEntries.map(entry => ({
      type: 'weight',
      id: entry.id,
      startTime: '',
      endTime: '',
      duration: '',
      startDate: format(entry.date, 'yyyy-MM-dd'),
      startHour: '',
      endDate: '',
      endHour: '',
      durationHours: '',
      caloriesBurned: '',
      // Weight data
      weight: entry.weight,
      bmi: entry.bmi.toFixed(2),
      weightUnit: entry.unit,
      weightDate: entry.date.toISOString()
    }));

    // Combine all data
    const allData = [...fastingData, ...weightData];

    const csv = Papa.unparse(allData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fasttrack-complete-${user}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setImportStatus({
        type: 'success',
        message: `Successfully exported ${fasts.length} fasting records and ${weightEntries.length} weight entries`
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportStatus({
        type: 'error',
        message: 'Please select a valid CSV file'
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const importedFasts: Fast[] = [];
          const importedWeights: WeightEntry[] = [];
          const errors: string[] = [];

          results.data.forEach((row: any, index: number) => {
            try {
              if (row.type === 'fast' || (!row.type && row.startTime)) {
                // Handle fasting data
                let startTime: Date;
                let endTime: Date;

                if (row.startTime && row.endTime) {
                  startTime = new Date(row.startTime);
                  endTime = new Date(row.endTime);
                } else if (row.startDate && row.startHour && row.endDate && row.endHour) {
                  startTime = new Date(`${row.startDate}T${row.startHour}:00`);
                  endTime = new Date(`${row.endDate}T${row.endHour}:00`);
                } else {
                  throw new Error('Missing required date/time fields for fast');
                }

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                  throw new Error('Invalid date format for fast');
                }

                if (endTime <= startTime) {
                  throw new Error('End time must be after start time for fast');
                }

                const duration = row.duration ? 
                  parseFloat(row.duration) : 
                  (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

                const fast: Fast = {
                  id: row.id || crypto.randomUUID(),
                  startTime,
                  endTime,
                  duration
                };

                importedFasts.push(fast);
              } else if (row.type === 'weight' || (!row.type && row.weight)) {
                // Handle weight data
                const weight = parseFloat(row.weight);
                const bmi = parseFloat(row.bmi);
                const date = row.weightDate ? new Date(row.weightDate) : new Date(row.startDate);

                if (isNaN(weight) || isNaN(bmi) || isNaN(date.getTime())) {
                  throw new Error('Invalid weight data');
                }

                const weightEntry: WeightEntry = {
                  id: row.id || crypto.randomUUID(),
                  weight,
                  bmi,
                  date,
                  unit: (row.weightUnit as 'kg' | 'lb') || 'kg'
                };

                importedWeights.push(weightEntry);
              }
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
            }
          });

          // Import fasting data
          if (importedFasts.length > 0) {
            const existingFasts = new Set(
              fasts.map(f => `${f.startTime.getTime()}-${f.duration}`)
            );
            
            const newFasts = importedFasts.filter(
              f => !existingFasts.has(`${f.startTime.getTime()}-${f.duration}`)
            );

            if (newFasts.length > 0) {
              onImportFasts([...fasts, ...newFasts]);
            }
          }

          // Import weight data
          if (importedWeights.length > 0) {
            const existingWeights = getWeightEntries();
            const existingWeightSet = new Set(
              existingWeights.map(w => `${w.date.getTime()}-${w.weight}`)
            );
            
            const newWeights = importedWeights.filter(
              w => !existingWeightSet.has(`${w.date.getTime()}-${w.weight}`)
            );

            if (newWeights.length > 0) {
              const allWeights = [...existingWeights, ...newWeights].sort((a, b) => b.date.getTime() - a.date.getTime());
              localStorage.setItem(`weightEntries_${user}`, JSON.stringify(allWeights));
            }
          }

          const totalImported = importedFasts.length + importedWeights.length;
          if (totalImported === 0) {
            setImportStatus({
              type: 'error',
              message: `No valid records found. Errors: ${errors.slice(0, 3).join(', ')}`
            });
            return;
          }

          setImportStatus({
            type: 'success',
            message: `Successfully imported ${importedFasts.length} fasting records and ${importedWeights.length} weight entries${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
          });

          // Refresh the page to show updated data
          window.location.reload();

        } catch (error) {
          setImportStatus({
            type: 'error',
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      },
      error: (error) => {
        setImportStatus({
          type: 'error',
          message: `Failed to parse CSV: ${error.message}`
        });
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const statusClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  const darkStatusClasses = {
    success: 'bg-green-900/50 border-green-700 text-green-200',
    error: 'bg-red-900/50 border-red-700 text-red-200'
  };

  const isDarkTheme = theme === 'dark' || theme === 'midnight';
  const weightEntries = getWeightEntries();

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <FileText className={`w-6 h-6 mr-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Data Management</h2>
        </div>

        <div className="space-y-4">
          {/* Export Section */}
          <div className={`${isDarkTheme ? 'bg-gray-700/90' : 'bg-white/90'} backdrop-blur-sm rounded-lg p-6 shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Export Complete Data</h3>
            <p className={`mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Download your complete fasting and health data as a CSV file including:
            </p>
            <ul className={`list-disc list-inside mb-4 text-sm space-y-1 ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              <li>Fasting records with calculated calories burned</li>
              <li>Weight history with BMI calculations</li>
              <li>All dates, times, and measurements</li>
              <li>Compatible format for re-importing</li>
            </ul>
            <Button
              onClick={handleExport}
              className="flex items-center"
              disabled={fasts.length === 0 && weightEntries.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Complete Data ({fasts.length} fasts, {weightEntries.length} weights)
            </Button>
          </div>

          {/* Import Section */}
          <div className={`${isDarkTheme ? 'bg-gray-700/90' : 'bg-white/90'} backdrop-blur-sm rounded-lg p-6 shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Import Data</h3>
            <p className={`mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Upload a CSV file to import fasting records and weight data. Duplicates will be automatically filtered out.
            </p>
            
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV File
              </Button>

              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="font-medium mb-1">Expected CSV format:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Fasting records:</strong> type, startTime, endTime, duration, caloriesBurned</li>
                  <li><strong>Weight records:</strong> type, weight, bmi, weightUnit, weightDate</li>
                  <li>Dates in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)</li>
                  <li>Or separate: startDate, startHour, endDate, endHour</li>
                  <li>Duration in hours (decimal), calories as numbers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {importStatus.type && (
            <div className={`rounded-lg p-4 border flex items-start space-x-3 ${
              isDarkTheme 
                ? darkStatusClasses[importStatus.type]
                : statusClasses[importStatus.type]
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {importStatus.type === 'success' ? 'Success!' : 'Error'}
                </p>
                <p className="text-sm mt-1">{importStatus.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportStatus({ type: null, message: '' })}
                className="ml-auto"
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}