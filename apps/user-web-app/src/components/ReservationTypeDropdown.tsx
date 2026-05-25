'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ReservationTypeDropdown({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'Satna/dnevna', label: 'Satna/dnevna' },
    { value: 'Mjesečna', label: 'Mjesečna' },
  ];

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || options[0].label;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none flex-1 text-left"
        >
          {displayText}
        </button>
        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-1 space-y-0" style={{ width: 'min(400px, calc(100vw - 32px))', transform: 'translateX(-50%)' }}>
          {options.map((opt, idx) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-0.5 rounded text-sm font-medium text-gray-900 bg-white hover:bg-gray-50 transition-colors ${
                idx < options.length - 1 ? 'border-b border-gray-200' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
