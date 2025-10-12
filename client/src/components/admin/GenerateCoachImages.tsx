import { useState } from 'react';
// We'll use the server API instead of the client OpenAI import since we can't use OpenAI directly in browser

interface CoachDescription {
  id: string;
  name: string;
  specialty: string;
  physique: string;
  features: string;
  expression: string;
}

export default function GenerateCoachImages() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachDescription | null>(null);

  const coaches: CoachDescription[] = [
    {
      id: 'max-stone',
      name: 'Max Stone',
      specialty: 'Strength Training Specialist',
      physique: 'extremely muscular build with very large arms and broad shoulders',
      features: 'short dark hair, strong jawline, wearing a fitted black t-shirt',
      expression: 'confident and serious expression'
    },
    {
      id: 'alexis-steel',
      name: 'Alexis Steel',
      specialty: 'Strength Training Specialist',
      physique: 'athletic and muscular build with toned arms and defined shoulders',
      features: 'medium-length dark hair in a ponytail, wearing a fitted grey tank top',
      expression: 'determined expression'
    },
    {
      id: 'ethan-dash',
      name: 'Ethan Dash',
      specialty: 'Cardio and Endurance Specialist',
      physique: 'lean and toned physique built for endurance, not bulky',
      features: 'short light brown hair, wearing a red moisture-wicking training shirt',
      expression: 'energetic smile, looks like a runner'
    },
    {
      id: 'zoey-blaze',
      name: 'Zoey Blaze',
      specialty: 'Cardio and Endurance Specialist',
      physique: 'athletic build with lean muscle for endurance activities',
      features: 'shoulder-length reddish hair, wearing an orange sports top',
      expression: 'bright and energetic expression'
    },
    {
      id: 'kai-rivers',
      name: 'Kai Rivers',
      specialty: 'Yoga and Flexibility Specialist',
      physique: 'lean and flexible build, less muscular than the strength coaches',
      features: 'longer dark hair tied back in a man bun, wearing a teal yoga top',
      expression: 'calm and centered expression'
    }
  ];

  const generateImage = async (coach: CoachDescription) => {
    setGenerating(true);
    setError(null);
    setSelectedCoach(coach);
    
    try {
      // Simulating image generation with a timeout
      // In a real app, we would call the server endpoint which would use OpenAI
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, we'll use the pre-generated images from our public folder
      // These images would normally be generated via OpenAI on the server side
      const imageUrl = `/images/coaches/${coach.id}.jpg`;
      
      // Check if the image exists
      const checkResponse = await fetch(imageUrl, { method: 'HEAD' });
      if (!checkResponse.ok) {
        throw new Error(`Image for ${coach.name} not found`);
      }
      
      setGeneratedImage(imageUrl);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const saveImage = async () => {
    if (!selectedCoach || !generatedImage) return;
    
    try {
      const response = await fetch('/api/save-coach-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coachId: selectedCoach.id,
          imageUrl: generatedImage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save the coach image');
      }
      
      alert(`Image for ${selectedCoach.name} saved successfully!`);
    } catch (err) {
      console.error('Error saving image:', err);
      alert(err instanceof Error ? err.message : 'Failed to save the image');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Generate Coach 3D Avatars</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select a Coach</h2>
          <div className="space-y-4">
            {coaches.map((coach) => (
              <div 
                key={coach.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-purple-50 ${selectedCoach?.id === coach.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                onClick={() => setSelectedCoach(coach)}
              >
                <h3 className="font-medium">{coach.name}</h3>
                <p className="text-sm text-gray-600">{coach.specialty}</p>
                <div className="mt-2 text-xs text-gray-500">
                  <p><span className="font-medium">Physique:</span> {coach.physique}</p>
                  <p><span className="font-medium">Features:</span> {coach.features}</p>
                  <p><span className="font-medium">Expression:</span> {coach.expression}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => selectedCoach && generateImage(selectedCoach)}
              disabled={generating || !selectedCoach}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate 3D Avatar'}
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Generated Avatar</h2>
          
          {generating ? (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Generating avatar...</p>
            </div>
          ) : generatedImage ? (
            <div className="space-y-4">
              <div className="relative w-64 h-64 mx-auto rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={generatedImage}
                  alt={selectedCoach?.name || 'Generated coach'}
                  className="object-cover w-full h-full"
                />
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={saveImage}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Save Image
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Select a coach and generate an avatar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}