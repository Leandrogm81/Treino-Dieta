import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768; // Corresponds to md: in Tailwind

/**
 * A custom hook to detect if the app is being viewed on a mobile-sized screen.
 * @returns {boolean} True if the screen width is less than the mobile breakpoint.
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};
