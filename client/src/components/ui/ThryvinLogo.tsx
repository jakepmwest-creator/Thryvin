import React from 'react';
import { motion } from 'framer-motion';

interface ThryvinLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  animated?: boolean;
}

export const ThryvinLogo: React.FC<ThryvinLogoProps> = ({ 
  size = 'md', 
  className = '',
  animated = true
}) => {
  const sizeClasses = {
    xs: 'w-16 h-6',
    sm: 'w-20 h-8',
    md: 'w-24 h-10',
    lg: 'w-32 h-12',
    xl: 'w-40 h-16',
    '2xl': 'w-80 h-24'
  };

  const LogoContent = () => (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <img 
        src="/thryvin-logo-new.png" 
        alt="Thryvin' AI Coaching" 
        className="w-full h-full object-contain" 
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/thryvin-logo.png";
        }}
      />
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <LogoContent />
      </motion.div>
    );
  }

  return <LogoContent />;
};

export default ThryvinLogo;