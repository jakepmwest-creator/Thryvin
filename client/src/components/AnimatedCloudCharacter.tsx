import React, { useEffect, useRef, useState } from 'react';

type CloudMood = 'happy' | 'focused' | 'thinking' | 'tired' | 'excited' | 'neutral';

interface AnimatedCloudCharacterProps {
  size?: 'small' | 'medium' | 'large';
  mood?: CloudMood;
  onClick?: () => void;
  className?: string;
}

export const AnimatedCloudCharacter: React.FC<AnimatedCloudCharacterProps> = ({ 
  size = 'medium', 
  mood = 'neutral',
  onClick,
  className = '' 
}) => {
  const cloudRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetEyePos, setTargetEyePos] = useState({ x: 0, y: 0 });
  const [currentEyePos, setCurrentEyePos] = useState({ x: 0, y: 0 });
  const [isClicked, setIsClicked] = useState(false);
  const [eyesBlink, setEyesBlink] = useState(false);
  const [sparks, setSparks] = useState<Array<{id: number, x: number, y: number, life: number, vx: number, vy: number}>>([]);
  const [time, setTime] = useState(0);

  // Size configurations - much larger and more detailed
  const sizeConfig = {
    small: { width: 100, height: 80, eyeWidth: 12, eyeHeight: 18, cloudLayers: 6 },
    medium: { width: 140, height: 110, eyeWidth: 16, eyeHeight: 24, cloudLayers: 8 },
    large: { width: 200, height: 150, eyeWidth: 22, eyeHeight: 32, cloudLayers: 12 }
  };

  const config = sizeConfig[size];

  // Mouse tracking for eye movement with easing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cloudRef.current) {
        const rect = cloudRef.current.getBoundingClientRect();
        const cloudCenterX = rect.left + rect.width / 2;
        const cloudCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(e.clientX - cloudCenterX, 2) + Math.pow(e.clientY - cloudCenterY, 2)
        );
        
        // Limit tracking distance and add easing
        const maxDistance = 150;
        const clampedDistance = Math.min(distance, maxDistance);
        const intensity = clampedDistance / maxDistance;
        
        setTargetEyePos({
          x: ((e.clientX - cloudCenterX) / maxDistance) * intensity * 3,
          y: ((e.clientY - cloudCenterY) / maxDistance) * intensity * 2
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth eye movement with easing
  useEffect(() => {
    const easeEyes = () => {
      setCurrentEyePos(prev => ({
        x: prev.x + (targetEyePos.x - prev.x) * 0.1,
        y: prev.y + (targetEyePos.y - prev.y) * 0.1
      }));
    };

    const interval = setInterval(easeEyes, 16); // 60fps
    return () => clearInterval(interval);
  }, [targetEyePos]);

  // Blinking animation with mood-based frequency
  useEffect(() => {
    const getBlinkFrequency = () => {
      switch (mood) {
        case 'tired': return 1500;
        case 'excited': return 4000;
        case 'focused': return 5000;
        default: return 3000;
      }
    };

    const blinkInterval = setInterval(() => {
      setEyesBlink(true);
      setTimeout(() => setEyesBlink(false), mood === 'tired' ? 300 : 150);
    }, getBlinkFrequency() + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, [mood]);

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
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config.width, config.height]);

  // Render cloud on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate cloud movement based on mood
    const getMoodFloat = () => {
      switch (mood) {
        case 'happy': return Math.sin(time * 2) * 2 + 1;
        case 'excited': return Math.sin(time * 3) * 3;
        case 'tired': return Math.sin(time * 0.5) * 1 - 2;
        default: return Math.sin(time) * 1.5;
      }
    };

    const floatY = getMoodFloat();
    const swayX = Math.sin(time * 0.7) * 1;

    // Draw cloud layers for depth and fluffiness
    const centerX = canvas.width / 2 + swayX;
    const centerY = canvas.height / 2 + floatY;

    // Multiple cloud layers for volume
    for (let i = 0; i < config.cloudLayers; i++) {
      const layerSize = (config.cloudLayers - i) / config.cloudLayers;
      const opacity = 0.3 + (layerSize * 0.4);
      const offsetX = (Math.sin(time + i) * 2) * layerSize;
      const offsetY = (Math.cos(time + i * 0.5) * 1) * layerSize;

      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Create gradient for each cloud layer
      const gradient = ctx.createRadialGradient(
        centerX + offsetX, centerY + offsetY, 0,
        centerX + offsetX, centerY + offsetY, 40 * layerSize
      );
      
      gradient.addColorStop(0, i < 3 ? '#E5E7EB' : '#D1D5DB');
      gradient.addColorStop(1, i < 3 ? '#D1D5DB' : '#9CA3AF');
      
      ctx.fillStyle = gradient;
      
      // Draw fluffy cloud parts
      const cloudParts = [
        { x: -15, y: -10, radius: 25 * layerSize },
        { x: 15, y: -8, radius: 28 * layerSize },
        { x: -8, y: 8, radius: 22 * layerSize },
        { x: 12, y: 12, radius: 24 * layerSize },
        { x: 0, y: -2, radius: 30 * layerSize }
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

    // Draw eyes
    const getEyeHeight = () => {
      if (eyesBlink) return 2;
      switch (mood) {
        case 'happy': return config.eyeHeight * 1.2;
        case 'excited': return config.eyeHeight * 1.3;
        case 'tired': return config.eyeHeight * 0.6;
        case 'focused': return config.eyeHeight * 0.8;
        case 'thinking': return config.eyeHeight * 0.9;
        default: return config.eyeHeight;
      }
    };

    const eyeHeight = getEyeHeight();
    const eyeSpacing = config.eyeWidth * 1.8;

    // Left eye
    const leftEyeX = centerX - eyeSpacing/2 + currentEyePos.x;
    const leftEyeY = centerY - 5 + currentEyePos.y;

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3B82F6';
    ctx.fillStyle = '#3B82F6';
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
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3B82F6';
    ctx.fillStyle = '#3B82F6';
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

  }, [time, mood, currentEyePos, eyesBlink, sparks, config, isClicked]);

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

  // Generate sparks on click or mood
  const generateSparks = (centerX: number, centerY: number, count: number = 8) => {
    const newSparks = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: centerX + (Math.random() - 0.5) * 60,
      y: centerY + (Math.random() - 0.5) * 40,
      life: 1,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2
    }));

    setSparks(prev => [...prev, ...newSparks]);
  };

  // Handle click interactions
  const handleClick = () => {
    setIsClicked(true);
    
    // Generate click sparks
    generateSparks(config.width / 2, config.height / 2, 12);
    
    setTimeout(() => setIsClicked(false), 300);
    if (onClick) onClick();
  };

  // Auto-generate sparks based on mood
  useEffect(() => {
    if (mood === 'excited' || mood === 'happy') {
      const sparkInterval = setInterval(() => {
        generateSparks(
          config.width / 2 + (Math.random() - 0.5) * 40,
          config.height / 2 + (Math.random() - 0.5) * 30,
          2
        );
      }, 2000);

      return () => clearInterval(sparkInterval);
    }
  }, [mood, config]);

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

export default AnimatedCloudCharacter;