import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit3, Wand2, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkoutEdit {
  date: string;
  workoutType: string;
  duration: number;
  notes?: string;
}

interface AICalendarEditorProps {
  onScheduleUpdate: (edits: WorkoutEdit[]) => void;
  currentSchedule?: any;
}

export const AICalendarEditor: React.FC<AICalendarEditorProps> = ({
  onScheduleUpdate,
  currentSchedule
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editRequest, setEditRequest] = useState('');
  const [pendingEdits, setPendingEdits] = useState<WorkoutEdit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const workoutTypes = [
    'HIIT Cardio', 'Upper Body Strength', 'Lower Body Power', 
    'Full Body Circuit', 'Yoga & Flexibility', 'Core Training',
    'Cardio Burn', 'Strength Training', 'Active Recovery', 'Rest Day'
  ];

  const generateAIEdits = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/edit-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: editRequest,
          currentSchedule,
          context: 'schedule_modification'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPendingEdits(data.edits || []);
      } else {
        // Fallback: parse simple requests
        const fallbackEdits = parseSimpleRequest(editRequest);
        setPendingEdits(fallbackEdits);
      }
    } catch (error) {
      // Fallback parsing
      const fallbackEdits = parseSimpleRequest(editRequest);
      setPendingEdits(fallbackEdits);
    }
    setIsGenerating(false);
  };

  const parseSimpleRequest = (request: string): WorkoutEdit[] => {
    const edits: WorkoutEdit[] = [];
    const today = new Date();
    
    // Simple parsing for common requests
    if (request.toLowerCase().includes('more hiit')) {
      edits.push({
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        workoutType: 'HIIT Cardio',
        duration: 30,
        notes: 'Added extra HIIT session as requested'
      });
    } else if (request.toLowerCase().includes('rest day')) {
      edits.push({
        date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        workoutType: 'Rest Day',
        duration: 0,
        notes: 'Added rest day for recovery'
      });
    } else if (request.toLowerCase().includes('longer workout')) {
      edits.push({
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        workoutType: 'Full Body Circuit',
        duration: 60,
        notes: 'Extended workout duration'
      });
    }
    
    return edits;
  };

  const addManualEdit = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setPendingEdits(prev => [...prev, {
      date: tomorrow.toISOString().split('T')[0],
      workoutType: 'HIIT Cardio',
      duration: 30,
      notes: ''
    }]);
  };

  const updateEdit = (index: number, field: keyof WorkoutEdit, value: string | number) => {
    setPendingEdits(prev => prev.map((edit, i) => 
      i === index ? { ...edit, [field]: value } : edit
    ));
  };

  const removeEdit = (index: number) => {
    setPendingEdits(prev => prev.filter((_, i) => i !== index));
  };

  const applyEdits = () => {
    onScheduleUpdate(pendingEdits);
    setPendingEdits([]);
    setEditRequest('');
    setIsOpen(false);
  };

  const getDifficultyColor = (workoutType: string) => {
    if (workoutType.includes('HIIT') || workoutType.includes('Power')) return 'bg-red-100 text-red-800';
    if (workoutType.includes('Strength') || workoutType.includes('Circuit')) return 'bg-orange-100 text-orange-800';
    if (workoutType.includes('Yoga') || workoutType.includes('Recovery')) return 'bg-green-100 text-green-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Schedule with AI
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            AI Schedule Editor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* AI Request Input */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Tell AI how to modify your schedule:</h3>
            <Textarea
              placeholder="E.g., 'Add more HIIT workouts this week', 'I need a rest day tomorrow', 'Make my workouts longer'"
              value={editRequest}
              onChange={(e) => setEditRequest(e.target.value)}
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button 
                onClick={generateAIEdits}
                disabled={!editRequest.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Changes'}
              </Button>
              <Button variant="outline" onClick={addManualEdit}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Edit
              </Button>
            </div>
          </Card>

          {/* Pending Edits */}
          {pendingEdits.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Pending Changes:</h3>
              <div className="space-y-3">
                {pendingEdits.map((edit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        <Input
                          type="date"
                          value={edit.date}
                          onChange={(e) => updateEdit(index, 'date', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Workout Type</label>
                        <select
                          value={edit.workoutType}
                          onChange={(e) => updateEdit(index, 'workoutType', e.target.value)}
                          className="mt-1 w-full p-2 border rounded-md"
                        >
                          {workoutTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                        <Input
                          type="number"
                          min="0"
                          max="120"
                          value={edit.duration}
                          onChange={(e) => updateEdit(index, 'duration', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <Badge className={getDifficultyColor(edit.workoutType)}>
                        {edit.workoutType}
                      </Badge>
                      <span className="text-sm text-gray-600">{edit.duration} minutes</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEdit(index)}
                        className="ml-auto text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {edit.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{edit.notes}</p>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button 
                  onClick={applyEdits}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
                <Button variant="outline" onClick={() => setPendingEdits([])}>
                  Clear All
                </Button>
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};