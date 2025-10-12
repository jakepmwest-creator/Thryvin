import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CoachCard from "@/components/ui/coach-card";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const SettingsTab = () => {
  const { user, saveUser, logOut } = useUser();
  const { toast } = useToast();
  
  const [isChangeCoachOpen, setIsChangeCoachOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(user?.selectedCoach);
  
  const [isEditGoalsOpen, setIsEditGoalsOpen] = useState(false);
  const [workoutGoal, setWorkoutGoal] = useState(user?.weeklyGoalWorkouts || 5);
  const [minutesGoal, setMinutesGoal] = useState(user?.weeklyGoalMinutes || 150);
  
  if (!user) return null;
  
  const coachInfo = {
    // Original coaches
    kai: {
      name: "Kai",
      role: "Calisthenics Expert",
      icon: "fa-running",
      colorClass: "coach-kai"
    },
    titan: {
      name: "Titan",
      role: "Strength Coach",
      icon: "fa-dumbbell",
      colorClass: "coach-titan"
    },
    lumi: {
      name: "Lumi",
      role: "Wellness Guide",
      icon: "fa-wind",
      colorClass: "coach-lumi"
    },
    
    // Strength Training Specialists
    "max-stone": {
      name: "Max Stone",
      role: "Strength Specialist",
      icon: "fa-dumbbell",
      colorClass: "bg-purple-600"
    },
    "alexis-steel": {
      name: "Alexis Steel",
      role: "Strength Specialist",
      icon: "fa-dumbbell",
      colorClass: "bg-purple-600"
    },
    
    // Cardio and Endurance Specialists
    "ethan-dash": {
      name: "Ethan Dash",
      role: "Cardio Specialist",
      icon: "fa-heartbeat",
      colorClass: "bg-red-600"
    },
    "zoey-blaze": {
      name: "Zoey Blaze",
      role: "Cardio Specialist",
      icon: "fa-fire",
      colorClass: "bg-orange-600"
    },
    
    // Yoga and Flexibility Specialists
    "kai-rivers": {
      name: "Kai Rivers",
      role: "Yoga Specialist",
      icon: "fa-peace",
      colorClass: "bg-teal-600"
    },
    "lila-sage": {
      name: "Lila Sage",
      role: "Yoga Specialist",
      icon: "fa-om",
      colorClass: "bg-purple-600"
    },
    
    // Calisthenics and Bodyweight Specialists
    "leo-cruz": {
      name: "Leo Cruz",
      role: "Calisthenics Specialist",
      icon: "fa-running",
      colorClass: "bg-purple-600"
    },
    "maya-flex": {
      name: "Maya Flex",
      role: "Calisthenics Specialist",
      icon: "fa-child",
      colorClass: "bg-green-600"
    },
    
    // Nutrition and Wellness Specialists
    "nate-green": {
      name: "Nate Green",
      role: "Nutrition Specialist",
      icon: "fa-apple-alt",
      colorClass: "bg-indigo-600"
    },
    "sophie-gold": {
      name: "Sophie Gold",
      role: "Wellness Specialist",
      icon: "fa-seedling",
      colorClass: "bg-yellow-600"
    },
    
    // General Fitness and Motivation Specialists
    "dylan-power": {
      name: "Dylan Power",
      role: "General Fitness Specialist",
      icon: "fa-bolt",
      colorClass: "bg-gray-600"
    },
    "ava-blaze": {
      name: "Ava Blaze",
      role: "HIIT Specialist",
      icon: "fa-clock",
      colorClass: "bg-red-500"
    },
    
    // Running & Triathlon Specialists
    "ryder-swift": {
      name: "Ryder Swift",
      role: "Running Specialist",
      icon: "fa-running",
      colorClass: "bg-purple-500"
    },
    "chloe-fleet": {
      name: "Chloe Fleet",
      role: "Triathlon Specialist",
      icon: "fa-swimming-pool",
      colorClass: "bg-cyan-600"
    }
  };
  
  const currentCoach = coachInfo[user.selectedCoach as keyof typeof coachInfo] || coachInfo.kai;
  
  const handleChangeCoach = async () => {
    if (selectedCoach === user.selectedCoach) {
      setIsChangeCoachOpen(false);
      return;
    }
    
    try {
      await saveUser({ selectedCoach });
      const coachName = selectedCoach ? coachInfo[selectedCoach as keyof typeof coachInfo]?.name || selectedCoach : '';
      toast({
        title: "Coach Updated",
        description: `You're now training with ${coachName}!`,
      });
      setIsChangeCoachOpen(false);
    } catch (error) {
      console.error("Failed to update coach:", error);
      toast({
        title: "Update Failed",
        description: "Couldn't update your coach. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdateGoals = async () => {
    try {
      await saveUser({
        weeklyGoalWorkouts: workoutGoal,
        weeklyGoalMinutes: minutesGoal
      });
      toast({
        title: "Goals Updated",
        description: "Your weekly goals have been updated.",
      });
      setIsEditGoalsOpen(false);
    } catch (error) {
      console.error("Failed to update goals:", error);
      toast({
        title: "Update Failed",
        description: "Couldn't update your goals. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleUpgrade = () => {
    toast({
      title: "Coming Soon",
      description: "Premium subscriptions will be available soon!",
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {/* Subscription Section */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Your Subscription</h2>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Trial Active</span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          You have {Math.max(0, Math.floor((user.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left in your free trial. Upgrade to continue access to all features.
        </p>
        <Button 
          className="w-full py-6"
          onClick={handleUpgrade}
        >
          Upgrade to Premium
        </Button>
      </div>
      
      {/* Change Coach Section */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h2 className="font-bold mb-3">Your Coach</h2>
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full ${currentCoach.colorClass.startsWith('bg-') ? currentCoach.colorClass : 'bg-' + currentCoach.colorClass} flex-shrink-0 flex items-center justify-center text-white`}>
            <i className={`fas ${currentCoach.icon}`}></i>
          </div>
          <div className="ml-3 flex-1">
            <div className="font-medium">{currentCoach.name}</div>
            <div className="text-sm text-gray-500">{currentCoach.role}</div>
          </div>
          <Dialog open={isChangeCoachOpen} onOpenChange={setIsChangeCoachOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-primary font-medium text-sm">
                Change
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Your Coach</DialogTitle>
                <DialogDescription>
                  Select a new coach to guide your fitness journey.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                {/* Original Coaches */}
                <h3 className="text-sm font-medium text-gray-500 py-1 border-b mb-2">Original Coaches</h3>
                <CoachCard
                  name="Kai"
                  role="Calisthenics Expert"
                  description="Let's master your bodyweight. I'll help you build strength, agility, and control without equipment."
                  icon="fa-running"
                  colorClass="coach-kai"
                  rating={4.7}
                  members="10.2k"
                  isSelected={selectedCoach === "kai"}
                  onSelect={() => setSelectedCoach("kai")}
                  compact
                />
                
                <CoachCard
                  name="Titan"
                  role="Strength Coach"
                  description="Ready to get strong? I'll guide you through structured weight training for optimal gains and power."
                  icon="fa-dumbbell"
                  colorClass="coach-titan"
                  rating={4.9}
                  members="15.8k"
                  isSelected={selectedCoach === "titan"}
                  onSelect={() => setSelectedCoach("titan")}
                  compact
                />
                
                <CoachCard
                  name="Lumi"
                  role="Wellness Guide"
                  description="Balance is key. I'll help you improve flexibility, mindfulness, and overall wellness through holistic practices."
                  icon="fa-wind"
                  colorClass="coach-lumi"
                  rating={4.5}
                  members="8.7k"
                  isSelected={selectedCoach === "lumi"}
                  onSelect={() => setSelectedCoach("lumi")}
                  compact
                />
                
                {/* Strength Training Specialists */}
                <h3 className="text-sm font-medium text-gray-500 py-1 border-b mt-6 mb-2">Strength Training Specialists</h3>
                <CoachCard
                  name="Max Stone"
                  role="Strength Training Specialist"
                  description="Powerhouse of muscle building and strength training. Max will push you to lift heavier and progress consistently."
                  icon="fa-dumbbell"
                  colorClass="bg-purple-600"
                  rating={4.9}
                  members="18.2k"
                  isSelected={selectedCoach === "max-stone"}
                  onSelect={() => setSelectedCoach("max-stone")}
                  compact
                />
                
                <CoachCard
                  name="Alexis Steel"
                  role="Strength Training Specialist"
                  description="Expert in functional strength training. Alexis focuses on building practical strength and proper form."
                  icon="fa-dumbbell"
                  colorClass="bg-purple-600"
                  rating={4.8}
                  members="15.7k"
                  isSelected={selectedCoach === "alexis-steel"}
                  onSelect={() => setSelectedCoach("alexis-steel")}
                  compact
                />
                
                {/* Cardio and Endurance Specialists */}
                <h3 className="text-sm font-medium text-gray-500 py-1 border-b mt-6 mb-2">Cardio and Endurance Specialists</h3>
                <CoachCard
                  name="Ethan Dash"
                  role="Cardio and Endurance Specialist"
                  description="HIIT and cardio expert who will help you build stamina, burn calories, and increase your endurance."
                  icon="fa-heartbeat"
                  colorClass="bg-red-600"
                  rating={4.7}
                  members="14.9k"
                  isSelected={selectedCoach === "ethan-dash"}
                  onSelect={() => setSelectedCoach("ethan-dash")}
                  compact
                />
                
                <CoachCard
                  name="Zoey Blaze"
                  role="Cardio and Endurance Specialist"
                  description="Former track athlete focused on high-energy workouts to improve your speed, stamina and cardiovascular health."
                  icon="fa-fire"
                  colorClass="bg-orange-600"
                  rating={4.8}
                  members="12.5k"
                  isSelected={selectedCoach === "zoey-blaze"}
                  onSelect={() => setSelectedCoach("zoey-blaze")}
                  compact
                />
                
                {/* Specialists in other areas with higher ratings */}
                <h3 className="text-sm font-medium text-gray-500 py-1 border-b mt-6 mb-2">Featured Specialists</h3>
                <CoachCard
                  name="Maya Flex"
                  role="Calisthenics Specialist"
                  description="Bodyweight training expert focused on building impressive strength using just your own body weight."
                  icon="fa-child"
                  colorClass="bg-green-600"
                  rating={4.9}
                  members="11.8k"
                  isSelected={selectedCoach === "maya-flex"}
                  onSelect={() => setSelectedCoach("maya-flex")}
                  compact
                />
                
                <CoachCard
                  name="Sophie Gold"
                  role="Nutrition and Wellness Specialist"
                  description="Holistic wellness expert who combines nutrition knowledge with mindful fitness approaches."
                  icon="fa-seedling"
                  colorClass="bg-yellow-600"
                  rating={4.8}
                  members="9.6k"
                  isSelected={selectedCoach === "sophie-gold"}
                  onSelect={() => setSelectedCoach("sophie-gold")}
                  compact
                />
                
                <CoachCard
                  name="Ryder Swift"
                  role="Running and Triathlon Specialist"
                  description="Endurance athlete who specializes in training runners and triathletes of all levels."
                  icon="fa-running"
                  colorClass="bg-purple-500"
                  rating={4.9}
                  members="13.1k"
                  isSelected={selectedCoach === "ryder-swift"}
                  onSelect={() => setSelectedCoach("ryder-swift")}
                  compact
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsChangeCoachOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleChangeCoach}>
                  Change Coach
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Goals Section */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h2 className="font-bold mb-3">Your Goals</h2>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <div className="text-sm">Current Goal</div>
            <Button variant="ghost" className="text-primary text-xs font-medium p-0 h-6">
              Edit
            </Button>
          </div>
          <div className="font-medium capitalize">{user.goal.replace("_", " ")}</div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <div className="text-sm">Weekly Target</div>
            <Dialog open={isEditGoalsOpen} onOpenChange={setIsEditGoalsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-primary text-xs font-medium p-0 h-6">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Weekly Goals</DialogTitle>
                  <DialogDescription>
                    Set your weekly workout and training minute goals.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="workouts" className="text-right">
                      Workouts
                    </Label>
                    <Input
                      id="workouts"
                      type="number"
                      min="1"
                      max="7"
                      value={workoutGoal}
                      onChange={(e) => setWorkoutGoal(parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="minutes" className="text-right">
                      Minutes
                    </Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="30"
                      max="600"
                      step="10"
                      value={minutesGoal}
                      onChange={(e) => setMinutesGoal(parseInt(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditGoalsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateGoals}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="font-medium">
            {user.weeklyGoalWorkouts} workouts • {user.weeklyGoalMinutes} minutes
          </div>
        </div>
      </div>
      
      {/* Account Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>Notifications</div>
          <Switch id="notifications" />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>Account Details</div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>Privacy Settings</div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>Help & Support</div>
          <i className="fas fa-chevron-right text-gray-400"></i>
        </div>
        <Link to="/admin" className="block py-3 border-b border-gray-100">
          <div className="flex items-center justify-between text-primary">
            <div className="flex items-center">
              <i className="fas fa-tools mr-2"></i>
              <span>Admin Dashboard</span>
            </div>
            <i className="fas fa-chevron-right text-primary text-sm"></i>
          </div>
        </Link>
        <div className="flex items-center justify-between py-3">
          <Button 
            variant="ghost" 
            className="text-red-500 p-0"
            onClick={logOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
