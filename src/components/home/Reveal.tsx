import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export const Reveal = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        element.classList.add('is-visible');
        observer.disconnect();
      }
    }, { threshold: 0.08 });
    element.classList.add('vb-reveal-ready');
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`vb-reveal ${className}`}>{children}</div>;
};
