import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Returnează `true` dacă viewport-ul curent este mai mic de 768px.
 * Se actualizează reactiv la redimensionarea ferestrei.
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
