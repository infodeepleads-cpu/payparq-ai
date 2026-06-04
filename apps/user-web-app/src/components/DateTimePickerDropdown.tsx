'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Props {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  resetTrigger?: number;
}

const toLocalISOString = (date: Date) => {
  const y = date.getFullYear(), mo = String(date.getMonth() + 1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  const h = String(date.getHours()).padStart(2,'0'), m = String(date.getMinutes()).padStart(2,'0');
  return `${y}-${mo}-${d}T${h}:${m}`;
};

export function DateTimePickerDropdown({ startTime, endTime, onStartTimeChange, onEndTimeChange, resetTrigger }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when reset trigger changes
  useEffect(() => {
    setIsOpen(false);
  }, [resetTrigger]);

  // Calculate fixed position when opening
  const handleOpen = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        width: Math.min(400, window.innerWidth - 32),
      });
    }
    setIsOpen(prev => !prev);
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        const dropdown = document.getElementById('datetime-picker-dropdown');
        if (dropdown && !dropdown.contains(target)) {
          setIsOpen(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  const displayText = `${formatDisplay(startTime)} → ${formatDisplay(endTime)}`;

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const formatted = date.toISOString().slice(0, 10);
      const label = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
      dates.push({ value: formatted, label });
    }
    return dates;
  };

  const generateTimeOptions = () => {
    const times: Array<{ value: string; label: string }> = [];
    for (let h = 0; h < 24; h++) {
      for (let m of [0, 15, 30, 45]) {
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

  const dropdown = isOpen && dropdownPos ? createPortal(
    <div
      id="datetime-picker-dropdown"
      className="bg-white border border-gray-300 rounded-lg shadow-xl p-3 space-y-3"
      style={{
        position: 'fixed',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
          <select
            value={startDate.toISOString().slice(0, 10)}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
            translate="no"
          >
            {generateDateOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
          <select
            value={endDate.toISOString().slice(0, 10)}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
            translate="no"
          >
            {generateDateOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="w-full bg-black text-white font-semibold text-xs py-2 rounded hover:bg-gray-900 transition-colors"
      >
        Potvrdi
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex-1 relative">
      <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none block">Start → End Time</label>
      <div className="flex items-center justify-between">
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none flex-1 text-left"
          translate="no"
        >
          {displayText}
        </button>
        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>
      {dropdown}
    </div>
  );
}
