import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './GlassCard';

interface AccordionSectionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

export default function AccordionSection({ title, content, defaultOpen = false }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-black/10 dark:border-white/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
      >
        <h3 className="text-xl font-display font-semibold text-nw-text-light dark:text-nw-text-dark group-hover:text-nw-primary dark:group-hover:text-nw-primary-light transition-colors">
          {title}
        </h3>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-nw-text-light-muted dark:text-nw-text-dark-muted transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden text-nw-text-light-muted dark:text-nw-text-dark-muted font-sans leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
}
