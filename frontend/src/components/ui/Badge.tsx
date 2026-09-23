import React from 'react';
import { cn } from './GlassCard';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export default function Badge({ children, variant = 'secondary', className, ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-nw-primary/20 text-nw-primary dark:bg-nw-primary/30 dark:text-nw-primary-light border-nw-primary/30',
    secondary: 'bg-black/5 text-nw-text-light-muted dark:bg-white/10 dark:text-nw-text-dark-muted border-black/10 dark:border-white/10',
    success: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-500/30 dark:text-emerald-400 border-emerald-500/30',
    warning: 'bg-nw-warning/20 text-yellow-700 dark:bg-nw-warning/30 dark:text-yellow-400 border-nw-warning/30',
    danger: 'bg-nw-danger/20 text-red-700 dark:bg-nw-danger/30 dark:text-red-400 border-nw-danger/30',
  };

  return (
    <span 
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
