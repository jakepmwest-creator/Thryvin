import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { 
  CalendarClock, 
  Weight, 
  Dumbbell, 
  Gauge, 
  TargetIcon, 
  Save
} from 'lucide-react';

interface WorkoutCustomizerProps {
  defaultMinutes?: number;
  defaultIntensity?: number;
  defaultEquipment?: string[];
  defaultFocus?: string[];
  onSave: (options: WorkoutOptions) => void;
  className?: string;
}

export interface WorkoutOptions {
  minutes: number;
  intensity: number;
  equipment: string[];
  focusAreas: string[];
  includeWarmup: boolean;
  includeCooldown: boolean;
}

const AVAILABLE_EQUIPMENT = [
  'No Equipment', 'Dumbbells', 'Kettlebells', 'Resistance Bands', 
  'Pull-up Bar', 'Bench', 'Barbell', 'Yoga Mat', 'Stability Ball'
];

const FOCUS_AREAS = [
  'Upper Body', 'Lower Body', 'Core', 'Back', 'Chest', 
  'Arms', 'Shoulders', 'Legs', 'Cardio', 'Flexibility'
];

export function WorkoutCustomizer({
  defaultMinutes = 30,
  defaultIntensity = 5,
  defaultEquipment = ['No Equipment'],
  defaultFocus = ['Upper Body', 'Core'],
  onSave,
  className
}: WorkoutCustomizerProps) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [intensity, setIntensity] = useState(defaultIntensity);
  const [equipment, setEquipment] = useState<string[]>(defaultEquipment);
  const [focusAreas, setFocusAreas] = useState<string[]>(defaultFocus);
  const [includeWarmup, setIncludeWarmup] = useState(true);
  const [includeCooldown, setIncludeCooldown] = useState(true);

  const handleSave = () => {
    onSave({
      minutes,
      intensity,
      equipment,
      focusAreas,
      includeWarmup,
      includeCooldown
    });
  };

  const toggleEquipment = (item: string) => {
    if (equipment.includes(item)) {
      // If "No Equipment" is being removed and it's the only item, don't remove it
      if (item === 'No Equipment' && equipment.length === 1) {
        return;
      }
      
      // If another item is being added and "No Equipment" is currently selected, remove "No Equipment"
      if (item !== 'No Equipment' && equipment.includes('No Equipment')) {
        setEquipment([item]);
      } else {
        setEquipment(equipment.filter(e => e !== item));
      }
    } else {
      // If "No Equipment" is being added, clear all other equipment
      if (item === 'No Equipment') {
        setEquipment(['No Equipment']);
      } else {
        // If another item is being added, make sure "No Equipment" is removed
        const newEquipment = equipment.filter(e => e !== 'No Equipment');
        setEquipment([...newEquipment, item]);
      }
    }
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(focusAreas.includes(area)
      ? focusAreas.filter(a => a !== area)
      : [...focusAreas, area]
    );
  };

  const getIntensityLabel = (value: number) => {
    const labels = ['Very Easy', 'Easy', 'Moderate', 'Challenging', 'Hard', 'Very Hard', 'Intense', 'Very Intense', 'Expert', 'Elite'];
    return labels[Math.min(Math.floor(value / 1.1), 9)];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <TargetIcon className="mr-2 h-5 w-5" />
          Customize Your Workout
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Duration Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="flex items-center">
                <CalendarClock className="h-4 w-4 mr-2" />
                Duration
              </Label>
              <span className="text-sm font-medium">{minutes} min</span>
            </div>
            <Slider
              value={[minutes]}
              min={5}
              max={60}
              step={5}
              onValueChange={(values) => setMinutes(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 min</span>
              <span>60 min</span>
            </div>
          </div>
          
          {/* Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="flex items-center">
                <Gauge className="h-4 w-4 mr-2" />
                Intensity
              </Label>
              <span className="text-sm font-medium">{getIntensityLabel(intensity)}</span>
            </div>
            <Slider
              value={[intensity]}
              min={1}
              max={10}
              step={1}
              onValueChange={(values) => setIntensity(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Beginner</span>
              <span>Elite</span>
            </div>
          </div>
          
          {/* Equipment Selection */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Dumbbell className="h-4 w-4 mr-2" />
              Equipment
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_EQUIPMENT.map((item) => (
                <Badge
                  key={item}
                  variant={equipment.includes(item) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleEquipment(item)}
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Focus Areas */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Weight className="h-4 w-4 mr-2" />
              Focus Areas
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FOCUS_AREAS.map((area) => (
                <Badge
                  key={area}
                  variant={focusAreas.includes(area) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleFocusArea(area)}
                >
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Additional Options */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="warmup" className="cursor-pointer">Include 5-min warmup</Label>
              <Switch
                id="warmup"
                checked={includeWarmup}
                onCheckedChange={setIncludeWarmup}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cooldown" className="cursor-pointer">Include 5-min cooldown</Label>
              <Switch
                id="cooldown"
                checked={includeCooldown}
                onCheckedChange={setIncludeCooldown}
              />
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Workout Preferences
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}