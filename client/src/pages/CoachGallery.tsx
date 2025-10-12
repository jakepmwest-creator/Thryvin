import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CoachImage {
  coachId: string;
  coachName: string;
  coachType: string;
  imageUrl: string;
  description: string;
}

// Latest Rick and Morty style coach images with URLs from batch regeneration
const generatedCoachImages: CoachImage[] = [
  {
    coachId: 'max-stone',
    coachName: 'Max Stone',
    coachType: 'Strength Training Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-qO3wxjL1LYzqnpq6EAqpBOSf.png?st=2025-06-14T15%3A44%3A58Z&se=2025-06-14T17%3A44%3A58Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T06%3A52%3A49Z&ske=2025-06-15T06%3A52%3A49Z&sks=b&skv=2024-08-04&sig=1ExvJzA2MDCCeqNU4%2BEOkc9cOcUKWjI6xUHbY0ajh4g%3D',
    description: 'Comically oversized bulging muscles and massive biceps, tight black tank top stretched by enormous muscles'
  },
  {
    coachId: 'alexis-steel',
    coachName: 'Alexis Steel', 
    coachType: 'Strength Training Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-J5rF8guqkquJYG7ZxaUMAQCa.png?st=2025-06-14T15%3A45%3A07Z&se=2025-06-14T17%3A45%3A07Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T09%3A45%3A30Z&ske=2025-06-15T09%3A45%3A30Z&sks=b&skv=2024-08-04&sig=6/8PNSF5RpdA4IhqmKXOpDErbJEfejNthy%2BU0U8ugoU%3D',
    description: 'Strong female character with pronounced feminine features, very muscular and defined arms, high ponytail'
  },
  {
    coachId: 'ethan-dash',
    coachName: 'Ethan Dash',
    coachType: 'Cardio and Endurance Specialist', 
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-qiDEoEnYFq037lAGK6YPBtZL.png?st=2025-06-14T15%3A45%3A39Z&se=2025-06-14T17%3A45%3A39Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T12%3A39%3A49Z&ske=2025-06-15T12%3A39%3A49Z&sks=b&skv=2024-08-04&sig=L1iQ/laaSqldl2u8ahKjl3x/tina4XSkdI6CITVtgFw%3D',
    description: 'Athletic male character with clearly masculine facial features, lean runner build always in motion with speed lines'
  },
  {
    coachId: 'zoey-blaze',
    coachName: 'Zoey Blaze',
    coachType: 'Cardio and Endurance Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-GwDXXLvoSE5q3ROBj3yFBhQN.png?st=2025-06-14T15%3A45%3A24Z&se=2025-06-14T17%3A45%3A24Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T02%3A52%3A34Z&ske=2025-06-15T02%3A52%3A34Z&sks=b&skv=2024-08-04&sig=M8t866ffyFYFfccUiK11%2BiA52oKegM7LVn%2BRUqNn2/8%3D',
    description: 'Energetic female character with fiery orange-red hair like flames shooting upward, literally on fire with energy'
  },
  {
    coachId: 'kai-rivers',
    coachName: 'Kai Rivers',
    coachType: 'Yoga and Flexibility Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-HAEPjxsgtJZJ3a2ZyKWFmLto.png?st=2025-06-14T15%3A45%3A42Z&se=2025-06-14T17%3A45%3A42Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T01%3A01%3A39Z&ske=2025-06-15T01%3A01%3A39Z&sks=b&skv=2024-08-04&sig=SO%2B5cCNwIgQUoHWsx8iBgj2mwSUP0H5k4MdmB0IP0oc%3D',
    description: 'Extremely flexible appearance, floating or in meditative pose, flowing water background'
  },
  {
    coachId: 'lila-sage',
    coachName: 'Lila Sage',
    coachType: 'Yoga and Flexibility Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-7qPDMhausr7cOsb5eg8g8X9y.png?st=2025-06-14T15%3A45%3A54Z&se=2025-06-14T17%3A45%3A54Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T16%3A45%3A54Z&ske=2025-06-15T16%3A45%3A54Z&sks=b&skv=2024-08-04&sig=uzZob0fQKEUHsmc89Y2E%2B8hmcG%2BPNTZ7Z4ol28rf4mI%3D',
    description: 'Graceful flowing appearance, purple-tinted hair moving like water, perfect balance with lotus flowers'
  },
  {
    coachId: 'leo-cruz',
    coachName: 'Leo Cruz',
    coachType: 'Calisthenics and Bodyweight Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-cVKaTd4jyMGOZ1rqRG41uJw2.png?st=2025-06-14T15%3A46%3A10Z&se=2025-06-14T17%3A46%3A10Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T16%3A03%3A50Z&ske=2025-06-15T16%3A03%3A50Z&sks=b&skv=2024-08-04&sig=QjAS76ghprVk8e6uFyjaKyIvOQMXRx2ys7TbaxbZVmY%3D',
    description: 'Perfectly sculpted lean muscle, defying gravity in handstand pose, geometric movement patterns'
  },
  {
    coachId: 'maya-flex',
    coachName: 'Maya Flex',
    coachType: 'Calisthenics and Bodyweight Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-ACvcJNB8g9bYS4wiMuTPxWiJ.png?st=2025-06-14T16%3A04%3A00Z&se=2025-06-14T18%3A04%3A00Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T17%3A52%3A42Z&ske=2025-06-14T17%3A52%3A42Z&sks=b&skv=2024-08-04&sig=reFDtvzr6ClyAYPxfcKKXOJwBt1Ksb8HmxCdBDUvGxw%3D',
    description: 'Black female character with dark skin tone performing impressive calisthenics moves like handstand or human flag, athletic build with braids'
  },
  {
    coachId: 'nate-green',
    coachName: 'Nate Green',
    coachType: 'Nutrition and Wellness Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-2q8St2iJfulA4OCRPTTfwCNd.png?st=2025-06-14T15%3A55%3A27Z&se=2025-06-14T17%3A55%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T05%3A20%3A07Z&ske=2025-06-15T05%3A20%3A07Z&sks=b&skv=2024-08-04&sig=PhkyuyMkS/hczzsciB6rnBkPJMk/qhBdj1xZGmytVq4%3D',
    description: 'Surrounded by floating healthy foods and vegetables, glowing aura, colorful fruits and vegetables background'
  },
  {
    coachId: 'sophie-gold',
    coachName: 'Sophie Gold',
    coachType: 'Nutrition and Wellness Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-DbvnUIZkf5BX39zMYWZp3ACB.png?st=2025-06-14T15%3A55%3A45Z&se=2025-06-14T17%3A55%3A45Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-14T06%3A18%3A30Z&ske=2025-06-15T06%3A18%3A30Z&sks=b&skv=2024-08-04&sig=dBY6jn6hIA6ZTMqm9UeYBDNYG7GxSVkWHVa%2BllawUwM%3D',
    description: 'Radiant healthy glow surrounded by golden light, blonde hair, golden healthy aura with superfoods'
  },
  {
    coachId: 'dylan-power',
    coachName: 'Dylan Power',
    coachType: 'General Fitness and Motivation Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-7zN2Mg7TKzTUovxNCY6qyRLt.png?st=2025-06-14T16%3A02%3A48Z&se=2025-06-14T18%3A02%3A48Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T21%3A55%3A59Z&ske=2025-06-14T21%3A55%3A59Z&sks=b&skv=2024-08-04&sig=30tUhYsyeSEFtXqBxPIeabZQbMww2dDDQsVAaKN9BBw%3D',
    description: 'Energetic fitness coach doing jumping jacks with sweat droplets, gym environment with equipment, motivational energy through motion lines'
  },
  {
    coachId: 'ava-blaze',
    coachName: 'Ava Blaze',
    coachType: 'General Fitness and Motivation Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-aldCygmzrEBOdOPL9YPh7a5j.png?st=2025-06-14T15%3A49%3A15Z&se=2025-06-14T17%3A49%3A15Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T18%3A12%3A31Z&ske=2025-06-14T18%3A12%3A31Z&sks=b&skv=2024-08-04&sig=IMCjyYDbeLFdXleZi%2BxlvvgjA/Vw0TBRM6NP5dcx604%3D',
    description: 'High-energy female character rendered in 3D style with detailed shading, blazing with motivational fire, red-orange hair with flames'
  },
  {
    coachId: 'ryder-swift',
    coachName: 'Ryder Swift',
    coachType: 'Running and Triathlon Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-ov8VIMT3qoOl8JWmIdTenuja.png?st=2025-06-14T15%3A49%3A09Z&se=2025-06-14T17%3A49%3A09Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T22%3A10%3A16Z&ske=2025-06-14T22%3A10%3A16Z&sks=b&skv=2024-08-04&sig=SqkrWRuzoH3rYIBpKl31q%2BPjZSTWULbNwalwjJnlWDY%3D',
    description: 'Always running with motion blur effects, wind-swept hair, aerodynamic gear, speed and endurance background'
  },
  {
    coachId: 'chloe-fleet',
    coachName: 'Chloe Fleet',
    coachType: 'Running and Triathlon Specialist',
    imageUrl: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-uMORcIO7bgyGRSqzGKrFFBAF/user-bGkunbqmHMPYRPtg0uGKNlcf/img-V944rvesNYHbiI1iN4OKljCV.png?st=2025-06-14T15%3A49%3A25Z&se=2025-06-14T17%3A49%3A25Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=475fd488-6c59-44a5-9aa9-31c4db451bea&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-13T18%3A08%3A01Z&ske=2025-06-14T18%3A08%3A01Z&sks=b&skv=2024-08-04&sig=YfKnTldqsVrMz8Q2wfNaz86JciTZEfrWu241W4ve4Q8%3D',
    description: 'Ultra-lean endurance build floating mid-stride, hair flowing behind, marathon running with distance markers'
  }
];

export default function CoachGallery() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Rick and Morty Style Coach Gallery</h1>
        <p className="text-muted-foreground mb-6">
          Complete collection of all 14 fitness coaches rendered in Rick and Morty animation style with exaggerated features that match their specialties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {generatedCoachImages.map((coach) => (
          <Card key={coach.coachId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{coach.coachName}</CardTitle>
              <Badge variant="secondary" className="w-fit">
                {coach.coachType}
              </Badge>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <img 
                    src={coach.imageUrl} 
                    alt={`${coach.coachName} - Rick and Morty style`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999">Error</text></svg>';
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Features:</p>
                  <p>{coach.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-purple-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Image Reference Collection</h3>
        <p className="text-blue-700 text-sm mb-2">
          This gallery contains all 14 Rick and Morty style coach images with their original URLs preserved for reference.
          Each coach has exaggerated features that match their fitness specialty in the distinctive Rick and Morty animation style.
        </p>
        <p className="text-purple-600 text-xs">
          Note: These are direct OpenAI DALL-E 3 generated images with temporary URLs that may expire.
          The images showcase each coach's specialty through visual exaggeration (Max Stone's massive muscles, Zoey Blaze's flame hair, etc.).
        </p>
      </div>
    </div>
  );
}