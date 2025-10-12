import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { promisify } from 'util';
import { pipeline } from 'stream';

export interface CoachImageRequest {
  coachId: string;
  name: string;
  specialty: string;
  physique: string;
  features: string;
  expression: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in your environment
});

// Create a promisified pipeline for stream handling
const pipelineAsync = promisify(pipeline);

export async function generateCoachImage(req: Request, res: Response) {
  try {
    const { coachId, name, specialty, physique, features, expression } = req.body as CoachImageRequest;
    
    if (!coachId || !name || !specialty || !physique || !features || !expression) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters. Please provide coachId, name, specialty, physique, features, and expression.'
      });
    }
    
    // Create a detailed prompt for the coach image
    const prompt = `Generate a realistic 3D rendered avatar for a fitness coach named ${name}, who is a ${specialty}.
    Physical characteristics: ${physique}.
    Visual features: ${features}.
    Facial expression: ${expression}.
    Style: Modern, high-quality 3D render with photorealistic textures and professional lighting.
    Focus: Headshot/upper body shot with neutral background.
    Purpose: Profile image for a fitness coaching app.`;
    
    console.log(`Generating image for coach: ${name}`);
    
    const response = await openai.images.generate({
      model: "dall-e-3", // The newest model for high-quality images
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard", // or "hd" for higher quality
      style: "natural", // for photorealistic images
    });
    
    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL received from OpenAI');
    }
    
    // Fetch the image as a stream
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    // Make sure the directory exists
    const outputDir = path.join(process.cwd(), 'public', 'images', 'coaches');
    fs.mkdirSync(outputDir, { recursive: true });
    
    // Create a write stream to save the file
    const imagePath = path.join(outputDir, `${coachId}.jpg`);
    const writeStream = fs.createWriteStream(imagePath);
    
    // Save the image to disk
    // @ts-ignore - TS doesn't recognize imageResponse.body as a valid stream
    await pipelineAsync(imageResponse.body, writeStream);
    
    console.log(`Image for ${name} saved to ${imagePath}`);
    
    // Return success response
    return res.json({
      success: true,
      message: `Successfully generated and saved image for ${name}`,
      imagePath: `/images/coaches/${coachId}.jpg`
    });
    
  } catch (error) {
    console.error('Error generating coach image:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred while generating the image'
    });
  }
}