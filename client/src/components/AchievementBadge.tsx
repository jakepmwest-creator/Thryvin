import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { FaDumbbell, FaFire, FaBolt, FaTrophy, FaMedal, 
         FaClock, FaHourglassHalf, FaStopwatch, FaStar } from 'react-icons/fa';

interface AchievementBadgeProps {
  name: string;
  description: string;
  badgeIcon: string;
  badgeColor: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  unlocked?: boolean;
  className?: string;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'fa-dumbbell': FaDumbbell,
  'fa-fire': FaFire,
  'fa-bolt': FaBolt,
  'fa-trophy': FaTrophy,
  'fa-medal': FaMedal,
  'fa-clock': FaClock,
  'fa-hourglass-half': FaHourglassHalf,
  'fa-stopwatch': FaStopwatch,
  'fa-star': FaStar
};

export function AchievementBadge({
  name,
  description,
  badgeIcon,
  badgeColor,
  animate = false,
  size = 'md',
  unlocked = true,
  className,
  onClick
}: AchievementBadgeProps) {
  const Icon = iconMap[badgeIcon] || FaTrophy;
  
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl'
  };
  
  const badgeColorClass = badgeColor && badgeColor.startsWith('bg-') 
    ? badgeColor 
    : 'bg-purple-500';
  
  const BadgeComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { 
      type: 'spring', 
      stiffness: 260, 
      damping: 20,
      delay: 0.1
    }
  } : {};
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className
      )}
      onClick={onClick}
    >
      <BadgeComponent
        className={cn(
          sizeClasses[size],
          badgeColorClass,
          "rounded-full flex items-center justify-center shadow-md cursor-pointer",
          !unlocked && "grayscale opacity-40"
        )}
        {...animationProps}
      >
        <Icon className="text-white" />
      </BadgeComponent>
      
      {size !== 'sm' && (
        <div className="mt-2">
          <h4 className="font-bold text-sm">{name}</h4>
          {size === 'lg' && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}