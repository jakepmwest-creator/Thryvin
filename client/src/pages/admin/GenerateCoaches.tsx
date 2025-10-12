import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';

interface Coach {
  id: string;
  name: string;
  specialty: string;
  physique: string;
  features: string;
  expression: string;
}

export default function GenerateCoaches() {
  const [generating, setGenerating] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [generatingStatus, setGeneratingStatus] = useState<Record<string, 'idle' | 'generating' | 'done' | 'error'>>({});
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const coaches: Coach[] = [
    // Strength Training Specialists
    {
      id: 'max-stone',
      name: 'Max Stone',
      specialty: 'Strength Training Specialist',
      physique: 'extremely muscular build with very large arms and broad shoulders',
      features: 'short dark hair, strong jawline, wearing a black training shirt',
      expression: 'confident and focused expression'
    },
    {
      id: 'alexis-steel',
      name: 'Alexis Steel',
      specialty: 'Strength Training Specialist',
      physique: 'athletic and muscular build with defined shoulders and arms',
      features: 'medium-length dark hair in a ponytail, wearing a fitted grey top',
      expression: 'determined and strong expression'
    },
    
    // Cardio and Endurance Specialists
    {
      id: 'ethan-dash',
      name: 'Ethan Dash',
      specialty: 'Cardio and Endurance Specialist',
      physique: 'lean and toned runner\'s physique, long and slim muscles',
      features: 'short light brown hair, bright eyes, wearing a red training shirt',
      expression: 'energetic and positive expression'
    },
    {
      id: 'zoey-blaze',
      name: 'Zoey Blaze',
      specialty: 'Cardio and Endurance Specialist',
      physique: 'athletic lean build with toned legs and core',
      features: 'shoulder-length reddish hair, wearing an orange sports top',
      expression: 'bright and energetic expression'
    },
    
    // Yoga and Flexibility Specialists
    {
      id: 'kai-rivers',
      name: 'Kai Rivers',
      specialty: 'Yoga and Flexibility Specialist',
      physique: 'lean and flexible build, not bulky but defined',
      features: 'longer dark hair tied back in a man bun, wearing a teal yoga top',
      expression: 'calm and centered expression'
    },
    {
      id: 'lila-sage',
      name: 'Lila Sage',
      specialty: 'Yoga and Flexibility Specialist',
      physique: 'slender and graceful build with excellent posture',
      features: 'long black hair in a neat braid, wearing a purple yoga outfit',
      expression: 'peaceful and mindful expression'
    },
    
    // Calisthenics and Bodyweight Specialists
    {
      id: 'leo-cruz',
      name: 'Leo Cruz',
      specialty: 'Calisthenics Specialist',
      physique: 'lean and athletic with defined abs and functional muscle',
      features: 'dark curly hair, vibrant smile, wearing a blue sleeveless top',
      expression: 'playful and confident expression'
    },
    {
      id: 'maya-flex',
      name: 'Maya Flex',
      specialty: 'Calisthenics Specialist',
      physique: 'strong and agile physique with visible upper body strength',
      features: 'short pixie haircut, wearing a green workout top',
      expression: 'focused and determined expression'
    },
    
    // Nutrition and Wellness Specialists
    {
      id: 'nate-green',
      name: 'Nate Green',
      specialty: 'Nutrition and Wellness Specialist',
      physique: 'fit but not overly muscular, balanced physique',
      features: 'glasses, medium-length styled hair, wearing a casual olive shirt',
      expression: 'approachable and thoughtful expression'
    },
    {
      id: 'sophie-gold',
      name: 'Sophie Gold',
      specialty: 'Nutrition and Wellness Specialist',
      physique: 'toned but not extremely muscular, healthy balanced look',
      features: 'medium wavy hair with highlights, wearing a yellow top',
      expression: 'warm and nurturing expression'
    },
    
    // General Fitness and Motivation Specialists
    {
      id: 'dylan-power',
      name: 'Dylan Power',
      specialty: 'General Fitness Specialist',
      physique: 'all-around athletic build, balanced muscle development',
      features: 'short cropped hair, bright smile, wearing a gray fitness shirt',
      expression: 'motivating and energetic expression'
    },
    {
      id: 'ava-blaze',
      name: 'Ava Blaze',
      specialty: 'Motivation and HIIT Specialist',
      physique: 'athletic and toned physique with defined muscle',
      features: 'shoulder-length hair with red highlights, wearing a bright red top',
      expression: 'intense and passionate expression'
    },
    
    // Running & Triathlon Specialists
    {
      id: 'ryder-swift',
      name: 'Ryder Swift',
      specialty: 'Running and Triathlon Specialist',
      physique: 'lean runner\'s build with long, slim legs and low body fat',
      features: 'short windswept hair, light stubble, wearing performance gear',
      expression: 'determined and focused expression'
    },
    {
      id: 'chloe-fleet',
      name: 'Chloe Fleet',
      specialty: 'Running and Triathlon Specialist',
      physique: 'extremely lean with toned legs and slim upper body',
      features: 'hair in a sporty ponytail, wearing high-performance running gear',
      expression: 'confident and driven expression'
    }
  ];

  useEffect(() => {
    // Initialize status for all coaches
    const initialStatus: Record<string, 'idle' | 'generating' | 'done' | 'error'> = {};
    coaches.forEach(coach => {
      initialStatus[coach.id] = 'idle';
    });
    setGeneratingStatus(initialStatus);
  }, []);

  const generateCoachImage = async (coach: Coach) => {
    setSelectedCoach(coach);
    setGenerating(true);
    setGeneratingStatus(prev => ({ ...prev, [coach.id]: 'generating' }));
    setNotification(null);
    
    try {
      // Create a detailed 3D coach prompt
      const prompt = `Generate a realistic 3D rendered avatar for a fitness coach named ${coach.name}, who is a ${coach.specialty}. 
      Physical characteristics: ${coach.physique}. 
      Visual features: ${coach.features}. 
      Facial expression: ${coach.expression}.
      Style: Modern, high-quality 3D render with photorealistic textures and professional lighting.
      Focus: Headshot/upper body shot with neutral background.
      Purpose: Profile image for a fitness coaching app.`;
      
      // Call our API endpoint to generate the image
      const response = await fetch('/api/generate-coach-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coachId: coach.id,
          name: coach.name,
          specialty: coach.specialty,
          physique: coach.physique,
          features: coach.features,
          expression: coach.expression
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratingStatus(prev => ({ ...prev, [coach.id]: 'done' }));
        setNotification({ type: 'success', message: `Successfully generated 3D avatar for ${coach.name}!` });
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setGeneratingStatus(prev => ({ ...prev, [coach.id]: 'error' }));
      setNotification({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: 'idle' | 'generating' | 'done' | 'error') => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-500';
      case 'generating': return 'bg-purple-100 text-purple-600';
      case 'done': return 'bg-green-100 text-green-600';
      case 'error': return 'bg-red-100 text-red-600';
    }
  };

  const getStatusIcon = (status: 'idle' | 'generating' | 'done' | 'error') => {
    switch (status) {
      case 'idle': return <span>⬜</span>;
      case 'generating': return <span className="animate-spin inline-block">⏳</span>;
      case 'done': return <span>✅</span>;
      case 'error': return <span>❌</span>;
    }
  };

  const imageTimestamp = Date.now(); // To prevent caching

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Generate 3D Coach Avatars</h1>
          <a href="/" className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm">Back to App</a>
        </div>
        
        {notification && (
          <div className={`p-4 rounded-lg mb-6 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Coaches</h2>
            
            <div className="space-y-4">
              {coaches.map(coach => (
                <div 
                  key={coach.id}
                  className={`p-4 border rounded-lg transition ${selectedCoach?.id === coach.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedCoach(coach)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs ${getStatusColor(generatingStatus[coach.id] || 'idle')}`}>
                        {getStatusIcon(generatingStatus[coach.id] || 'idle')}
                      </span>
                      <h3 className="font-semibold">{coach.name}</h3>
                    </div>
                    
                    <button
                      onClick={() => generateCoachImage(coach)}
                      disabled={generating}
                      className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingStatus[coach.id] === 'generating' ? 'Generating...' : 'Generate 3D Avatar'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{coach.specialty}</p>
                  
                  <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                    <p><strong>Physique:</strong> {coach.physique}</p>
                    <p><strong>Features:</strong> {coach.features}</p>
                    <p><strong>Expression:</strong> {coach.expression}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            
            {selectedCoach ? (
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square relative">
                  {generatingStatus[selectedCoach.id] === 'generating' ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                  ) : (
                    <img 
                      src={`/images/coaches/${selectedCoach.id}.jpg?t=${imageTimestamp}`} 
                      alt={`${selectedCoach.name} avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/300x300?text=Image+Not+Found';
                      }}
                    />
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="font-medium">{selectedCoach.name}</h3>
                  <p className="text-sm text-gray-600">{selectedCoach.specialty}</p>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="font-medium text-sm mb-2">Image Status</h4>
                  <div className={`text-sm p-2 rounded ${
                    generatingStatus[selectedCoach.id] === 'done' ? 'bg-green-100 text-green-800' : 
                    generatingStatus[selectedCoach.id] === 'error' ? 'bg-red-100 text-red-800' :
                    generatingStatus[selectedCoach.id] === 'generating' ? 'bg-purple-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {generatingStatus[selectedCoach.id] === 'done' ? '✅ Generation complete' : 
                     generatingStatus[selectedCoach.id] === 'error' ? '❌ Generation failed' :
                     generatingStatus[selectedCoach.id] === 'generating' ? '⏳ Generating image...' :
                     '⬜ Not yet generated'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center text-gray-500">
                Select a coach to preview
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">About 3D Coach Generation</h2>
          
          <div className="prose">
            <p>
              This tool uses AI to generate realistic 3D rendered avatars for each fitness coach. 
              The images are tailored to match each coach's specialty:
            </p>
            
            <ul>
              <li><strong>Strength coaches</strong> like Max and Alexis have more muscular builds</li>
              <li><strong>Cardio specialists</strong> like Ethan and Zoey have leaner, more toned physiques</li>
              <li><strong>Yoga instructors</strong> like Kai have flexible, balanced builds</li>
            </ul>
            
            <p>
              Each avatar is generated using specific parameters that describe the coach's physical appearance,
              clothing, and facial expression to create a cohesive visual identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}