import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface FastingTimerProps {
  onFastComplete: (duration: number) => void;
}

export function FastingTimer({ onFastComplete }: FastingTimerProps) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(differenceInSeconds(new Date(), startTime));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setIsActive(true);
    localStorage.setItem('fastingStartTime', now.toISOString());
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    if (startTime) {
      const duration = differenceInSeconds(new Date(), startTime) / 3600; // Convert to hours
      onFastComplete(duration);
    }
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    localStorage.removeItem('fastingStartTime');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check for existing fast on mount
  useEffect(() => {
    const savedStartTime = localStorage.getItem('fastingStartTime');
    if (savedStartTime) {
      const start = new Date(savedStartTime);
      setStartTime(start);
      setIsActive(true);
      setElapsedSeconds(differenceInSeconds(new Date(), start));
    }
  }, []);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardContent className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Clock className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-800">Live Fasting Timer</h2>
        </div>
        
        <div className="mb-8">
          <div className="text-6xl font-mono font-bold text-blue-600 mb-2">
            {formatTime(elapsedSeconds)}
          </div>
          {startTime && (
            <p className="text-gray-600">
              Started {formatDistanceToNow(startTime, { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          {!isActive && !startTime && (
            <Button onClick={handleStart} className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              Start Fast
            </Button>
          )}
          
          {isActive && (
            <Button onClick={handlePause} variant="secondary" className="flex items-center">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {!isActive && startTime && (
            <Button onClick={() => setIsActive(true)} className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
          
          {startTime && (
            <Button onClick={handleStop} variant="outline" className="flex items-center">
              <Square className="w-4 h-4 mr-2" />
              End Fast
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}