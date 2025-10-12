import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

interface CoachImageRequest {
  name: string;
  type: string;
  description: string;
}

export async function generateCoachImage(coach: CoachImageRequest): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a character portrait of ${coach.name}, a ${coach.type} fitness instructor in Rick and Morty animation style. ${coach.description}. The character should have the distinctive Rick and Morty art style - bold outlines, vibrant colors, exaggerated features, and cartoon-like appearance. Focus on the character's head and upper shoulders with a simple solid background. The style should match the Rick and Morty universe with their characteristic animation techniques.`,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    });

    return response.data[0].url || '';
  } catch (error) {
    console.error("Error generating coach image:", error);
    return '';
  }
}

// Coach descriptions for Rick and Morty style generation
export const coachDescriptions = {
  "max-stone": {
    name: "Max Stone",
    type: "Strength Training Specialist", 
    description: "Male character with comically oversized, bulging muscles and massive biceps that are almost as big as his head. Short spiky dark hair, square jaw, intense determined expression with slightly angry eyebrows. Wearing a tight black tank top that's stretched by his enormous muscles. Background should be gym-themed with weights"
  },
  "alexis-steel": {
    name: "Alexis Steel",
    type: "Strength Training Specialist",
    description: "Female character with very muscular and defined arms and shoulders, athletic build with visible muscle definition. Dark hair in a high ponytail, fierce determined expression, wearing a fitted grey sports bra. Strong confident posture with flexed arms showing off muscle definition"
  },
  "ethan-dash": {
    name: "Ethan Dash", 
    type: "Cardio and Endurance Specialist",
    description: "Male character with lean runner's build, always appears to be in motion with speed lines around him. Short messy light brown hair blown by wind, bright energetic smile with sweat droplets, wearing a bright red running shirt. Background suggests movement and speed"
  },
  "zoey-blaze": {
    name: "Zoey Blaze",
    type: "Cardio and Endurance Specialist", 
    description: "Female character with lean athletic build, fiery orange-red hair that looks like flames, extremely energetic expression with wide excited eyes. Wearing bright orange workout gear, appears to be burning with energy. Background has flame-like patterns"
  },
  "kai-rivers": {
    name: "Kai Rivers",
    type: "Yoga and Flexibility Specialist",
    description: "Male character with extremely flexible appearance, long flowing dark hair, serene zen-like expression with closed eyes and peaceful smile. Wearing earth-tone yoga clothing, appears to be floating or in a meditative pose. Background should be nature-themed with flowing water"
  },
  "lila-sage": {
    name: "Lila Sage",
    type: "Yoga and Flexibility Specialist",
    description: "Female character with graceful, flowing appearance, long purple-tinted hair that seems to move like water, extremely calm and centered expression. Wearing flowing purple yoga attire, appears to be in perfect balance. Background with lotus flowers and peaceful elements"
  },
  "leo-cruz": {
    name: "Leo Cruz",
    type: "Calisthenics and Bodyweight Specialist",
    description: "Male character with perfectly sculpted lean muscle definition, appears to be defying gravity in a handstand or athletic pose. Short dark hair, focused intense expression, wearing minimal workout gear. Background suggests acrobatic movement with geometric patterns"
  },
  "maya-flex": {
    name: "Maya Flex",
    type: "Calisthenics and Bodyweight Specialist",
    description: "Female character with incredible flexibility, appears to be contorted in an impossible pose, very lean and agile build. Dark hair in multiple braids, playful confident expression. Wearing flexible athletic wear, background suggests movement and agility"
  },
  "nate-green": {
    name: "Nate Green",
    type: "Nutrition and Wellness Specialist",
    description: "Male character surrounded by floating healthy foods and vegetables, lean healthy appearance with glowing aura. Short neat hair, wise and knowledgeable expression wearing green wellness-themed clothing. Background filled with colorful fruits and vegetables"
  },
  "sophie-gold": {
    name: "Sophie Gold",
    type: "Nutrition and Wellness Specialist",
    description: "Female character with radiant healthy glow, appears to be surrounded by golden light and healthy foods. Blonde hair with natural look, warm nurturing expression. Wearing earth-tone wellness clothing, background has golden healthy aura with superfoods"
  },
  "dylan-power": {
    name: "Dylan Power",
    type: "General Fitness and Motivation Specialist",
    description: "Male character with perfectly balanced athletic build, appears to be radiating energy and motivation with power lines around him. Medium brown hair, extremely enthusiastic and motivating expression with bright eyes. Wearing dynamic fitness gear, background suggests explosive energy"
  },
  "ava-blaze": {
    name: "Ava Blaze",
    type: "General Fitness and Motivation Specialist",
    description: "Female character with high-energy appearance, seems to be on fire with motivation, athletic build with dynamic pose. Red-orange hair that appears to have energy sparks, intense motivating expression. Wearing bright energetic workout clothes, background has lightning and energy effects"
  },
  "ryder-swift": {
    name: "Ryder Swift",
    type: "Running and Triathlon Specialist",
    description: "Male character who appears to be always running even while standing still with motion blur effects, lean endurance athlete build. Wind-swept hair, focused determined runner's expression. Wearing aerodynamic running gear, background suggests speed and endurance with track elements"
  },
  "chloe-fleet": {
    name: "Chloe Fleet",
    type: "Running and Triathlon Specialist",
    description: "Female character with ultra-lean endurance build, appears to be floating or mid-stride, hair flowing behind her. Determined focused expression of a long-distance runner. Wearing streamlined athletic wear, background suggests marathon running with distance markers"
  }
};