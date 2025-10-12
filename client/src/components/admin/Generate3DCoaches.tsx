import { useState } from 'react';

interface CoachDescription {
  id: string;
  name: string;
  specialty: string;
  physique: string;
  features: string;
  expression: string;
}

export default function Generate3DCoaches() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<CoachDescription | null>(null);
  const [generationStatus, setGenerationStatus] = useState<Record<string, string>>({});

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
    setGenerationStatus(prev => ({ ...prev, [coach.id]: 'generating' }));
    
    try {
      // Call our server API to generate the 3D coach image
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate coach image');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Add a timestamp to bypass browser cache
        const timestamp = new Date().getTime();
        setGeneratedImage(`${data.imagePath}?t=${timestamp}`);
        setGenerationStatus(prev => ({ ...prev, [coach.id]: 'completed' }));
      } else {
        throw new Error('Image generation failed');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setGenerationStatus(prev => ({ ...prev, [coach.id]: 'failed' }));
    } finally {
      setGenerating(false);
    }
  };

  const getStatusIcon = (coachId: string) => {
    const status = generationStatus[coachId];
    if (status === 'completed') {
      return <div className="bg-green-100 text-green-600 p-1 rounded-full"><i className="fas fa-check"></i></div>;
    } else if (status === 'failed') {
      return <div className="bg-red-100 text-red-600 p-1 rounded-full"><i className="fas fa-times"></i></div>;
    } else if (status === 'generating') {
      return <div className="bg-purple-100 text-purple-600 p-1 rounded-full animate-spin"><i className="fas fa-circle-notch"></i></div>;
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Generate 3D Coach Avatars</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error: </strong> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Coach List</h2>
            <div className="space-y-4">
              {coaches.map((coach) => (
                <div 
                  key={coach.id}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:border-blue-400 ${selectedCoach?.id === coach.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                  onClick={() => setSelectedCoach(coach)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-lg">{coach.name}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(coach.id)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          generateImage(coach);
                        }}
                        disabled={generating}
                        className="px-3 py-1.5 bg-purple-500 text-xs text-white rounded-md hover:bg-purple-600 disabled:bg-blue-300"
                      >
                        {generationStatus[coach.id] === 'generating' ? 'Generating...' : 'Generate 3D Avatar'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{coach.specialty}</p>
                  <div className="text-xs text-gray-500 space-y-1 mt-3">
                    <p><span className="font-medium">Physique:</span> {coach.physique}</p>
                    <p><span className="font-medium">Features:</span> {coach.features}</p>
                    <p><span className="font-medium">Expression:</span> {coach.expression}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-semibold mb-4">Generated Avatar</h2>
            
            {generating ? (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-700">Generating 3D avatar for {selectedCoach?.name}...</p>
                <p className="text-xs text-gray-500 mt-2">This may take up to 30 seconds</p>
              </div>
            ) : selectedCoach ? (
              generationStatus[selectedCoach.id] === 'completed' ? (
                <div className="space-y-4">
                  <div className="relative w-full h-80 mx-auto rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <img
                      src={generatedImage || `/images/coaches/${selectedCoach.id}.jpg`}
                      alt={`Generated 3D avatar of ${selectedCoach.name}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // If image fails to load, show a placeholder
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x300?text=Image+Not+Available";
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-center">{selectedCoach.name}</h3>
                    <p className="text-sm text-gray-600 text-center">{selectedCoach.specialty}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-700 text-center mb-4">
                    {generationStatus[selectedCoach.id] === 'failed' 
                      ? `Generation failed for ${selectedCoach.name}. Please try again.` 
                      : `Click "Generate 3D Avatar" to create a realistic 3D render of ${selectedCoach.name}.`}
                  </p>
                  
                  <button
                    onClick={() => generateImage(selectedCoach)}
                    disabled={generating}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    Generate 3D Avatar
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-600">Select a coach from the list</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}