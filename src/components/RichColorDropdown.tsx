"use client";

import { useState, useRef, useEffect } from 'react';

interface ColorOption {
  name: string;
  value: string;
}

interface RichColorDropdownProps {
  options: ColorOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

export default function RichColorDropdown({ options, value, onChange, disabled = false, label }: RichColorDropdownProps) {
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
        <div className="flex items-center gap-2 min-w-0">
          <div 
            className="w-4 h-4 rounded border border-slate-300 flex-shrink-0"
            style={{ backgroundColor: selectedOption?.value || '#000000' }}
          />
          <span className="font-medium truncate">
            {label ? `${label}: ${selectedOption?.name || 'Select'}` : (selectedOption?.name || 'Select color')}
          </span>
        </div>
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
              className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                option.value === value ? 'bg-summit-sage/10' : ''
              }`}
            >
              <div 
                className="w-4 h-4 rounded border border-slate-300 flex-shrink-0"
                style={{ backgroundColor: option.value }}
              />
              <span 
                className="font-medium flex-1"
                style={{ color: option.value }}
              >
                {option.name}
              </span>
              {option.value === value && (
                <svg className="w-4 h-4 text-summit-sage flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
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