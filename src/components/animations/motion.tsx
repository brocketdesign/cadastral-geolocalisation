import { type ReactNode, useRef } from 'react';
import {
  motion,
  useInView,
  useSpring,
  useMotionValue,
  type Variant,
} from 'framer-motion';
import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Fade-in on scroll                                                  */
/* ------------------------------------------------------------------ */

type Direction = 'up' | 'down' | 'left' | 'right';

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

const directionOffset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
};

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  amount = 0.3,
}: FadeInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });
  const offset = directionOffset[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stagger container                                                  */
/* ------------------------------------------------------------------ */

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}

const containerVariants = (stagger: number, delay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export function StaggerContainer({
  children,
  className,
  stagger = 0.1,
  delay = 0,
  once = true,
  amount = 0.2,
}: StaggerProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });

  return (
    <motion.div
      ref={ref}
      variants={containerVariants(stagger, delay)}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stagger item (child of StaggerContainer)                           */
/* ------------------------------------------------------------------ */

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}

const itemVariants = (direction: Direction): { hidden: Variant; visible: Variant } => {
  const offset = directionOffset[direction];
  return {
    hidden: { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
};

export function StaggerItem({ children, className, direction = 'up' }: StaggerItemProps) {
  return (
    <motion.div variants={itemVariants(direction)} className={className}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scale on scroll                                                    */
/* ------------------------------------------------------------------ */

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  once = true,
}: ScaleInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

interface CounterProps {
  value: string; // e.g. "2 500+" or "99.9%"
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, className, duration = 2 }: CounterProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  // Extract the numeric part
  const numericStr = value.replace(/[^0-9.,]/g, '').replace(/\s/g, '').replace(',', '.');
  const target = parseFloat(numericStr) || 0;
  const prefix = value.match(/^[^0-9]*/)?.[0] || '';
  const suffix = value.match(/[^0-9.,]*$/)?.[0] || '';
  const isDecimal = numericStr.includes('.');
  const hasSpaces = /\d\s\d/.test(value);

  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) {
      motionVal.set(target);
    }
  }, [inView, motionVal, target]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v: number) => {
      let formatted: string;
      if (isDecimal) {
        formatted = v.toFixed(1);
      } else {
        const rounded = Math.round(v);
        formatted = hasSpaces
          ? rounded.toLocaleString('fr-FR')
          : rounded.toString();
      }
      setDisplay(formatted);
    });
    return unsubscribe;
  }, [spring, isDecimal, hasSpaces]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating / pulse decoration                                        */
/* ------------------------------------------------------------------ */

interface FloatingProps {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
}

export function Floating({ children, className, y = 10, duration = 3 }: FloatingProps) {
  return (
    <motion.div
      animate={{ y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blur-in text                                                       */
/* ------------------------------------------------------------------ */

interface BlurInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function BlurIn({ children, delay = 0, className }: BlurInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(12px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
