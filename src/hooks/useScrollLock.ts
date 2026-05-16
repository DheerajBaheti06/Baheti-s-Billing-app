import { useEffect } from 'react';

export const useScrollLock = (lock: boolean) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    if (lock) {
      document.body.style.overflow = 'hidden';
      // To prevent content jump on some browsers due to scrollbar disappearing
      document.body.style.paddingRight = 'var(--removed-body-scrollbar-width, 0px)';
    } else {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '';
    };
  }, [lock]);
};
