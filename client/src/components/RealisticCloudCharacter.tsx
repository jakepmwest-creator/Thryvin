import React, { useEffect, useRef, useState, useCallback } from 'react';

type CloudMood = 'happy' | 'focused' | 'thinking' | 'tired' | 'excited' | 'neutral' | 'calm' | 'annoyed';

interface RealisticCloudCharacterProps {
  size?: 'small' | 'medium' | 'large';
  mood?: CloudMood;
  onClick?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
}

// Simple noise function for cloud generation
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n));
}

function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value;
}

export const RealisticCloudCharacter: React.FC<RealisticCloudCharacterProps> = ({ 
  size = 'medium', 
  mood = 'calm',
  onClick,
  className = '' 
}) => {
  const cloudRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [targetEyePos, setTargetEyePos] = useState({ x: 0, y: 0 });
  const [currentEyePos, setCurrentEyePos] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);
  const [eyesBlink, setEyesBlink] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [time, setTime] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [currentMood, setCurrentMood] = useState<CloudMood>(mood);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [cloudParticles, setCloudParticles] = useState<Particle[]>([]);

  // Size configurations
  const sizeConfig = {
    small: { width: 120, height: 100, eyeWidth: 12, eyeHeight: 18 },
    medium: { width: 160, height: 130, eyeWidth: 16, eyeHeight: 24 },
    large: { width: 220, height: 170, eyeWidth: 22, eyeHeight: 32 }
  };

  const config = sizeConfig[size];

  // Initialize cloud particles for realistic volume
  useEffect(() => {
    const particles: Particle[] = [];
    const particleCount = size === 'large' ? 150 : size === 'medium' ? 100 : 70;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * config.width * 0.8,
        y: (Math.random() - 0.5) * config.height * 0.6,
        size: Math.random() * 30 + 10,
        opacity: Math.random() * 0.6 + 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.15,
        life: Math.random() * 100 + 50
      });
    }
    setCloudParticles(particles);
  }, [config.width, config.height, size]);

  // Mood management system
  useEffect(() => {
    const now = Date.now();
    
    if (now - lastClickTime > 5000 && clickCount > 0) {
      setClickCount(0);
      setCurrentMood(mood);
      return;
    }
    
    if (clickCount >= 5) {
      setCurrentMood('annoyed');
    } else if (clickCount >= 3) {
      setCurrentMood('thinking');
    } else {
      setCurrentMood(mood);
    }
  }, [clickCount, lastClickTime, mood]);

  // Auto-reset emotions timer
  useEffect(() => {
    if (clickCount > 0) {
      const resetTimer = setTimeout(() => {
        setClickCount(0);
        setCurrentMood(mood);
      }, 4000);
      
      return () => clearTimeout(resetTimer);
    }
  }, [clickCount, mood]);

  // Mouse tracking for eye movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cloudRef.current && currentMood !== 'annoyed') {
        const rect = cloudRef.current.getBoundingClientRect();
        const cloudCenterX = rect.left + rect.width / 2;
        const cloudCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - cloudCenterX, 2) + Math.pow(e.clientY - cloudCenterY, 2)
        );
        
        const maxDistance = 120;
        const clampedDistance = Math.min(distance, maxDistance);
        const intensity = clampedDistance / maxDistance;
        
        setTargetEyePos({
          x: ((e.clientX - cloudCenterX) / maxDistance) * intensity * 1.2,
          y: ((e.clientY - cloudCenterY) / maxDistance) * intensity * 0.8
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [currentMood]);

  // Smooth eye movement
  useEffect(() => {
    const easeEyes = () => {
      setCurrentEyePos(prev => ({
        x: prev.x + (targetEyePos.x - prev.x) * 0.08,
        y: prev.y + (targetEyePos.y - prev.y) * 0.08
      }));
    };

    const interval = setInterval(easeEyes, 16);
    return () => clearInterval(interval);
  }, [targetEyePos]);

  // Blinking animation
  useEffect(() => {
    const getBlinkFrequency = () => {
      switch (currentMood) {
        case 'annoyed': return 600;
        case 'calm': return 4500;
        case 'thinking': return 2000;
        default: return 3000;
      }
    };

    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), 150);
    }, getBlinkFrequency() + Math.random() * 1500);

    return () => clearInterval(blinkInterval);
  }, [currentMood]);

  // Generate sparks helper
  const generateSparks = useCallback((centerX: number, centerY: number, count: number = 8) => {
    const newSparks: Spark[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY + (Math.random() - 0.5) * 30,
      life: 1,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1
    }));

    setSparks(prev => [...prev, ...newSparks]);
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = config.width;
    canvas.height = config.height;

    const animate = () => {
      setTime(prev => prev + 0.012);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cloud movement based on mood
      const getMoodFloat = () => {
        switch (currentMood) {
          case 'annoyed': return Math.sin(time * 2.5) * 1.2 + Math.random() * 0.3;
          case 'calm': return Math.sin(time * 0.3) * 0.6;
          case 'thinking': return Math.sin(time * 0.8) * 1 + Math.cos(time * 1.5) * 0.2;
          default: return Math.sin(time * 0.5) * 0.8;
        }
      };

      const floatY = getMoodFloat();
      const swayX = Math.sin(time * 0.4) * 0.5;
      
      const centerX = canvas.width / 2 + swayX;
      const centerY = canvas.height / 2 + floatY;

      // Draw realistic cloud using noise-based approach
      ctx.save();
      
      // Create cloud mask using noise
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Use noise to create realistic cloud edges
          const noiseScale = 0.02;
          const noiseValue = fbm(x * noiseScale + time * 0.5, y * noiseScale + time * 0.3, 4);
          
          // Create elliptical cloud shape with noise distortion
          const ellipseA = config.width * 0.35;
          const ellipseB = config.height * 0.25;
          const ellipseDistance = Math.sqrt((dx * dx) / (ellipseA * ellipseA) + (dy * dy) / (ellipseB * ellipseB));
          
          let alpha = 1 - ellipseDistance;
          alpha += (noiseValue - 0.5) * 0.8;
          alpha = Math.max(0, Math.min(1, alpha));
          
          if (alpha > 0.1) {
            const index = (y * canvas.width + x) * 4;
            
            // Realistic cloud colors with subtle variations
            const brightness = 0.8 + noiseValue * 0.3;
            const r = Math.floor(240 * brightness);
            const g = Math.floor(245 * brightness);
            const b = Math.floor(250 * brightness);
            
            data[index] = r;     // R
            data[index + 1] = g; // G
            data[index + 2] = b; // B
            data[index + 3] = Math.floor(alpha * 180); // A
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Add soft glow effect
      ctx.globalCompositeOperation = 'soft-light';
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, Math.max(config.width, config.height) * 0.4
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();

      // Draw eyes with emotional expressions
      const getEyeHeight = () => {
        if (eyesBlink) return 2;
        switch (currentMood) {
          case 'annoyed': return config.eyeHeight * 0.3;
          case 'calm': return config.eyeHeight * 0.85;
          case 'thinking': return config.eyeHeight * 0.7;
          case 'happy': return config.eyeHeight * 1.1;
          default: return config.eyeHeight;
        }
      };

      const getEyeColor = () => {
        switch (currentMood) {
          case 'annoyed': return '#EF4444';
          case 'calm': return '#60A5FA';
          case 'thinking': return '#A78BFA';
          default: return '#3B82F6';
        }
      };

      const eyeHeight = getEyeHeight();
      const eyeColor = getEyeColor();
      const eyeSpacing = config.eyeWidth * 1.6;

      // Left eye
      const leftEyeX = centerX - eyeSpacing/2 + currentEyePos.x;
      const leftEyeY = centerY - 8 + currentEyePos.y;

      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = eyeColor;
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.roundRect(
        leftEyeX - config.eyeWidth/2,
        leftEyeY - eyeHeight/2,
        config.eyeWidth,
        eyeHeight,
        2
      );
      ctx.fill();
      ctx.restore();

      // Right eye
      const rightEyeX = centerX + eyeSpacing/2 + currentEyePos.x;
      const rightEyeY = centerY - 8 + currentEyePos.y;

      ctx.save();
      ctx.shadowBlur = 6;
      ctx.shadowColor = eyeColor;
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.roundRect(
        rightEyeX - config.eyeWidth/2,
        rightEyeY - eyeHeight/2,
        config.eyeWidth,
        eyeHeight,
        2
      );
      ctx.fill();
      ctx.restore();

      // Draw sparks
      sparks.forEach(spark => {
        ctx.save();
        ctx.globalAlpha = spark.life;
        ctx.fillStyle = currentMood === 'annoyed' ? '#EF4444' : '#60A5FA';
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, currentMood, currentEyePos, eyesBlink, sparks, time]);

  // Update sparks
  useEffect(() => {
    const updateSparks = () => {
      setSparks(prevSparks => 
        prevSparks
          .map(spark => ({
            ...spark,
            x: spark.x + spark.vx,
            y: spark.y + spark.vy,
            life: spark.life - 0.025,
            vy: spark.vy + 0.08
          }))
          .filter(spark => spark.life > 0)
      );
    };

    const interval = setInterval(updateSparks, 16);
    return () => clearInterval(interval);
  }, []);

  // Handle click interactions
  const handleClick = () => {
    const now = Date.now();
    setIsClicked(true);
    setLastClickTime(now);
    setClickCount(prev => prev + 1);
    
    generateSparks(config.width / 2, config.height / 2, currentMood === 'annoyed' ? 4 : 8);
    
    setTimeout(() => setIsClicked(false), 200);
    if (onClick) onClick();
  };

  return (
    <div 
      className={`relative cursor-pointer select-none ${className} ${
        isClicked ? 'scale-95' : 'scale-100'
      } transition-transform duration-200`}
      style={{ width: config.width, height: config.height }}
      onClick={handleClick}
      ref={cloudRef}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
          imageRendering: 'auto'
        }}
      />
    </div>
  );
};

export default RealisticCloudCharacter;