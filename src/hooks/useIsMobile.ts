import { useState, useEffect } from 'react';

/**
 * Custom hook to reactively check if the current screen width is below a mobile breakpoint.
 * Uses window.matchMedia for optimal performance.
 * 
 * @param breakpoint Breakpoint width in pixels (defaults to 768px matching Tailwind's md breakpoint)
 * @returns boolean true if screen size matches mobile layout
 */
export const useIsMobile = (breakpoint = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // Modern browsers support addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaQueryChange);
    } else {
      // Fallback for older Safari and legacy browsers
      mediaQuery.addListener(handleMediaQueryChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      } else {
        mediaQuery.removeListener(handleMediaQueryChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
};
