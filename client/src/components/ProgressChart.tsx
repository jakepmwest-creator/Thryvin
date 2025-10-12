import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isValid } from 'date-fns';
import { motion } from 'framer-motion';

interface ProgressSnapshot {
  id: number;
  userId: number;
  snapshotDate: string;
  period: string;
  workoutsCompleted: number;
  minutesTraining: number;
  streakDays: number;
  caloriesBurned: number;
}

interface ProgressChartProps {
  data: ProgressSnapshot[];
  title: string;
  dataKey: keyof ProgressSnapshot;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  period: 'week' | 'month';
  valueFormatter?: (value: number) => string;
}

export function ProgressChart({
  data,
  title,
  dataKey,
  color = '#3b82f6',
  gradientFrom = 'rgba(59, 130, 246, 0.8)',
  gradientTo = 'rgba(59, 130, 246, 0)',
  period,
  valueFormatter = (value) => `${value}`
}: ProgressChartProps) {
  // Format data for the chart
  const formattedData = data.map(snapshot => {
    const date = parseISO(snapshot.snapshotDate);
    return {
      ...snapshot,
      formattedDate: isValid(date) 
        ? format(date, period === 'week' ? 'MMM d' : 'MMM yyyy')
        : 'Invalid Date'
    };
  });

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <motion.div
          className="h-64 w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="formattedDate"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={valueFormatter}
              />
              <Tooltip
                formatter={(value) => [valueFormatter(Number(value)), title]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fillOpacity={1}
                fill={`url(#gradient-${dataKey})`}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}