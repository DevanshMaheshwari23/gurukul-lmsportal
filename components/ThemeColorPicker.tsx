'use client';

import React from 'react';
import { useTheme } from '../lib/ThemeContext';

const colors = [
  { name: 'indigo', color: 'bg-indigo-500' },
  { name: 'teal', color: 'bg-teal-500' },
  { name: 'purple', color: 'bg-purple-500' },
  { name: 'amber', color: 'bg-amber-500' },
  { name: 'rose', color: 'bg-rose-500' },
];

const ThemeColorPicker: React.FC = () => {
  const { accentColor, setAccentColor } = useTheme();

  React.useEffect(() => {
    document.documentElement.setAttribute('data-accent-color', accentColor);
  }, [accentColor]);

  return (
    <div className="flex space-x-2 items-center">
      <span className="text-xs text-gray-500 dark:text-gray-400">Theme:</span>
      <div className="flex space-x-1">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => setAccentColor(color.name as any)}
            className={`w-6 h-6 rounded-full transition-transform duration-200 ${color.color} ${
              accentColor === color.name 
                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600 scale-110' 
                : 'hover:scale-110'
            }`}
            aria-label={`Set theme to ${color.name}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ThemeColorPicker; 