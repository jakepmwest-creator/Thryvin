import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  Flame,
  Apple,
  Zap,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  PieChart,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgressRing } from '@/components/ui/CircularProgressRing';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface NutritionTrackingContentProps {
  userId: number;
}

interface DailyNutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  mealsLogged: number;
}

interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export default function NutritionTrackingContent({ userId }: NutritionTrackingContentProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Sample nutrition goals - in real app would come from user profile
  const nutritionGoals: NutritionGoals = {
    calories: 2300,
    protein: 180,
    carbs: 250,
    fat: 70,
    fiber: 30,
    sugar: 50,
    sodium: 2300
  };

  // Generate sample data for the selected period
  const generateNutritionData = (period: 'week' | 'month'): DailyNutritionData[] => {
    const days = period === 'week' ? 7 : 30;
    const data: DailyNutritionData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        calories: Math.floor(nutritionGoals.calories * (0.7 + Math.random() * 0.4)),
        protein: Math.floor(nutritionGoals.protein * (0.6 + Math.random() * 0.5)),
        carbs: Math.floor(nutritionGoals.carbs * (0.5 + Math.random() * 0.6)),
        fat: Math.floor(nutritionGoals.fat * (0.6 + Math.random() * 0.5)),
        fiber: Math.floor(nutritionGoals.fiber * (0.4 + Math.random() * 0.8)),
        sugar: Math.floor(nutritionGoals.sugar * (0.3 + Math.random() * 0.7)),
        sodium: Math.floor(nutritionGoals.sodium * (0.4 + Math.random() * 0.8)),
        mealsLogged: Math.floor(3 + Math.random() * 2)
      });
    }
    
    return data;
  };

  const nutritionData = generateNutritionData(selectedPeriod);
  const todayData = nutritionData[nutritionData.length - 1];

  // Calculate weekly averages and progress
  const weeklyAverages = {
    calories: Math.floor(nutritionData.reduce((sum, day) => sum + day.calories, 0) / nutritionData.length),
    protein: Math.floor(nutritionData.reduce((sum, day) => sum + day.protein, 0) / nutritionData.length),
    carbs: Math.floor(nutritionData.reduce((sum, day) => sum + day.carbs, 0) / nutritionData.length),
    fat: Math.floor(nutritionData.reduce((sum, day) => sum + day.fat, 0) / nutritionData.length),
  };

  // Calculate progress percentages
  const progressData = [
    {
      name: 'Calories',
      current: todayData.calories,
      goal: nutritionGoals.calories,
      percentage: Math.min((todayData.calories / nutritionGoals.calories) * 100, 100),
      color: '#FF6B6B',
      icon: Flame
    },
    {
      name: 'Protein',
      current: todayData.protein,
      goal: nutritionGoals.protein,
      percentage: Math.min((todayData.protein / nutritionGoals.protein) * 100, 100),
      color: '#4ECDC4',
      icon: Zap
    },
    {
      name: 'Carbs',
      current: todayData.carbs,
      goal: nutritionGoals.carbs,
      percentage: Math.min((todayData.carbs / nutritionGoals.carbs) * 100, 100),
      color: '#45B7D1',
      icon: Apple
    },
    {
      name: 'Fat',
      current: todayData.fat,
      goal: nutritionGoals.fat,
      percentage: Math.min((todayData.fat / nutritionGoals.fat) * 100, 100),
      color: '#FFA726',
      icon: Target
    }
  ];

  // Macronutrient pie chart data
  const macroData = [
    { name: 'Protein', value: todayData.protein * 4, color: '#4ECDC4' },
    { name: 'Carbs', value: todayData.carbs * 4, color: '#45B7D1' },
    { name: 'Fat', value: todayData.fat * 9, color: '#FFA726' }
  ];

  const chartData = nutritionData.map(day => ({
    ...day,
    formattedDate: format(new Date(day.date), selectedPeriod === 'week' ? 'EEE' : 'MMM d')
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          Nutrition Tracking
        </h2>
        <p className="text-gray-600">Track your daily nutrition and progress toward your goals</p>
      </div>

      {/* Period Toggle */}
      <div className="flex justify-center">
        <div className="flex rounded-xl border-2 border-gray-300 overflow-hidden bg-white">
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
            className={`rounded-none px-6 ${selectedPeriod === 'week' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
            className={`rounded-none px-6 ${selectedPeriod === 'month' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Today's Progress Rings */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 rounded-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Today's Nutrition
          </CardTitle>
          <p className="text-sm text-gray-600">Current progress toward daily goals</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {progressData.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <CircularProgressRing
                  color={item.color}
                  percentage={item.percentage}
                  label={item.name}
                  size={100}
                  strokeWidth={8}
                  animationDelay={index * 0.2}
                />
                <div className="mt-3">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    <span className="font-semibold text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.current}g / {item.goal}g
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="mt-1 text-xs"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {Math.round(item.percentage)}%
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calories Trend Chart */}
        <Card className="rounded-2xl border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Calories Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} cal`, 'Calories']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#FF6B6B"
                    strokeWidth={2}
                    fill="url(#caloriesGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Macronutrient Breakdown */}
        <Card className="rounded-2xl border-2 border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Today's Macros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macroData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${Math.round(Number(value))} cal`, '']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {macroData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Calories</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyAverages.calories}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5% from last {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Protein</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyAverages.protein}g</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-teal-500" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12% from last {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Carbs</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyAverages.carbs}g</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Apple className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">-3% from last {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Fat</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyAverages.fat}g</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+8% from last {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-100 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-green-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold text-gray-900">Goal Crusher</h4>
              <p className="text-sm text-gray-600">Hit protein goal 5 days in a row</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">🔥</div>
              <h4 className="font-semibold text-gray-900">Consistency King</h4>
              <p className="text-sm text-gray-600">Logged meals 7 days straight</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl mb-2">⚡</div>
              <h4 className="font-semibold text-gray-900">Macro Master</h4>
              <p className="text-sm text-gray-600">Perfect macro balance achieved</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}