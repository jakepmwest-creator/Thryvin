import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Target, Zap, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Workout {
  id: number;
  name: string;
  type: string;
  duration: number;
  difficulty: string;
  description: string;
  targetMuscles: string[];
  equipment: string[];
}

interface WorkoutSelectorProps {
  onBack: () => void;
  onSelectWorkout: (workoutType: string) => void;
}

export function WorkoutSelector({ onBack, onSelectWorkout }: WorkoutSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch available workouts
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ['/api/workouts'],
  });

  const workoutTypes = [
    {
      type: "strength",
      name: "Strength Training",
      description: "Build muscle and increase strength",
      icon: "💪",
      color: "bg-red-100 border-red-200 text-red-800"
    },
    {
      type: "cardio",
      name: "Cardio",
      description: "Improve cardiovascular health",
      icon: "❤️",
      color: "bg-purple-100 border-blue-200 text-blue-800"
    },
    {
      type: "yoga",
      name: "Yoga & Flexibility",
      description: "Enhance flexibility and mindfulness",
      icon: "🧘",
      color: "bg-green-100 border-green-200 text-green-800"
    },
    {
      type: "calisthenics",
      name: "Bodyweight",
      description: "No equipment needed workouts",
      icon: "🤸",
      color: "bg-purple-100 border-purple-200 text-purple-800"
    },
    {
      type: "mixed",
      name: "Full Body",
      description: "Complete workout experience",
      icon: "🔥",
      color: "bg-orange-100 border-orange-200 text-orange-800"
    }
  ];

  const filteredWorkouts = workouts?.filter(workout => 
    selectedType ? workout.type === selectedType : true
  ) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Choose Your Workout</h1>
        <div></div>
      </div>

      {/* Workout Type Filter */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Workout Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            className="h-auto p-4 flex flex-col items-center space-y-2"
          >
            <span className="text-2xl">🏋️</span>
            <span className="text-sm">All Types</span>
          </Button>
          {workoutTypes.map((type) => (
            <Button
              key={type.type}
              variant={selectedType === type.type ? "default" : "outline"}
              onClick={() => setSelectedType(type.type)}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <span className="text-2xl">{type.icon}</span>
              <span className="text-sm text-center">{type.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Available Workouts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Available Workouts
          {selectedType && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({workoutTypes.find(t => t.type === selectedType)?.name})
            </span>
          )}
        </h2>

        {filteredWorkouts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-4">No workouts available for the selected type.</p>
            <Button onClick={() => setSelectedType(null)} variant="outline">
              View All Workouts
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <Badge className={getDifficultyColor(workout.difficulty)}>
                      {workout.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{workout.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{workout.duration} min</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1 text-gray-500" />
                        <span className="capitalize">{workout.type}</span>
                      </div>
                    </div>

                    {workout.targetMuscles && workout.targetMuscles.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Zap className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="text-sm font-medium">Target Muscles:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {workout.targetMuscles.slice(0, 3).map((muscle, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                          {workout.targetMuscles.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workout.targetMuscles.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {workout.equipment && workout.equipment.length > 0 && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Users className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="text-sm font-medium">Equipment:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {workout.equipment.slice(0, 2).map((item, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {workout.equipment.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{workout.equipment.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => onSelectWorkout(workout.type)}
                    className="w-full mt-4"
                  >
                    Start Workout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Options */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Quick Start Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => onSelectWorkout("strength")}
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4 h-auto"
            >
              <span className="text-xl">💪</span>
              <div className="text-left">
                <div className="font-medium">Quick Strength</div>
                <div className="text-xs text-gray-500">15 min</div>
              </div>
            </Button>
            <Button
              onClick={() => onSelectWorkout("cardio")}
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4 h-auto"
            >
              <span className="text-xl">🏃</span>
              <div className="text-left">
                <div className="font-medium">Quick Cardio</div>
                <div className="text-xs text-gray-500">10 min</div>
              </div>
            </Button>
            <Button
              onClick={() => onSelectWorkout("yoga")}
              variant="outline"
              className="flex items-center justify-center space-x-2 p-4 h-auto"
            >
              <span className="text-xl">🧘</span>
              <div className="text-left">
                <div className="font-medium">Quick Stretch</div>
                <div className="text-xs text-gray-500">5 min</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}