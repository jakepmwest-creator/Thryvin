import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Droplets, Utensils, Moon, Flame, TrendingUp } from 'lucide-react';
import { notificationManager, NotificationPreferences } from '@/utils/NotificationManager';

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationManager.getPreferences()
  );

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);
    notificationManager.updatePreferences(newPreferences);
  };

  const notificationTypes = [
    {
      key: 'workoutReminders' as keyof NotificationPreferences,
      title: 'Workout Reminders',
      description: '30 minutes before scheduled workouts',
      icon: <Clock className="w-5 h-5 text-purple-500" />,
      example: "It's 30 mins before your HIIT workout — ready to go?"
    },
    {
      key: 'hydrationReminders' as keyof NotificationPreferences,
      title: 'Hydration Alerts',
      description: 'Remind me to drink water',
      icon: <Droplets className="w-5 h-5 text-blue-500" />,
      example: "You haven't logged water today."
    },
    {
      key: 'mealReminders' as keyof NotificationPreferences,
      title: 'Meal Logging',
      description: 'Remind me to log meals',
      icon: <Utensils className="w-5 h-5 text-green-500" />,
      example: "Time to log your next meal?"
    },
    {
      key: 'restDayReminders' as keyof NotificationPreferences,
      title: 'Recovery Suggestions',
      description: 'Rest day and recovery tips',
      icon: <Moon className="w-5 h-5 text-indigo-500" />,
      example: "Rest day tomorrow. Want a recovery suggestion?"
    },
    {
      key: 'streakAlerts' as keyof NotificationPreferences,
      title: 'Streak Celebrations',
      description: 'Motivational streak milestones',
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      example: "🔥 3-day streak, let's go!"
    },
    {
      key: 'progressUpdates' as keyof NotificationPreferences,
      title: 'Achievement Alerts',
      description: 'Weekly targets and milestones',
      icon: <TrendingUp className="w-5 h-5 text-pink-500" />,
      example: "You've hit your weekly target — amazing!"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Notifications</h2>
        <p className="text-gray-600">Stay motivated with personalized reminders and celebrations</p>
      </div>

      <div className="space-y-4">
        {notificationTypes.map((type, index) => (
          <motion.div
            key={type.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{type.title}</h3>
                        {preferences[type.key] && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500 italic">"{type.example}"</p>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[type.key]}
                    onCheckedChange={() => handleToggle(type.key)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-semibold text-purple-900">Smart Timing</h3>
              <p className="text-sm text-purple-700">
                Notifications are intelligently timed based on your activity patterns and won't interrupt your workouts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};