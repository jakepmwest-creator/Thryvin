import React, { useEffect, useRef, useState, useCallback } from 'react';

type CloudMood = 'happy' | 'focused' | 'thinking' | 'tired' | 'excited' | 'neutral' | 'calm' | 'annoyed';

interface EnhancedCloudCharacterProps {
  size?: 'small' | 'medium' | 'large';
  mood?: CloudMood;
  onClick?: () => void;
  className?: string;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
}

export const EnhancedCloudCharacter: React.FC<EnhancedCloudCharacterProps> = ({ 
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

  // Size configurations - more cloud layers for fluffier appearance
  const sizeConfig = {
    small: { width: 120, height: 100, eyeWidth: 12, eyeHeight: 18, cloudLayers: 10 },
    medium: { width: 160, height: 130, eyeWidth: 16, eyeHeight: 24, cloudLayers: 14 },
    large: { width: 220, height: 170, eyeWidth: 22, eyeHeight: 32, cloudLayers: 18 }
  };

  const config = sizeConfig[size];

  // Mood management system
  useEffect(() => {
    const now = Date.now();
    
    // Reset click count after 3 seconds of no clicks
    if (now - lastClickTime > 3000 && clickCount > 0) {
      setClickCount(0);
      setCurrentMood(mood); // Return to original mood
    }
    
    // Determine mood based on click behavior
    if (clickCount >= 5) {
      setCurrentMood('annoyed');
    } else if (clickCount >= 3) {
      setCurrentMood('thinking');
    } else {
      setCurrentMood(mood);
    }
  }, [clickCount, lastClickTime, mood]);

  // Mouse tracking for eye movement with calmer, gentler easing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cloudRef.current && currentMood !== 'annoyed') {
        const rect = cloudRef.current.getBoundingClientRect();
        const cloudCenterX = rect.left + rect.width / 2;
        const cloudCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - cloudCenterX, 2) + Math.pow(e.clientY - cloudCenterY, 2)
        );
        
        // Calmer, more limited eye tracking
        const maxDistance = 120;
        const clampedDistance = Math.min(distance, maxDistance);
        const intensity = clampedDistance / maxDistance;
        
        // Reduced movement for calmer feel
        setTargetEyePos({
          x: ((e.clientX - cloudCenterX) / maxDistance) * intensity * 1.5,
          y: ((e.clientY - cloudCenterY) / maxDistance) * intensity * 1
        });
      } else if (currentMood === 'annoyed') {
        // When annoyed, eyes look away from mouse
        setTargetEyePos({
          x: Math.random() * 2 - 1,
          y: -0.5
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [currentMood]);

  // Smooth eye movement with calmer easing
  useEffect(() => {
    const easeEyes = () => {
      setCurrentEyePos(prev => ({
        x: prev.x + (targetEyePos.x - prev.x) * 0.05, // Much slower, calmer movement
        y: prev.y + (targetEyePos.y - prev.y) * 0.05
      }));
    };

    const interval = setInterval(easeEyes, 16); // 60fps
    return () => clearInterval(interval);
  }, [targetEyePos]);

  // Blinking animation with mood-based frequency
  useEffect(() => {
    const getBlinkFrequency = () => {
      switch (currentMood) {
        case 'tired': return 1500;
        case 'excited': return 4000;
        case 'focused': return 5000;
        case 'annoyed': return 800; // Rapid blinking when annoyed
        case 'calm': return 4000; // Slower, peaceful blinking
        default: return 3000;
      }
    };

    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), currentMood === 'annoyed' ? 100 : 180);
    }, getBlinkFrequency() + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [currentMood]);

  // Generate sparks helper function
  const generateSparks = useCallback((centerX: number, centerY: number, count: number = 8) => {
    const newSparks: Spark[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 60,
      y: centerY + (Math.random() - 0.5) * 40,
      life: 1,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2
    }));

    setSparks(prev => [...prev, ...newSparks]);
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = config.width;
    canvas.height = config.height;

    const animate = () => {
      setTime(prev => prev + 0.016); // 60fps time increment
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate cloud movement based on current mood - much calmer overall
      const getMoodFloat = () => {
        switch (currentMood) {
          case 'happy': return Math.sin(time * 0.8) * 1 + 0.5;
          case 'excited': return Math.sin(time * 1.2) * 1.5;
          case 'tired': return Math.sin(time * 0.3) * 0.5 - 1;
          case 'annoyed': return Math.sin(time * 2) * 0.8 + Math.sin(time * 4) * 0.3; // Jittery movement
          case 'calm': return Math.sin(time * 0.4) * 0.8; // Very gentle floating
          case 'thinking': return Math.sin(time * 0.6) * 1 + Math.cos(time * 1.3) * 0.3;
          default: return Math.sin(time * 0.5) * 1;
        }
      };

      const floatY = getMoodFloat();
      const swayX = currentMood === 'annoyed' 
        ? Math.sin(time * 3) * 0.5 + Math.random() * 0.2 - 0.1 // Slight shake when annoyed
        : Math.sin(time * 0.4) * 0.8; // Gentle sway normally

      // Draw cloud layers for depth and fluffiness
      const centerX = canvas.width / 2 + swayX;
      const centerY = canvas.height / 2 + floatY;

      // Multiple cloud layers for extra fluffiness
      for (let i = 0; i < config.cloudLayers; i++) {
        const layerSize = (config.cloudLayers - i) / config.cloudLayers;
        const opacity = 0.2 + (layerSize * 0.5);
        const offsetX = (Math.sin(time * 0.3 + i) * 1.5) * layerSize;
        const offsetY = (Math.cos(time * 0.2 + i * 0.5) * 0.8) * layerSize;

        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Create softer gradient for fluffier appearance
        const gradient = ctx.createRadialGradient(
          centerX + offsetX, centerY + offsetY, 0,
          centerX + offsetX, centerY + offsetY, 45 * layerSize
        );
        
        // More varied cloud colors for depth
        if (i < 4) {
          gradient.addColorStop(0, '#F3F4F6');
          gradient.addColorStop(1, '#E5E7EB');
        } else if (i < 8) {
          gradient.addColorStop(0, '#E5E7EB');
          gradient.addColorStop(1, '#D1D5DB');
        } else {
          gradient.addColorStop(0, '#D1D5DB');
          gradient.addColorStop(1, '#9CA3AF');
        }
        
        ctx.fillStyle = gradient;
        
        // More cloud parts for extra fluffiness
        const cloudParts = [
          { x: -20, y: -15, radius: 28 * layerSize },
          { x: 20, y: -12, radius: 32 * layerSize },
          { x: -12, y: 12, radius: 26 * layerSize },
          { x: 16, y: 15, radius: 28 * layerSize },
          { x: 0, y: -5, radius: 35 * layerSize },
          { x: -25, y: 0, radius: 22 * layerSize },
          { x: 25, y: 3, radius: 24 * layerSize },
          { x: 0, y: 20, radius: 20 * layerSize }
        ];

        cloudParts.forEach(part => {
          ctx.beginPath();
          ctx.arc(
            centerX + part.x + offsetX,
            centerY + part.y + offsetY,
            part.radius,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        ctx.restore();
      }

      // Draw eyes with emotional expressions
      const getEyeHeight = () => {
        if (eyesBlink) return 2;
        switch (currentMood) {
          case 'happy': return config.eyeHeight * 1.1;
          case 'excited': return config.eyeHeight * 1.2;
          case 'tired': return config.eyeHeight * 0.6;
          case 'focused': return config.eyeHeight * 0.8;
          case 'thinking': return config.eyeHeight * 0.7;
          case 'calm': return config.eyeHeight * 0.9; // Peaceful, relaxed eyes
          case 'annoyed': return config.eyeHeight * 0.4; // Squinted, annoyed eyes
          default: return config.eyeHeight;
        }
      };

      const getEyeColor = () => {
        switch (currentMood) {
          case 'annoyed': return '#EF4444'; // Red when annoyed
          case 'calm': return '#60A5FA'; // Soft blue when calm
          case 'thinking': return '#A78BFA'; // Purple when thinking
          default: return '#3B82F6'; // Default blue
        }
      };

      const eyeHeight = getEyeHeight();
      const eyeColor = getEyeColor();
      const eyeSpacing = config.eyeWidth * 1.8;

      // Left eye
      const leftEyeX = centerX - eyeSpacing/2 + currentEyePos.x;
      const leftEyeY = centerY - 5 + currentEyePos.y;

      ctx.save();
      ctx.shadowBlur = currentMood === 'annoyed' ? 4 : 8;
      ctx.shadowColor = eyeColor;
      ctx.fillStyle = eyeColor;
      ctx.fillRect(
        leftEyeX - config.eyeWidth/2,
        leftEyeY - eyeHeight/2,
        config.eyeWidth,
        eyeHeight
      );
      ctx.restore();

      // Right eye
      const rightEyeX = centerX + eyeSpacing/2 + currentEyePos.x;
      const rightEyeY = centerY - 5 + currentEyePos.y;

      ctx.save();
      ctx.shadowBlur = currentMood === 'annoyed' ? 4 : 8;
      ctx.shadowColor = eyeColor;
      ctx.fillStyle = eyeColor;
      ctx.fillRect(
        rightEyeX - config.eyeWidth/2,
        rightEyeY - eyeHeight/2,
        config.eyeWidth,
        eyeHeight
      );
      ctx.restore();

      // Draw sparks
      sparks.forEach(spark => {
        ctx.save();
        ctx.globalAlpha = spark.life;
        ctx.fillStyle = '#60A5FA';
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
  }, [config, mood, currentEyePos, eyesBlink, sparks, time]);

  // Update sparks
  useEffect(() => {
    const updateSparks = () => {
      setSparks(prevSparks => 
        prevSparks
          .map(spark => ({
            ...spark,
            x: spark.x + spark.vx,
            y: spark.y + spark.vy,
            life: spark.life - 0.02,
            vy: spark.vy + 0.1 // gravity
          }))
          .filter(spark => spark.life > 0)
      );
    };

    const interval = setInterval(updateSparks, 16);
    return () => clearInterval(interval);
  }, []);

  // Handle click interactions with emotional responses
  const handleClick = () => {
    const now = Date.now();
    setIsClicked(true);
    setLastClickTime(now);
    setClickCount(prev => prev + 1);
    
    // Generate different sparks based on mood
    if (currentMood === 'annoyed') {
      // Red sparks when annoyed
      const redSparks: Spark[] = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: config.width / 2 + (Math.random() - 0.5) * 40,
        y: config.height / 2 + (Math.random() - 0.5) * 30,
        life: 1,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1
      }));
      setSparks(prev => [...prev, ...redSparks]);
    } else if (clickCount >= 3) {
      // Fewer sparks when getting annoyed
      generateSparks(config.width / 2, config.height / 2, 4);
    } else {
      // Normal happy sparks
      generateSparks(config.width / 2, config.height / 2, 8);
    }
    
    setTimeout(() => setIsClicked(false), 200);
    if (onClick) onClick();
  };

  // Auto-generate gentle sparks for calm mood
  useEffect(() => {
    if (currentMood === 'calm') {
      const sparkInterval = setInterval(() => {
        generateSparks(
          config.width / 2 + (Math.random() - 0.5) * 30,
          config.height / 2 + (Math.random() - 0.5) * 20,
          1
        );
      }, 5000); // Much less frequent for calm mood

      return () => clearInterval(sparkInterval);
    }
  }, [currentMood, config, generateSparks]);

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
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
          imageRendering: 'auto'
        }}
      />
    </div>
  );
};

export default EnhancedCloudCharacter;