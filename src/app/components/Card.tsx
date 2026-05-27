import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, glass = false, onClick }: CardProps) {
  const baseStyles = 'rounded-3xl p-6';
  const glassStyles = glass
    ? 'bg-card/60 backdrop-blur-xl border border-border shadow-xl'
    : 'bg-card shadow-lg';

  return (
    <motion.div
      whileHover={hover ? { y: -8, boxShadow: '0 20px 40px rgba(246, 166, 201, 0.2)' } : {}}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${glassStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
