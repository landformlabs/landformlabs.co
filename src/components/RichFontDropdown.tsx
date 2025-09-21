"use client";

import { useState, useRef, useEffect } from 'react';

interface FontOption {
  name: string;
  value: string;
  cssFont: string;
}

interface RichFontDropdownProps {
  options: FontOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function RichFontDropdown({ options, value, onChange, disabled = false }: RichFontDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border border-slate-300 rounded text-sm focus:border-summit-sage focus:ring-1 focus:ring-summit-sage flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white hover:border-slate-400'
        }`}
      >
        <span 
          className="font-medium truncate"
          style={{ fontFamily: selectedOption?.cssFont || 'inherit' }}
        >
          {selectedOption?.name || 'Select font'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center transition-colors ${
                option.value === value ? 'bg-summit-sage/10 text-summit-sage' : 'text-slate-700'
              }`}
            >
              <span 
                className="font-medium"
                style={{ fontFamily: option.cssFont }}
              >
                {option.name}
              </span>
              {option.value === value && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}