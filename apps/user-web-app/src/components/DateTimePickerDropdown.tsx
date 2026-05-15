'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

const toLocalISOString = (date: Date) => {
  const y = date.getFullYear(), mo = String(date.getMonth() + 1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  const h = String(date.getHours()).padStart(2,'0'), m = String(date.getMinutes()).padStart(2,'0');
  return `${y}-${mo}-${d}T${h}:${m}`;
};

export function DateTimePickerDropdown({ startTime, endTime, onStartTimeChange, onEndTimeChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse local time strings directly
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const getLocalTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDisplay = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = getLocalTimeString(d);
    return `${day} ${month} · ${time}`;
  };

  // Format display
  const displayText = `${formatDisplay(startTime)} → ${formatDisplay(endTime)}`;

  // Close dropdown on click outside
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

  // Generate date options for next 30 days
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const formatted = date.toISOString().slice(0, 10);
      const label = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      dates.push({ value: formatted, label });
    }
    return dates;
  };

  // Generate time options (every 30 min)
  const generateTimeOptions = () => {
    const times: Array<{ value: string; label: string }> = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        times.push({ value: timeStr, label: timeStr });
      }
    }
    return times;
  };

  const handleStartDateChange = (newDate: string) => {
    const [year, month, day] = newDate.split('-').map(Number);
    const updated = new Date(startDate);
    updated.setFullYear(year, month - 1, day);
    onStartTimeChange(toLocalISOString(updated));
  };

  const handleStartTimeChange = (newTime: string) => {
    const [hours, minutes] = newTime.split(':').map(Number);
    const updated = new Date(startDate);
    updated.setHours(hours, minutes, 0, 0);
    onStartTimeChange(toLocalISOString(updated));
  };

  const handleEndDateChange = (newDate: string) => {
    const [year, month, day] = newDate.split('-').map(Number);
    const updated = new Date(endDate);
    updated.setFullYear(year, month - 1, day);
    onEndTimeChange(toLocalISOString(updated));
  };

  const handleEndTimeChange = (newTime: string) => {
    const [hours, minutes] = newTime.split(':').map(Number);
    const updated = new Date(endDate);
    updated.setHours(hours, minutes, 0, 0);
    onEndTimeChange(toLocalISOString(updated));
  };

  return (
    <div ref={dropdownRef} className="flex-1 relative">
      {/* Label */}
      <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none block">Start → End Time</label>

      {/* Display button with dropdown indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none flex-1 text-left"
        >
          {displayText}
        </button>
        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-3 space-y-3" style={{ width: '400px', transform: 'translateX(-50%)' }}>
          {/* Start Date and Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
              <select
                value={startDate.toISOString().slice(0, 10)}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {generateDateOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
              <select
                value={getLocalTimeString(startDate)}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {generateTimeOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
              <select
                value={endDate.toISOString().slice(0, 10)}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {generateDateOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
              <select
                value={getLocalTimeString(endDate)}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
              >
                {generateTimeOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-black text-white font-semibold text-xs py-2 rounded hover:bg-gray-900 transition-colors"
          >
            Potvrdi
          </button>
        </div>
      )}
    </div>
  );
}
