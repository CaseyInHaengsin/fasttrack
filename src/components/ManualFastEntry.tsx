import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PlusCircle } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface ManualFastEntryProps {
  onAddFast: (startTime: Date, endTime: Date) => void;
}

export function ManualFastEntry({ onAddFast }: ManualFastEntryProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('20:00');
  const [endTime, setEndTime] = useState('12:00');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date(selectedDate);
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // If end time is earlier than start time, assume it's the next day
    if (endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    onAddFast(startDate, endDate);
    
    // Reset to defaults for next entry
    setStartTime('20:00');
    setEndTime('12:00');
  };

  return (
    <Card>
      <CardContent>
        <div className="flex items-center mb-6">
          <PlusCircle className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-800">Add Past Fast</h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full justify-start"
            >
              {selectedDate.toLocaleDateString()}
            </Button>
            
            {showDatePicker && (
              <div className="mt-2 p-4 border rounded-lg bg-white shadow-lg">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }
                  }}
                  className="mx-auto"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              type="time"
              label="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Add Fast
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}