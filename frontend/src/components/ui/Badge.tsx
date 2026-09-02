import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'pending' | 'verified' | 'critical' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const baseStyle = "inline-flex items-center px-2 py-0.5 text-xs font-sans font-bold uppercase tracking-wider border";
  
  const variants = {
    pending: "bg-pending/10 text-pending border-pending/30",
    verified: "bg-verified/10 text-verified border-verified/30",
    critical: "bg-critical/10 text-critical border-critical/30",
    neutral: "bg-paper text-ink border-rule",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
