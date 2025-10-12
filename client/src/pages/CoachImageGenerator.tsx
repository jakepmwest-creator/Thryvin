import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GeneratedCoach {
  coachId: string;
  coachName: string;
  coachType: string;
  imageUrl: string;
}

export default function CoachImageGenerator() {
  const [generatedCoaches, setGeneratedCoaches] = useState<GeneratedCoach[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCoach, setCurrentCoach] = useState<string>('');

  const coachIds = [
    'max-stone', 'alexis-steel', 'ethan-dash', 'zoey-blaze',
    'kai-rivers', 'lila-sage', 'leo-cruz', 'maya-flex',
    'nate-green', 'sophie-gold', 'dylan-power', 'ava-blaze',
    'ryder-swift', 'chloe-fleet'
  ];

  const generateAllCoaches = async () => {
    setIsGenerating(true);
    setGeneratedCoaches([]);
    
    for (const coachId of coachIds) {
      try {
        setCurrentCoach(coachId);
        console.log(`Generating image for ${coachId}...`);
        
        const response = await apiRequest('POST', `/api/generate-rick-morty-coach/${coachId}`);
        const data = await response.json();
        
        if (data.success) {
          setGeneratedCoaches(prev => [...prev, {
            coachId: data.coachId,
            coachName: data.coachName,
            coachType: data.coachType,
            imageUrl: data.imageUrl
          }]);
          console.log(`✓ Generated image for ${data.coachName}`);
        } else {
          console.error(`✗ Failed to generate image for ${coachId}:`, data.error);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`✗ Error generating image for ${coachId}:`, error);
      }
    }
    
    setIsGenerating(false);
    setCurrentCoach('');
  };

  const generateSingleCoach = async (coachId: string) => {
    try {
      setCurrentCoach(coachId);
      console.log(`Generating image for ${coachId}...`);
      
      const response = await apiRequest('POST', `/api/generate-rick-morty-coach/${coachId}`);
      const data = await response.json();
      
      if (data.success) {
        setGeneratedCoaches(prev => {
          const filtered = prev.filter(c => c.coachId !== coachId);
          return [...filtered, {
            coachId: data.coachId,
            coachName: data.coachName,
            coachType: data.coachType,
            imageUrl: data.imageUrl
          }];
        });
        console.log(`✓ Generated image for ${data.coachName}`);
      } else {
        console.error(`✗ Failed to generate image for ${coachId}:`, data.error);
      }
      
      setCurrentCoach('');
    } catch (error) {
      console.error(`✗ Error generating image for ${coachId}:`, error);
      setCurrentCoach('');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Rick and Morty Style Coach Generator</h1>
        <p className="text-muted-foreground mb-6">
          Generate cartoon-style character images for all fitness coaches with exaggerated features related to their specialties.
        </p>
        
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={generateAllCoaches} 
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating All Coaches...
              </>
            ) : (
              'Generate All 14 Coaches'
            )}
          </Button>
        </div>

        {isGenerating && currentCoach && (
          <div className="mb-6 p-4 bg-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-blue-700">
                Currently generating: <strong>{currentCoach.replace('-', ' ')}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {coachIds.map(coachId => {
          const generated = generatedCoaches.find(c => c.coachId === coachId);
          
          return (
            <Card key={coachId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{coachId.replace('-', ' ')}</CardTitle>
                {generated && (
                  <Badge variant="secondary" className="w-fit">
                    {generated.coachType}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent>
                {generated ? (
                  <div className="space-y-3">
                    <div className="aspect-square relative overflow-hidden rounded-lg border">
                      <img 
                        src={generated.imageUrl} 
                        alt={generated.coachName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Error</text></svg>';
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateSingleCoach(coachId)}
                      disabled={currentCoach === coachId}
                      className="w-full"
                    >
                      {currentCoach === coachId ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image yet</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => generateSingleCoach(coachId)}
                      disabled={currentCoach === coachId}
                      className="w-full"
                    >
                      {currentCoach === coachId ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {generatedCoaches.length > 0 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Generated Images ({generatedCoaches.length}/14)</h3>
          <p className="text-green-700 text-sm">
            Images are generated in Rick and Morty style with exaggerated features that match each coach's specialty.
            These images are temporary and will be lost when you refresh the page.
          </p>
        </div>
      )}
    </div>
  );
}