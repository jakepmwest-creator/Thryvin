import { useState } from 'react';
import { coachDescriptions, generateCoachImage } from '@/lib/image-generator';

export default function CoachImageGenerator() {
  const [generatingCoach, setGeneratingCoach] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (coachId: string) => {
    setGeneratingCoach(coachId);
    setError(null);
    
    try {
      const coachData = coachDescriptions[coachId as keyof typeof coachDescriptions];
      if (!coachData) {
        throw new Error(`Coach data not found for ${coachId}`);
      }
      
      const imageUrl = await generateCoachImage(coachData);
      
      if (imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [coachId]: imageUrl
        }));
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (err) {
      console.error('Error generating coach image:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setGeneratingCoach(null);
    }
  };

  const saveImage = async (coachId: string, imageUrl: string) => {
    try {
      const response = await fetch('/api/save-coach-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coachId,
          imageUrl
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save image');
      }
      
      alert(`Image for ${coachId} saved successfully!`);
    } catch (err) {
      console.error('Error saving coach image:', err);
      alert(err instanceof Error ? err.message : 'Error saving image');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Coach Image Generator</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {Object.entries(coachDescriptions).map(([coachId, coach]) => (
          <div key={coachId} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{coach.name}</h3>
                <p className="text-sm text-gray-600">{coach.type}</p>
                <p className="mt-2 text-gray-700">{coach.description}</p>
              </div>
              
              <button
                onClick={() => generateImage(coachId)}
                disabled={generatingCoach !== null}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-blue-300"
              >
                {generatingCoach === coachId ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
            
            {generatedImages[coachId] && (
              <div className="mt-4">
                <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={generatedImages[coachId]}
                    alt={`Generated image of ${coach.name}`}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="mt-2 flex justify-center">
                  <button
                    onClick={() => saveImage(coachId, generatedImages[coachId])}
                    className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                  >
                    Save Image
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}