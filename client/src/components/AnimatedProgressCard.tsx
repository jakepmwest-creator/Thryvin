import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimatedProgressCardProps {
  title: string;
  currentValue: number;
  maxValue: number;
  icon?: React.ReactNode;
  className?: string;
  valueLabel?: string;
  progressColor?: string;
  progressGradient?: string;
  showChange?: boolean;
  previousValue?: number;
}

export function AnimatedProgressCard({
  title,
  currentValue,
  maxValue,
  icon,
  className = '',
  valueLabel = '',
  progressColor = '#3b82f6',
  progressGradient,
  showChange = false,
  previousValue
}: AnimatedProgressCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  
  // Calculate the percentage
  const percent = Math.min(100, Math.round((currentValue / maxValue) * 100));
  
  // Animate the value and percentage on mount and when they change
  useEffect(() => {
    // Reset to 0 if changing from one value to a very different one
    if (animatedValue > currentValue + 20) {
      setAnimatedValue(0);
      setAnimatedPercent(0);
    }
    
    const valueTimer = setTimeout(() => {
      setAnimatedValue(currentValue);
    }, 200);
    
    const percentTimer = setTimeout(() => {
      setAnimatedPercent(percent);
    }, 300);
    
    return () => {
      clearTimeout(valueTimer);
      clearTimeout(percentTimer);
    };
  }, [currentValue, percent]);
  
  // Calculate change percentage if showing change
  const getChangeIndicator = () => {
    if (!showChange || previousValue === undefined) return null;
    
    const change = currentValue - previousValue;
    const changePercent = previousValue ? Math.round((change / previousValue) * 100) : 100;
    
    if (change === 0) return null;
    
    return (
      <div className={`text-xs font-medium ml-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(changePercent)}%
      </div>
    );
  };
  
  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center mb-2">
        {icon && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
            {icon}
          </div>
        )}
        <h3 className="font-medium text-gray-800">{title}</h3>
      </div>
      
      <div className="flex items-baseline">
        <motion.div 
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={currentValue}
        >
          {animatedValue}
          <span className="text-sm font-normal text-gray-500 ml-1">/ {maxValue} {valueLabel}</span>
        </motion.div>
        {getChangeIndicator()}
      </div>
      
      <div className="mt-2 bg-gray-100 h-2 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full rounded-full ${progressGradient || ''}`} 
          style={{ 
            width: `${animatedPercent}%`,
            backgroundColor: progressGradient ? undefined : progressColor
          }}
          initial={{ width: 0 }}
          animate={{ width: `${animatedPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}