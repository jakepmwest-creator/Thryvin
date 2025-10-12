import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, TrendingUp, Activity, Award, Calendar, Dumbbell } from 'lucide-react';
import { FitnessRings, CompactFitnessRings } from '../FitnessRings';
import { CircularProgressRing, FitnessRingColors } from '../ui/CircularProgressRing';

export default function StatsTab() {
  return (
    <div className="flex-1 overflow-auto p-4 bg-white">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Fitness Rings */}
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 pb-4 pt-4 px-6">
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-6 px-6">
            <FitnessRings
              moveData={{ current: 420, goal: 500 }}
              exerciseData={{ current: 25, goal: 30 }}
              standData={{ current: 9, goal: 12 }}
              layout="grid"
              size={100}
            />
          </CardContent>
        </Card>
        
        {/* Individual Progress Metrics */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 pb-3 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-white">Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex justify-between items-center">
                <CircularProgressRing
                  color={FitnessRingColors.EXERCISE}
                  percentage={78}
                  label="Workouts"
                  size={80}
                  strokeWidth={6}
                />
                <CircularProgressRing
                  color={FitnessRingColors.HEART_RATE}
                  percentage={65}
                  label="Intensity"
                  size={80}
                  strokeWidth={6}
                  animationDelay={0.2}
                />
                <CircularProgressRing
                  color={FitnessRingColors.STEPS}
                  percentage={92}
                  label="Goals"
                  size={80}
                  strokeWidth={6}
                  animationDelay={0.4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-tr from-purple-500 to-pink-400 pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-white flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Weekly Workouts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-4 px-4">
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold text-gray-800">3/5</div>
                <div className="text-xs text-green-500 bg-green-50 rounded-full px-2 py-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +20%
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-tr from-purple-500 to-purple-400 pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-white flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Training Minutes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-4 px-4">
              <div className="flex justify-between items-center">
                <div className="text-3xl font-bold text-gray-800">125/180</div>
                <div className="text-xs text-green-500 bg-green-50 rounded-full px-2 py-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +15%
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '69%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Trend */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-purple-500" />
            Activity Trend
          </h2>
          
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="h-40 flex items-end justify-between">
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gray-100 rounded-sm w-8 h-16"></div>
                  <span className="text-xs text-gray-500">Mon</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gray-100 rounded-sm w-8 h-8"></div>
                  <span className="text-xs text-gray-500">Tue</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm w-8 h-32"></div>
                  <span className="text-xs text-gray-500">Wed</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gray-100 rounded-sm w-8 h-12"></div>
                  <span className="text-xs text-gray-500">Thu</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm w-8 h-24"></div>
                  <span className="text-xs text-gray-500">Fri</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gray-100 rounded-sm w-8 h-6"></div>
                  <span className="text-xs text-gray-500">Sat</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm w-8 h-20"></div>
                  <span className="text-xs text-gray-500">Sun</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Personal Records */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
            <Award className="mr-2 h-5 w-5 text-purple-500" />
            Recent Personal Records
          </h2>
          
          <div className="space-y-3">
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Dumbbell className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Bench Press</h3>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">175 lbs</div>
                    <div className="text-xs text-green-500 flex items-center justify-end">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +10 lbs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Dumbbell className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Squat</h3>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">225 lbs</div>
                    <div className="text-xs text-green-500 flex items-center justify-end">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +15 lbs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <Dumbbell className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Deadlift</h3>
                      <p className="text-xs text-gray-500">2 weeks ago</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">275 lbs</div>
                    <div className="text-xs text-green-500 flex items-center justify-end">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +25 lbs
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}