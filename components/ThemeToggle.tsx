
import React from 'react';
import { useTheme } from '../hooks/useTheme';

const SunIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);


export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-text-secondary hover:text-primary hover:bg-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface transition-all duration-300 ease-in-out"
      aria-label={`Mudar para o modo ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      <div className="relative w-6 h-6 overflow-hidden">
          <SunIcon className={`absolute inset-0 w-full h-full transform transition-all duration-500 ease-in-out ${theme === 'light' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}/>
          <MoonIcon className={`absolute inset-0 w-full h-full transform transition-all duration-500 ease-in-out ${theme === 'dark' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'}`}/>
      </div>
    </button>
  );
};
