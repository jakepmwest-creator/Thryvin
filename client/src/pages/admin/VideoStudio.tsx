import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Upload, Download, Play, Pause, Settings } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VideoProject {
  id: string;
  exerciseName: string;
  description: string;
  prompt: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  previewImage?: string;
  createdAt: string;
}

export default function VideoStudio() {
  const { toast } = useToast();
  const [exerciseName, setExerciseName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('professional');

  const { data: projects = [] } = useQuery<VideoProject[]>({
    queryKey: ['/api/admin/video-projects'],
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: {
      exerciseName: string;
      description: string;
      duration: number;
      style: string;
    }) => {
      const res = await apiRequest('POST', '/api/admin/generate-exercise-video', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-projects'] });
      toast({
        title: "Video Generation Started",
        description: "Your exercise video is being generated",
      });
      // Reset form
      setExerciseName('');
      setDescription('');
      setDuration(30);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!exerciseName.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide exercise name and description",
        variant: "destructive",
      });
      return;
    }

    generateVideoMutation.mutate({
      exerciseName,
      description,
      duration,
      style
    });
  };

  const presetExercises = [
    {
      name: "Push-ups",
      description: "Upper body exercise targeting chest, shoulders, and triceps. Start in plank position, lower body to ground maintaining straight line, then push back up."
    },
    {
      name: "Squats",
      description: "Lower body exercise targeting quads, glutes, and hamstrings. Stand with feet shoulder-width apart, lower by bending knees and hips, keep chest up."
    },
    {
      name: "Burpees",
      description: "Full-body exercise combining squat, plank, push-up, and jump. Start standing, drop to squat, jump back to plank, do push-up, jump forward, jump up."
    },
    {
      name: "Plank",
      description: "Core strengthening exercise. Hold body in straight line from head to heels, supported on forearms and toes, engage core muscles."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Exercise Video Studio</h1>
              <p className="text-gray-500">Generate professional workout demonstration videos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Video Generator */}
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <span>Generate New Video</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Quick Presets */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {presetExercises.map((exercise) => (
                    <Button
                      key={exercise.name}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start"
                      onClick={() => {
                        setExerciseName(exercise.name);
                        setDescription(exercise.description);
                      }}
                    >
                      {exercise.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <Input
                  id="exerciseName"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g., Push-ups, Squats, Burpees"
                />
              </div>

              <div>
                <Label htmlFor="description">Exercise Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of proper form, movement, and technique..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="45">45 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style">Video Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional Gym</SelectItem>
                      <SelectItem value="home">Home Workout</SelectItem>
                      <SelectItem value="outdoor">Outdoor Setting</SelectItem>
                      <SelectItem value="studio">Clean Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateVideoMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              >
                {generateVideoMutation.isPending ? 'Generating...' : 'Generate Video'}
              </Button>
            </CardContent>
          </Card>

          {/* Video Library */}
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-green-500" />
                <span>Video Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No videos generated yet</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div key={project.id} className="border rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{project.exerciseName}</h3>
                          <p className="text-sm text-gray-500 mt-1">{project.description.slice(0, 80)}...</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>{project.duration}s</span>
                            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs ${
                            project.status === 'completed' ? 'bg-green-100 text-green-600' :
                            project.status === 'processing' ? 'bg-purple-100 text-purple-600' :
                            project.status === 'failed' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {project.status}
                          </div>
                          {project.status === 'completed' && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {project.previewImage && (
                        <div className="mt-3">
                          <img 
                            src={project.previewImage} 
                            alt={project.exerciseName}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}