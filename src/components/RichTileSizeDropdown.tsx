"use client";

import { useState, useRef, useEffect } from 'react';

interface TileSizeOption {
  value: 'basecamp' | 'ridgeline' | 'summit';
  name: string;
  dimensions: string;
  price: string;
  description: string;
}

interface RichTileSizeDropdownProps {
  value: 'basecamp' | 'ridgeline' | 'summit';
  onChange: (value: 'basecamp' | 'ridgeline' | 'summit') => void;
  disabled?: boolean;
}

const tileSizeOptions: TileSizeOption[] = [
  {
    value: 'basecamp',
    name: 'Basecamp',
    dimensions: '100mm × 100mm',
    price: '$20',
    description: 'Perfect for desks and small spaces'
  },
  {
    value: 'ridgeline',
    name: 'Ridgeline',
    dimensions: '155mm × 155mm',
    price: '$40',
    description: 'Great balance of size and detail'
  },
  {
    value: 'summit',
    name: 'Summit',
    dimensions: '210mm × 210mm',
    price: '$60',
    description: 'Maximum impact and detail'
  }
];

export default function RichTileSizeDropdown({ value, onChange, disabled = false }: RichTileSizeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = tileSizeOptions.find(option => option.value === value);

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
        className={`w-full px-4 py-3 text-left border border-slate-300 rounded-lg focus:border-summit-sage focus:ring-1 focus:ring-summit-sage flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white hover:border-slate-400'
        }`}
      >
        <div className="min-w-0">
          <div className="font-semibold text-basalt">
            {selectedOption?.name} {selectedOption?.dimensions}
          </div>
          <div className="text-sm text-slate-600">
            {selectedOption?.price} - {selectedOption?.description}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 transition-transform flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden">
          {tileSizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                option.value === value ? 'bg-summit-sage/10 border-l-4 border-l-summit-sage' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-basalt">
                    {option.name} ({option.dimensions})
                  </div>
                  <div className="text-sm text-slate-600">
                    {option.description}
                  </div>
                </div>
                <div className="text-lg font-bold text-summit-sage ml-3">
                  {option.price}
                </div>
              </div>
              {option.value === value && (
                <div className="flex justify-end mt-2">
                  <svg className="w-4 h-4 text-summit-sage" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}