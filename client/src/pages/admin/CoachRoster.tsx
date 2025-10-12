import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Coach {
  id: string;
  name: string;
  role: string;
  specialty: string;
  description: string;
  icon: string;
  gender: "male" | "female";
}

// Extended coaches roster from our expanded selection
const coachesRoster: Coach[] = [
  // Strength Training Specialists
  {
    id: "max-stone",
    name: "Max Stone",
    role: "Strength Training Specialist",
    specialty: "Powerlifting, Muscle Building",
    description: "Max is a powerhouse when it comes to building muscle and increasing strength. With years of experience in powerlifting and bodybuilding, he's here to push you to new limits and help you gain serious strength.",
    icon: "fa-dumbbell",
    gender: "male"
  },
  {
    id: "alexis-steel",
    name: "Alexis Steel",
    role: "Strength Training Specialist",
    specialty: "Functional Fitness, Muscle Growth",
    description: "Alexis believes strength is a mindset. With a background in both bodybuilding and functional fitness, she's ready to challenge you to exceed your goals with a combination of heavy lifting and muscle-focused workouts.",
    icon: "fa-dumbbell",
    gender: "female"
  },
  // Cardio and Endurance Specialists
  {
    id: "ethan-dash",
    name: "Ethan Dash",
    role: "Cardio and Endurance Specialist",
    specialty: "Running, HIIT, Stamina Building",
    description: "Ethan is all about pushing your limits, whether it's with high-intensity interval training or long-distance running. He'll help you build endurance and take your cardio performance to new heights.",
    icon: "fa-heartbeat",
    gender: "male"
  },
  {
    id: "zoey-blaze",
    name: "Zoey Blaze",
    role: "Cardio and Endurance Specialist",
    specialty: "Running, HIIT, Endurance Training",
    description: "Zoey's passion is speed and stamina. A former track and field athlete, she's dedicated to helping you improve your cardio performance through high-intensity and endurance-focused workouts.",
    icon: "fa-fire",
    gender: "female"
  },
  // Yoga and Flexibility Specialists
  {
    id: "kai-rivers",
    name: "Kai Rivers",
    role: "Yoga and Flexibility Specialist",
    specialty: "Yoga, Mobility, Flexibility",
    description: "Kai brings a calming yet powerful approach to flexibility and mobility. With years of experience in yoga, he'll guide you through every stretch and help you achieve deep flexibility and mindful movements.",
    icon: "fa-peace",
    gender: "male"
  },
  {
    id: "lila-sage",
    name: "Lila Sage",
    role: "Yoga and Flexibility Specialist",
    specialty: "Yoga, Mindfulness, Stretching",
    description: "Lila is a yoga and mindfulness expert who believes in the power of breath and flexibility. She'll guide you through peaceful and restorative yoga routines to help reduce stress and improve your flexibility.",
    icon: "fa-om",
    gender: "female"
  },
  // Calisthenics and Bodyweight Specialists
  {
    id: "leo-cruz",
    name: "Leo Cruz",
    role: "Calisthenics and Bodyweight Specialist",
    specialty: "Bodyweight Training, Functional Strength",
    description: "Leo is a calisthenics expert with a passion for functional bodyweight training. From push-ups to pull-ups, he'll help you master the art of using your body to get stronger, leaner, and more athletic.",
    icon: "fa-running",
    gender: "male"
  },
  {
    id: "maya-flex",
    name: "Maya Flex",
    role: "Calisthenics and Bodyweight Specialist",
    specialty: "Calisthenics, Core Strength",
    description: "Maya's philosophy is simple: bodyweight training is all about mastering your own body. With a background in calisthenics and functional fitness, she'll guide you through exercises that build strength and flexibility.",
    icon: "fa-child",
    gender: "female"
  },
  // Nutrition and Wellness Specialists
  {
    id: "nate-green",
    name: "Nate Green",
    role: "Nutrition and Wellness Specialist",
    specialty: "Nutrition, Performance Optimization",
    description: "Nate's focus is on helping you achieve your fitness goals through proper nutrition. As a certified nutritionist, he offers practical meal plans and tips to fuel your body, recover efficiently, and optimize performance.",
    icon: "fa-apple-alt",
    gender: "male"
  },
  {
    id: "sophie-gold",
    name: "Sophie Gold",
    role: "Nutrition and Wellness Specialist",
    specialty: "Nutrition, Healthy Eating, Fitness Diets",
    description: "Sophie is dedicated to helping you nourish your body. With expertise in fitness nutrition, she'll provide you with personalized meal plans and wellness tips to ensure you're eating the right foods for maximum energy and recovery.",
    icon: "fa-seedling",
    gender: "female"
  },
  // General Fitness and Motivation Specialists
  {
    id: "dylan-power",
    name: "Dylan Power",
    role: "General Fitness and Motivation Specialist",
    specialty: "Full-Body Fitness, Goal Setting",
    description: "Dylan's philosophy is simple: consistency is key. With a focus on holistic fitness, Dylan provides everything you need to stay motivated and reach your goals—whether it's strength, endurance, or overall health.",
    icon: "fa-bolt",
    gender: "male"
  },
  {
    id: "ava-blaze",
    name: "Ava Blaze",
    role: "General Fitness and Motivation Specialist",
    specialty: "General Fitness, HIIT, Motivation",
    description: "Ava is here to help you reach your fullest potential. Her focus is on combining strength, endurance, and mobility for a full-body fitness approach that ensures all-around progress.",
    icon: "fa-clock",
    gender: "female"
  },
  // Running & Triathlon Specialists
  {
    id: "ryder-swift",
    name: "Ryder Swift",
    role: "Running and Triathlon Specialist",
    specialty: "Long-Distance Running, Triathlon Training",
    description: "Ryder is an endurance athlete who has competed in marathons and triathlons. He's passionate about helping runners and triathletes of all levels improve their speed, endurance, and overall performance.",
    icon: "fa-running",
    gender: "male"
  },
  {
    id: "chloe-fleet",
    name: "Chloe Fleet",
    role: "Running and Triathlon Specialist",
    specialty: "Triathlon, Marathon, Speed Training",
    description: "Chloe is a triathlete and marathon runner who thrives on pushing her body to its limits. She'll help you increase your running stamina, enhance your performance, and optimize your training for any race.",
    icon: "fa-swimming-pool",
    gender: "female"
  }
];

export default function CoachRoster() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  
  const filteredCoaches = filter === 'all' 
    ? coachesRoster 
    : filter === 'male' 
      ? coachesRoster.filter(coach => coach.gender === 'male')
      : filter === 'female'
        ? coachesRoster.filter(coach => coach.gender === 'female')
        : coachesRoster.filter(coach => coach.role.toLowerCase().includes(filter.toLowerCase()));
      
  const specialties = Array.from(new Set(coachesRoster.map(coach => coach.role.split(' ')[0].toLowerCase())));
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Coach Roster</h1>
          <p className="text-gray-600">View and manage the expanded coaches roster</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/generate-coaches">
            <Button variant="outline">
              <i className="fas fa-plus mr-2"></i>
              Generate Coaches
            </Button>
          </Link>
          <Link to="/admin">
            <Button>
              <i className="fas fa-cog mr-2"></i>
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilter('all')}
          className="text-sm"
        >
          All Coaches
        </Button>
        <Button 
          variant={filter === 'male' ? 'default' : 'outline'} 
          onClick={() => setFilter('male')}
          className="text-sm"
        >
          Male Coaches
        </Button>
        <Button 
          variant={filter === 'female' ? 'default' : 'outline'} 
          onClick={() => setFilter('female')}
          className="text-sm"
        >
          Female Coaches
        </Button>
        {specialties.map((specialty) => (
          <Button 
            key={specialty}
            variant={filter === specialty ? 'default' : 'outline'} 
            onClick={() => setFilter(specialty)}
            className="text-sm capitalize"
          >
            {specialty} Specialists
          </Button>
        ))}
      </div>
      
      {/* Coaches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.map((coach) => (
          <Card key={coach.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center ${
                  coach.gender === 'male' ? 'bg-purple-600' : 'bg-purple-600'
                }`}>
                  <i className={`fas ${coach.icon} text-xl`}></i>
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-lg">{coach.name}</h3>
                  <p className="text-sm text-gray-500">{coach.role}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Specialty</div>
                <p className="text-sm text-gray-600">{coach.specialty}</p>
              </div>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Bio</div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {coach.description}
                </p>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Coach Profile",
                      description: `Viewing full profile for ${coach.name}`,
                    });
                  }}
                >
                  <i className="fas fa-user mr-2"></i>
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}