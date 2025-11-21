import { useEffect } from 'react';

// Vibration API hook
export const useVibration = () => {
  const isSupported = 'vibrate' in navigator;

  const vibrate = (pattern: number | number[]) => {
    if (isSupported) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.error('Vibration failed:', error);
      }
    }
  };

  const vibratePattern = (intervals: number[], intensities: number[]) => {
    if (!isSupported) return;

    const pattern: number[] = [];
    intervals.forEach((interval, index) => {
      const intensity = intensities[index] || 0;
      if (intensity > 0) {
        // Convert interval to milliseconds and add vibration duration
        const duration = Math.floor(interval * 1000);
        pattern.push(duration);
        // Add pause between vibrations
        if (index < intervals.length - 1) {
          pattern.push(100);
        }
      }
    });

    vibrate(pattern);
  };

  const stop = () => {
    if (isSupported) {
      navigator.vibrate(0);
    }
  };

  return {
    isSupported,
    vibrate,
    vibratePattern,
    stop,
  };
};
