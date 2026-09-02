import { useEffect, useState, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function CountUp({ end, duration = 2, prefix = '', suffix = '', decimals = 0 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const [displayValue, setDisplayValue] = useState('0');
  
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(end);
    }
  }, [end, isInView, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      let formatted = latest;
      if (decimals === 0) {
        formatted = Math.round(latest);
      } else {
        formatted = parseFloat(latest.toFixed(decimals));
      }
      
      // Add commas for thousands
      const strValue = formatted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      setDisplayValue(strValue);
    });

    return () => unsubscribe();
  }, [springValue, decimals]);

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
}
