import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from './ui/Card';
import { format } from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface Fast {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

interface FastingChartProps {
  fasts: Fast[];
}

export function FastingChart({ fasts }: FastingChartProps) {
  const chartData = fasts
    .slice(-20) // Last 20 fasts for better visibility
    .map((fast, index) => ({
      name: format(fast.startTime, 'MMM dd'),
      duration: Math.round(fast.duration), // Round to nearest hour
      fullDate: format(fast.startTime, 'EEEE, MMMM do, yyyy'),
      startTime: format(fast.startTime, 'h:mm a'),
      endTime: format(fast.endTime, 'h:mm a'),
      exactDuration: fast.duration.toFixed(1)
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800">{data.fullDate}</p>
          <p className="text-sm text-gray-600 mt-1">
            {data.startTime} → {data.endTime}
          </p>
          <p className="text-blue-600 font-bold mt-2">
            Duration: {data.exactDuration} hours
          </p>
          <p className="text-xs text-gray-500 mt-1">
            (Rounded: {data.duration} hours)
          </p>
        </div>
      );
    }
    return null;
  };

  if (fasts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No fasting data yet</p>
          <p className="text-sm text-gray-400 mt-2">Add your first fast to see the chart!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
      <CardContent>
        <div className="flex items-center mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-800">Fasting Duration History</h3>
          <span className="ml-auto text-sm text-gray-600">
            Last {Math.min(20, fasts.length)} fasts
          </span>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ 
                  value: 'Hours', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="duration" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                stroke="#2563eb"
                strokeWidth={1}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            All durations are rounded to the nearest hour for display
          </p>
        </div>
      </CardContent>
    </Card>
  );
}