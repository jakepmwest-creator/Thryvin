import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CircularProgressRing, FitnessRingColors, FitnessRingsExample } from '../components/ui/CircularProgressRing';
import { FitnessRings, CompactFitnessRings } from '../components/FitnessRings';
import { ArrowLeft, Palette, Settings, Activity } from 'lucide-react';

interface ProgressRingsDemoProps {
  onBack?: () => void;
}

export default function ProgressRingsDemo({ onBack }: ProgressRingsDemoProps) {
  const [customPercentage, setCustomPercentage] = useState([75]);
  const [customColor, setCustomColor] = useState('#FF0080');
  
  const colorOptions = [
    { name: 'Move', color: FitnessRingColors.MOVE },
    { name: 'Exercise', color: FitnessRingColors.EXERCISE },
    { name: 'Stand', color: FitnessRingColors.STAND },
    { name: 'Heart Rate', color: FitnessRingColors.HEART_RATE },
    { name: 'Steps', color: FitnessRingColors.STEPS },
    { name: 'Sleep', color: FitnessRingColors.SLEEP },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Circular Progress Rings</h1>
              <p className="text-gray-600 mt-1">Apple Fitness-style animated progress components</p>
            </div>
          </div>
        </div>

        {/* Demo Section 1: Basic Example */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Basic Fitness Rings Example
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <FitnessRingsExample />
          </CardContent>
        </Card>

        {/* Demo Section 2: Interactive Ring */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Interactive Ring Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col items-center space-y-6">
                <CircularProgressRing
                  color={customColor}
                  percentage={customPercentage[0]}
                  label="Custom Ring"
                  size={140}
                  strokeWidth={10}
                />
                
                <div className="w-full max-w-sm space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Percentage: {customPercentage[0]}%
                    </label>
                    <Slider
                      value={customPercentage}
                      onValueChange={setCustomPercentage}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Color:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorOptions.map((option) => (
                      <Button
                        key={option.name}
                        variant={customColor === option.color ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCustomColor(option.color)}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {option.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <h3 className="font-semibold text-sm text-gray-800 mb-2">Component Usage:</h3>
                  <pre className="text-xs text-gray-600 overflow-x-auto scrollbar-hide">
{`<CircularProgressRing
  color="${customColor}"
  percentage={${customPercentage[0]}}
  label="Custom Ring"
  size={140}
  strokeWidth={10}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Section 3: Different Layouts */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Layout Variations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Standard Layout</h3>
              <FitnessRings
                moveData={{ current: 320, goal: 400 }}
                exerciseData={{ current: 45, goal: 60 }}
                standData={{ current: 8, goal: 12 }}
                layout="horizontal"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Grid Layout</h3>
              <FitnessRings
                moveData={{ current: 580, goal: 600 }}
                exerciseData={{ current: 22, goal: 30 }}
                standData={{ current: 11, goal: 12 }}
                layout="grid"
                size={100}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Compact Layout</h3>
              <CompactFitnessRings
                moveData={{ current: 245, goal: 300 }}
                exerciseData={{ current: 15, goal: 30 }}
                standData={{ current: 6, goal: 12 }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 text-white">
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <div className="prose prose-sm max-w-none">
              <h3>Basic Usage</h3>
              <p>Import and use the CircularProgressRing component:</p>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto scrollbar-hide">
{`import { CircularProgressRing, FitnessRingColors } from '@/components/ui/CircularProgressRing';

<CircularProgressRing
  color={FitnessRingColors.MOVE}
  percentage={75}
  label="Move"
/>`}
              </pre>
              
              <h3>Props</h3>
              <ul>
                <li><strong>color:</strong> Hex color or CSS color name for the ring</li>
                <li><strong>percentage:</strong> Progress value from 0-100</li>
                <li><strong>label:</strong> Text displayed below the ring</li>
                <li><strong>size:</strong> Optional size in pixels (default: 120)</li>
                <li><strong>strokeWidth:</strong> Optional thickness of the ring (default: 8)</li>
                <li><strong>animationDuration:</strong> Optional animation time in seconds (default: 1.5)</li>
                <li><strong>animationDelay:</strong> Optional delay before animation starts (default: 0)</li>
              </ul>
              
              <h3>Fitness Rings Component</h3>
              <p>For complete fitness tracking, use the FitnessRings component:</p>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto scrollbar-hide">
{`import { FitnessRings } from '@/components/FitnessRings';

<FitnessRings
  moveData={{ current: 420, goal: 500 }}
  exerciseData={{ current: 25, goal: 30 }}
  standData={{ current: 9, goal: 12 }}
  layout="horizontal"
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}