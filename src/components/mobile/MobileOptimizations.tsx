import React, { useEffect } from 'react';
import { useCapacitor } from '../../hooks/useCapacitor';

interface MobileOptimizationsProps {
  children: React.ReactNode;
}

export function MobileOptimizations({ children }: MobileOptimizationsProps) {
  const { isNative, isAndroid } = useCapacitor();

  useEffect(() => {
    if (isNative) {
      // Add mobile-specific styles
      document.body.classList.add('mobile-app');
      
      if (isAndroid) {
        document.body.classList.add('android-app');
      }

      // Prevent zoom on input focus
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }

      // Prevent pull-to-refresh
      document.body.style.overscrollBehavior = 'none';
      
      // Add safe area padding for notched devices
      const root = document.documentElement;
      root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)');
      root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)');
    }

    return () => {
      if (isNative) {
        document.body.classList.remove('mobile-app', 'android-app');
      }
    };
  }, [isNative, isAndroid]);

  return <>{children}</>;
}