import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Calendar, Target, Trophy, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-v2";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Helper function to format dates safely
const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
};

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  goal: z.string().optional(),
  trainingType: z.string().optional(),
  coachingStyle: z.string().optional(),
  weeklyGoalWorkouts: z.number().min(1).max(7),
  weeklyGoalMinutes: z.number().min(30).max(1000),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"personal" | "goals" | "preferences">("personal");
  
  // Personal info form schema
  const personalInfoSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    age: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    fitnessLevel: z.string().optional(),
    injuries: z.string().optional(),
    emergencyContact: z.string().optional(),
  });
  
  type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
  
  const personalForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      age: "",
      height: "",
      weight: "",
      fitnessLevel: "",
      injuries: "",
      emergencyContact: "",
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      goal: user?.goal || "",
      trainingType: user?.trainingType || "",
      coachingStyle: user?.coachingStyle || "",
      weeklyGoalWorkouts: user?.weeklyGoalWorkouts || 3,
      weeklyGoalMinutes: user?.weeklyGoalMinutes || 150,
    },
  });

  // Fetch user stats
  const { data: userStats } = useQuery<{
    totalWorkouts: number;
    thisWeekWorkouts: number;
    totalMinutes: number;
    thisWeekMinutes: number;
  }>({
    queryKey: ['/api/user-stats', user?.id],
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: ProfileFormData) => {
      const res = await apiRequest("PUT", "/api/user/profile", profileData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  });

  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: PersonalInfoFormData) => {
      const res = await apiRequest("PUT", "/api/user/personal-info", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Personal Information Updated",
        description: "Your personal information has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update personal information.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPersonalInfoSubmit = (data: PersonalInfoFormData) => {
    updatePersonalInfoMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "goals", label: "Fitness Goals", icon: Target },
    { id: "preferences", label: "Preferences", icon: Settings },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">User Profile</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <CardTitle>{user?.name}</CardTitle>
              <p className="text-sm text-gray-600">{user?.email}</p>
              {user?.trialEndsAt && (
                <Badge variant="secondary" className="mt-2">
                  Trial expires {formatDate(user.trialEndsAt)}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member since:</span>
                  <span>{user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}</span>
                </div>
                <Separator />
                
                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-sm">Workouts</span>
                    </div>
                    <Badge variant="outline">{userStats?.totalWorkouts || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-sm">This Week</span>
                    </div>
                    <Badge variant="outline">{userStats?.thisWeekWorkouts || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm">Minutes</span>
                    </div>
                    <Badge variant="outline">{userStats?.totalMinutes || 0}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="mt-4">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(tab.id as any)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </Button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              {activeTab === "personal" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Physical Information Form */}
                    <div className="space-y-4">
                      <Form {...personalForm}>
                        <form onSubmit={personalForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={personalForm.control}
                              name="age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter your age" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={personalForm.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Height</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 5'8 or 172cm" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={personalForm.control}
                              name="weight"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Weight</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., 150 lbs or 68 kg" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={personalForm.control}
                              name="fitnessLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fitness Level</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select your fitness level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="beginner">Beginner</SelectItem>
                                      <SelectItem value="intermediate">Intermediate</SelectItem>
                                      <SelectItem value="advanced">Advanced</SelectItem>
                                      <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={personalForm.control}
                              name="emergencyContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emergency Contact</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Name and phone number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={personalForm.control}
                            name="injuries"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Injuries or Medical Conditions</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="List any injuries, medical conditions, or physical limitations we should know about..."
                                    rows={3}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={updatePersonalInfoMutation.isPending}
                          >
                            {updatePersonalInfoMutation.isPending ? "Saving..." : "Save Personal Information"}
                          </Button>
                        </form>
                      </Form>
                    </div>

                    <div>
                      <Label>Smart Notifications</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">Workout Reminders</span>
                            <p className="text-xs text-gray-500">30 mins before scheduled workouts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">Streak Celebrations</span>
                            <p className="text-xs text-gray-500">Motivational milestone alerts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">Hydration Reminders</span>
                            <p className="text-xs text-gray-500">Stay hydrated throughout the day</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <span className="text-sm font-medium">Achievement Alerts</span>
                            <p className="text-xs text-gray-500">Weekly targets and badges</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fitness Goals */}
              {activeTab === "goals" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Fitness Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Fitness Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your primary goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lose-weight">Lose Weight</SelectItem>
                              <SelectItem value="gain-muscle">Build Muscle</SelectItem>
                              <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                              <SelectItem value="improve-flexibility">Increase Flexibility</SelectItem>
                              <SelectItem value="general-fitness">General Fitness</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weeklyGoalWorkouts"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weekly Workout Goal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="7"
                                placeholder="3"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="weeklyGoalMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weekly Minutes Goal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="30"
                                max="1000"
                                placeholder="150"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label>Current Progress</Label>
                      <div className="mt-2 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">This Week's Workouts</span>
                          <span className="font-medium">
                            {userStats?.thisWeekWorkouts || 0} / {user?.weeklyGoalWorkouts || 3}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((userStats?.thisWeekWorkouts || 0) / (user?.weeklyGoalWorkouts || 3)) * 100)}%` 
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">This Week's Minutes</span>
                          <span className="font-medium">
                            {userStats?.thisWeekMinutes || 0} / {user?.weeklyGoalMinutes || 150}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, ((userStats?.thisWeekMinutes || 0) / (user?.weeklyGoalMinutes || 150)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Preferences */}
              {activeTab === "preferences" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Training Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="trainingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Training Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select training type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="strength">Strength Training</SelectItem>
                                <SelectItem value="cardio">Cardio</SelectItem>
                                <SelectItem value="yoga">Yoga</SelectItem>
                                <SelectItem value="calisthenics">Bodyweight</SelectItem>
                                <SelectItem value="mixed">Mixed Training</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="coachingStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coaching Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select coaching style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="motivational">Motivational</SelectItem>
                                <SelectItem value="calm">Calm & Supportive</SelectItem>
                                <SelectItem value="challenging">Challenging</SelectItem>
                                <SelectItem value="educational">Educational</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <Label>Current Coach</Label>
                      <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user?.selectedCoach?.charAt(0).toUpperCase() || 'C'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium capitalize">
                              {user?.selectedCoach?.replace('-', ' ') || 'No coach selected'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {user?.coachingStyle || 'Default coaching style'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="px-8"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}