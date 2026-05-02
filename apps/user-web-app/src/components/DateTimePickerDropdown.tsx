'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function DateTimePickerDropdown({ startTime, endTime, onStartTimeChange, onEndTimeChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [displayMonth, setDisplayMonth] = useState(new Date());

  // Parse dates from ISO strings
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const formatDisplay = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toTimeString().slice(0, 5);
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

  // Calendar component
  const Calendar = ({ date, onChange }: { date: Date; onChange: (d: Date) => void }) => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const isToday = (day: number | null) => {
      if (!day) return false;
      const today = new Date();
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    };

    const isSelected = (day: number | null) => {
      if (!day) return false;
      return day === date.getDate() && month === date.getMonth() && year === date.getFullYear();
    };

    return (
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setDisplayMonth(new Date(year, month - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-gray-900">{displayMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button
            onClick={() => setDisplayMonth(new Date(year, month + 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-xs mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center text-gray-500 font-semibold h-6 flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => {
                if (day) {
                  const newDate = new Date(year, month, day, date.getHours(), date.getMinutes());
                  onChange(newDate);
                }
              }}
              className={`h-6 flex items-center justify-center text-xs rounded-full transition ${
                day === null
                  ? 'text-gray-300'
                  : isSelected(day)
                    ? 'bg-[#5F3DFC] text-white font-semibold'
                    : isToday(day)
                      ? 'font-bold text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Time list component
  const TimeList = ({ value, onChange }: { value: Date; onChange: (d: Date) => void }) => {
    const timeListRef = useRef<HTMLDivElement>(null);
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        times.push({ h, m, display: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
      }
    }

    useEffect(() => {
      const selectedIndex = times.findIndex((t) => t.h === value.getHours() && t.m === value.getMinutes());
      if (selectedIndex !== -1 && timeListRef.current) {
        const selected = timeListRef.current.children[selectedIndex] as HTMLElement;
        selected?.scrollIntoView({ block: 'center' });
      }
    }, [isOpen]);

    return (
      <div ref={timeListRef} className="max-h-48 overflow-y-auto p-2">
        {times.map((t) => (
          <button
            key={t.display}
            onClick={() => {
              const newDate = new Date(value);
              newDate.setHours(t.h, t.m);
              onChange(newDate);
            }}
            className={`w-full text-center py-1 px-2 text-xs rounded mb-1 transition ${
              t.h === value.getHours() && t.m === value.getMinutes()
                ? 'bg-[#5F3DFC]/10 text-[#5F3DFC] font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t.display}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className="flex-1 relative">
      {/* Label */}
      <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none block">Start → End Time</label>

      {/* Display button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none w-full text-left"
      >
        {displayText}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 grid grid-cols-4 gap-0 overflow-hidden min-w-[600px]">
          {/* Start Date */}
          <div className="border-r border-gray-200">
            <div className="px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">Start Date</div>
            <Calendar date={startDate} onChange={(d) => {
              const newISO = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startDate.getHours(), startDate.getMinutes()).toISOString().slice(0, 16);
              onStartTimeChange(newISO);
            }} />
          </div>

          {/* Start Time */}
          <div className="border-r border-gray-200">
            <div className="px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">Start Time</div>
            <TimeList value={startDate} onChange={(d) => {
              const newISO = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), d.getHours(), d.getMinutes()).toISOString().slice(0, 16);
              onStartTimeChange(newISO);
            }} />
          </div>

          {/* End Date */}
          <div className="border-r border-gray-200">
            <div className="px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">End Date</div>
            <Calendar date={endDate} onChange={(d) => {
              const newISO = new Date(d.getFullYear(), d.getMonth(), d.getDate(), endDate.getHours(), endDate.getMinutes()).toISOString().slice(0, 16);
              onEndTimeChange(newISO);
            }} />
          </div>

          {/* End Time */}
          <div>
            <div className="px-2 py-2 border-b border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">End Time</div>
            <TimeList value={endDate} onChange={(d) => {
              const newISO = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), d.getHours(), d.getMinutes()).toISOString().slice(0, 16);
              onEndTimeChange(newISO);
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
