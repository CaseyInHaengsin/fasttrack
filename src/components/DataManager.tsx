import React, { useRef, useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
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

interface SupplementEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  time: Date;
  notes?: string;
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
  const [isLoading, setIsLoading] = useState(false);

  // Load weight entries, supplements, and health profile from API
  const getWeightEntries = async (): Promise<WeightEntry[]> => {
    try {
      return await apiService.getWeights(user);
    } catch (error) {
      console.error('Failed to load weights from API:', error);
      return [];
    }
  };

  const getSupplements = async (): Promise<SupplementEntry[]> => {
    try {
      return await apiService.getSupplements(user);
    } catch (error) {
      console.error('Failed to load supplements from API:', error);
      return [];
    }
  };

  const getHealthProfile = async () => {
    try {
      return await apiService.getProfile(user);
    } catch (error) {
      console.error('Failed to load profile from API:', error);
      return null;
    }
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

  const handleExport = async () => {
    if (fasts.length === 0) {
      setImportStatus({
        type: 'error',
        message: 'No fasting data to export'
      });
      return;
    }

    try {
      setIsLoading(true);
      const weightEntries = await getWeightEntries();
      const supplements = await getSupplements();
      const healthProfile = await getHealthProfile();

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
          weightUnit: '',
          // Supplement data (empty for fasting records)
          supplementName: '',
          supplementQuantity: '',
          supplementUnit: '',
          supplementNotes: ''
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
        weightDate: entry.date.toISOString(),
        // Supplement data (empty for weight records)
        supplementName: '',
        supplementQuantity: '',
        supplementUnit: '',
        supplementNotes: ''
      }));

      // Prepare supplement data
      const supplementData = supplements.map(supplement => ({
        type: 'supplement',
        id: supplement.id,
        startTime: '',
        endTime: '',
        duration: '',
        startDate: format(supplement.time, 'yyyy-MM-dd'),
        startHour: format(supplement.time, 'HH:mm'),
        endDate: '',
        endHour: '',
        durationHours: '',
        caloriesBurned: '',
        // Weight data (empty for supplement records)
        weight: '',
        bmi: '',
        weightUnit: '',
        weightDate: '',
        // Supplement data
        supplementName: supplement.name,
        supplementQuantity: supplement.quantity,
        supplementUnit: supplement.unit,
        supplementTime: supplement.time.toISOString(),
        supplementNotes: supplement.notes || ''
      }));

      // Combine all data
      const allData = [...fastingData, ...weightData, ...supplementData];

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
          message: `Successfully exported ${fasts.length} fasting records, ${weightEntries.length} weight entries, and ${supplements.length} supplement entries`
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      setImportStatus({
        type: 'error',
        message: 'Failed to export data. Please try again.'
      });
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const importedFasts: Fast[] = [];
          const importedWeights: WeightEntry[] = [];
          const importedSupplements: SupplementEntry[] = [];
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
              } else if (row.type === 'supplement' || (!row.type && row.supplementName)) {
                // Handle supplement data
                const quantity = parseFloat(row.supplementQuantity);
                const time = row.supplementTime ? new Date(row.supplementTime) : new Date(`${row.startDate}T${row.startHour}:00`);

                if (!row.supplementName || isNaN(quantity) || isNaN(time.getTime())) {
                  throw new Error('Invalid supplement data');
                }

                const supplementEntry: SupplementEntry = {
                  id: row.id || crypto.randomUUID(),
                  name: row.supplementName,
                  quantity,
                  unit: row.supplementUnit || 'mg',
                  time,
                  notes: row.supplementNotes || ''
                };

                importedSupplements.push(supplementEntry);
              }
            } catch (error) {
              errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`);
            }
          });

          // Import data via API
          if (importedFasts.length > 0 || importedWeights.length > 0 || importedSupplements.length > 0) {
            try {
              await apiService.importData(user, {
                fasts: importedFasts,
                weights: importedWeights,
                supplements: importedSupplements
              });

              setImportStatus({
                type: 'success',
                message: `Successfully imported ${importedFasts.length} fasting records, ${importedWeights.length} weight entries, and ${importedSupplements.length} supplement entries${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
              });

              // Refresh the page to show updated data
              window.location.reload();
            } catch (error) {
              throw new Error('Failed to save imported data to server');
            }
          } else {
            setImportStatus({
              type: 'error',
              message: `No valid records found. Errors: ${errors.slice(0, 3).join(', ')}`
            });
          }
        } catch (error) {
          setImportStatus({
            type: 'error',
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        setImportStatus({
          type: 'error',
          message: `Failed to parse CSV: ${error.message}`
        });
        setIsLoading(false);
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

  return (
    <Card className={`bg-gradient-to-br ${themeClasses[theme as keyof typeof themeClasses]}`}>
      <CardContent>
        <div className="flex items-center mb-6">
          <FileText className={`w-6 h-6 mr-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`} />
          <h2 className={`text-xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Data Management</h2>
          {isLoading && (
            <div className={`ml-auto text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
              Processing...
            </div>
          )}
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
              <li>Supplement tracking with quantities and times</li>
              <li>All dates, times, and measurements</li>
              <li>Compatible format for re-importing</li>
            </ul>
            <Button
              onClick={handleExport}
              className="flex items-center"
              disabled={fasts.length === 0 || isLoading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isLoading ? 'Exporting...' : `Export Complete Data (${fasts.length} fasts)`}
            </Button>
          </div>

          {/* Import Section */}
          <div className={`${isDarkTheme ? 'bg-gray-700/90' : 'bg-white/90'} backdrop-blur-sm rounded-lg p-6 shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-3 ${isDarkTheme ? 'text-white' : 'text-gray-800'}`}>Import Data</h3>
            <p className={`mb-4 ${isDarkTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Upload a CSV file to import fasting records, weight data, and supplement tracking. Data will be saved to the server.
            </p>
            
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                disabled={isLoading}
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isLoading ? 'Processing...' : 'Choose CSV File'}
              </Button>

              <div className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                <p className="font-medium mb-1">Expected CSV format:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><strong>Fasting records:</strong> type, startTime, endTime, duration, caloriesBurned</li>
                  <li><strong>Weight records:</strong> type, weight, bmi, weightUnit, weightDate</li>
                  <li><strong>Supplement records:</strong> type, supplementName, supplementQuantity, supplementUnit, supplementTime, supplementNotes</li>
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