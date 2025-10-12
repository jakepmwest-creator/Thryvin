import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function BatchRegenerate() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCoach, setCurrentCoach] = useState<string>('');
  const [completedCoaches, setCompletedCoaches] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});

  const coachIds = [
    'max-stone', 'alexis-steel', 'ethan-dash', 'zoey-blaze',
    'kai-rivers', 'lila-sage', 'leo-cruz', 'maya-flex',
    'nate-green', 'sophie-gold', 'dylan-power', 'ava-blaze',
    'ryder-swift', 'chloe-fleet'
  ];

  const regenerateAllCoaches = async () => {
    setIsRegenerating(true);
    setProgress(0);
    setCompletedCoaches([]);
    setGeneratedImages({});
    
    for (let i = 0; i < coachIds.length; i++) {
      const coachId = coachIds[i];
      setCurrentCoach(coachId);
      
      try {
        console.log(`Regenerating ${coachId} with consistent Rick and Morty style...`);
        
        const response = await apiRequest('POST', `/api/generate-rick-morty-coach/${coachId}`);
        const data = await response.json();
        
        if (data.success) {
          setGeneratedImages(prev => ({
            ...prev,
            [coachId]: data.imageUrl
          }));
          setCompletedCoaches(prev => [...prev, coachId]);
          console.log(`✓ Completed ${data.coachName}`);
        } else {
          console.error(`✗ Failed to regenerate ${coachId}:`, data.error);
        }
        
        setProgress(((i + 1) / coachIds.length) * 100);
        
        // Delay between requests to avoid rate limiting
        if (i < coachIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`✗ Error regenerating ${coachId}:`, error);
      }
    }
    
    setIsRegenerating(false);
    setCurrentCoach('');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Batch Regenerate Coaches</h1>
        <p className="text-muted-foreground mb-6">
          Regenerate all 14 coaches with consistent Rick and Morty art style. This ensures uniform visual appearance across all characters with thick black outlines, flat cel-shaded colors, and exact Rick and Morty aesthetic.
        </p>
        
        <Button 
          onClick={regenerateAllCoaches} 
          disabled={isRegenerating}
          size="lg"
          className="mb-6"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating All Coaches...
            </>
          ) : (
            'Start Batch Regeneration'
          )}
        </Button>

        {isRegenerating && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress: {Math.round(progress)}%</span>
              <span className="text-sm text-muted-foreground">
                {completedCoaches.length} / {coachIds.length} completed
              </span>
            </div>
            <Progress value={progress} className="mb-4" />
            
            {currentCoach && (
              <div className="flex items-center gap-2 p-4 bg-purple-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-blue-700">
                  Currently generating: <strong>{currentCoach.replace('-', ' ')}</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {coachIds.map(coachId => {
          const isCompleted = completedCoaches.includes(coachId);
          const isCurrent = currentCoach === coachId;
          const imageUrl = generatedImages[coachId];
          
          return (
            <Card key={coachId} className={`${isCompleted ? 'border-green-200 bg-green-50' : isCurrent ? 'border-blue-200 bg-purple-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{coachId.replace('-', ' ')}</CardTitle>
                  {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {isCurrent && <Loader2 className="h-4 w-4 animate-spin text-purple-600" />}
                </div>
              </CardHeader>
              
              <CardContent>
                {imageUrl ? (
                  <div className="aspect-square relative overflow-hidden rounded border">
                    <img 
                      src={imageUrl} 
                      alt={`${coachId} - Consistent Rick and Morty style`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-sm">
                      {isCurrent ? 'Generating...' : 'Pending'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completedCoaches.length === coachIds.length && !isRegenerating && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">
            Batch Regeneration Complete! 🎉
          </h3>
          <p className="text-green-700 text-sm">
            All 14 coaches have been regenerated with consistent Rick and Morty art style. 
            They now feature uniform thick black outlines, flat cel-shaded colors, and the exact visual aesthetic of the Rick and Morty universe.
          </p>
        </div>
      )}
    </div>
  );
}