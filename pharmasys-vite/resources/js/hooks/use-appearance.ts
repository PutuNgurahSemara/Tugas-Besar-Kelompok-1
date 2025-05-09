import { useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const APPEARANCE_KEY = 'vite-ui-appearance';

/**
 * Hook untuk mengatur tema tampilan (light/dark/system)
 */
export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>(() => {
    if (typeof window === 'undefined') return 'system';
    
    const savedAppearance = localStorage.getItem(APPEARANCE_KEY) as Appearance;
    return savedAppearance || 'system';
  });

  const updateAppearance = (value: Appearance) => {
    setAppearance(value);
    localStorage.setItem(APPEARANCE_KEY, value);
    
    applyAppearance(value);
  };

  useEffect(() => {
    applyAppearance(appearance);
    
    // Listener untuk perubahan tema sistem
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (appearance === 'system') {
        applySystemAppearance();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [appearance]);

  return { appearance, updateAppearance };
}

// Fungsi untuk menerapkan tema sesuai dengan nilai appearance
function applyAppearance(appearance: Appearance) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  
  if (appearance === 'system') {
    applySystemAppearance();
  } else {
    root.classList.add(appearance);
  }
}

// Fungsi untuk menerapkan tema berdasarkan preferensi sistem
function applySystemAppearance() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
} 