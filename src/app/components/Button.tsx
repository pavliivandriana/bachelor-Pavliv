import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const MotionButton = motion.button;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles = 'rounded-2xl font-medium transition-all duration-200 inline-flex items-center justify-center gap-2';

    const variants = {
      primary: 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02]',
      secondary: 'bg-secondary text-secondary-foreground hover:shadow-lg hover:shadow-secondary/30 hover:scale-[1.02]',
      outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground',
      ghost: 'text-foreground hover:bg-muted'
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <MotionButton
        ref={ref}
        whileHover={{ scale: variant === 'ghost' ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';
