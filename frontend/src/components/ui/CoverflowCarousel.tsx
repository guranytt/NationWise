import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { cn } from './GlassCard';

export interface CoverflowCarouselProps {
  sections: { title: string; content: string; order: number }[];
}

const CoverflowCarousel: React.FC<CoverflowCarouselProps> = ({ sections }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = useCallback(() => {
    if (activeIndex < sections.length - 1) {
      setDirection(1);
      setActiveIndex((prev) => prev + 1);
    }
  }, [activeIndex, sections.length]);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex((prev) => prev - 1);
    }
  }, [activeIndex]);

  const handleDotClick = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const activeSection = sections[activeIndex];
  const paragraphs = useMemo(() => activeSection?.content.split('\n\n').filter(Boolean) || [], [activeSection]);

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold) {
      handleNext();
    } else if (info.offset.x > threshold) {
      handlePrev();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full flex flex-col items-center gap-8 py-8 overflow-hidden"
    >
      {/* 3D Carousel Container */}
      <div className="relative w-full h-[300px] flex items-center justify-center [perspective:1200px]">
        {sections.map((section, index) => {
          const isActive = index === activeIndex;
          const offset = index - activeIndex;
          const absOffset = Math.abs(offset);
          const sign = Math.sign(offset);

          const scale = isActive ? 1 : Math.max(0.6, 0.75 - (absOffset - 1) * 0.15);
          const rotateY = isActive ? 0 : -45 * sign;
          const x = isActive ? 0 : sign * (200 + (absOffset - 1) * 80);
          const z = isActive ? 0 : -200 - (absOffset - 1) * 100;
          const opacity = isActive ? 1 : Math.max(0, 0.5 - (absOffset - 1) * 0.2);
          const zIndex = 100 - absOffset;
          
          return (
            <motion.div
              key={section.order}
              className={cn(
                "absolute cursor-pointer w-[320px] h-[240px] flex flex-col justify-center items-center text-center p-6",
                "bg-white/70 border border-black/10 backdrop-blur-xl shadow-sm rounded-2xl dark:bg-white/5 dark:border-white/10",
                isActive && "shadow-[0_0_30px_rgba(5,150,105,0.15)]",
                "hidden md:flex" // Hide on mobile for simplification, handle mobile differently
              )}
              initial={false}
              animate={{
                x,
                z,
                rotateY,
                scale,
                opacity,
                zIndex
              }}
              whileHover={{ scale: scale * 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => handleDotClick(index)}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
            >
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-nw-text-light dark:text-nw-text-dark">
                {section.order}
              </div>
              <h3 className="text-xl font-display font-semibold text-nw-text-light dark:text-nw-text-dark">
                {section.title}
              </h3>
            </motion.div>
          );
        })}

        {/* Mobile fallback card */}
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={`mobile-${activeIndex}`}
            custom={direction}
            className={cn(
              "absolute w-[90%] h-[240px] flex md:hidden flex-col justify-center items-center text-center p-6",
              "bg-white/70 border border-black/10 backdrop-blur-xl shadow-sm rounded-2xl dark:bg-white/5 dark:border-white/10",
              "shadow-[0_0_30px_rgba(5,150,105,0.15)]"
            )}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-nw-text-light dark:text-nw-text-dark">
              {activeSection?.order}
            </div>
            <h3 className="text-xl font-display font-semibold text-nw-text-light dark:text-nw-text-dark">
              {activeSection?.title}
            </h3>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="absolute left-2 md:left-4 z-[110] w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-black/10 backdrop-blur-md dark:bg-black/50 dark:border-white/10 disabled:opacity-30 hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm"
          aria-label="Previous Section"
        >
          <svg className="w-5 h-5 text-nw-text-light dark:text-nw-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={handleNext}
          disabled={activeIndex === sections.length - 1}
          className="absolute right-2 md:right-4 z-[110] w-10 h-10 rounded-full flex items-center justify-center bg-white/50 border border-black/10 backdrop-blur-md dark:bg-black/50 dark:border-white/10 disabled:opacity-30 hover:bg-white/80 dark:hover:bg-white/10 transition-colors shadow-sm"
          aria-label="Next Section"
        >
          <svg className="w-5 h-5 text-nw-text-light dark:text-nw-text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {sections.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              idx === activeIndex 
                ? "bg-[#059669] w-6" // bg-nw-primary (#059669)
                : "bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40"
            )}
            aria-label={`Go to section ${idx + 1}`}
          />
        ))}
      </div>

      {/* Active Section Content */}
      <div className="w-full max-w-2xl px-6 min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4"
          >
            <motion.h4 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="text-2xl font-display font-semibold text-nw-text-light dark:text-nw-text-dark mb-2"
            >
              {activeSection?.title}
            </motion.h4>
            
            {paragraphs.map((para, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.2 + (i * 0.08) 
                }}
                className="text-nw-text-light-muted dark:text-nw-text-dark-muted font-sans leading-relaxed text-base md:text-lg"
              >
                {para}
              </motion.p>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CoverflowCarousel;
