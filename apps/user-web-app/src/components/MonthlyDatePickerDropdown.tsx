'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  startDate: string;
  onStartDateChange: (value: string) => void;
}

export function MonthlyDatePickerDropdown({ startDate, onStartDateChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date(startDate));
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    const months = ['Siječanj', 'Februari', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
    return months[date.getMonth()];
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(displayMonth);
    selected.setDate(day);
    const y = selected.getFullYear(), mo = String(selected.getMonth() + 1).padStart(2, '0'), d = String(day).padStart(2, '0');
    onStartDateChange(`${y}-${mo}-${d}`);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(displayMonth);
  const firstDay = getFirstDayOfMonth(displayMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthYear = `${getMonthName(displayMonth)} ${displayMonth.getFullYear()}`;
  const selectedDate = new Date(startDate).getDate();
  const selectedMonth = new Date(startDate).getMonth();
  const selectedYear = new Date(startDate).getFullYear();

  return (
    <div ref={dropdownRef} className="flex-1 relative">
      <label className="text-xs font-semibold text-gray-400 mb-0.5 leading-none block">Monthly Parking Start Date</label>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-transparent border-none text-sm font-medium text-gray-900 p-0 focus:outline-none cursor-pointer leading-none flex-1 text-left"
        >
          {formatDisplay(startDate)}
        </button>
        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-xl z-50 p-4 w-full">
          {/* Header */}
          <div className="text-center mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-2">Full Month / Puni Mjesec</div>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1))}
                className="text-lg font-semibold text-gray-600 hover:text-gray-900 w-6 h-6 flex items-center justify-center"
              >
                &lt;
              </button>
              <div className="text-sm font-semibold text-gray-900">{monthYear}</div>
              <button
                onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1))}
                className="text-lg font-semibold text-gray-600 hover:text-gray-900 w-6 h-6 flex items-center justify-center"
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 h-6 flex items-center justify-center">
                {day}
              </div>
            ))}

            {/* Empty days */}
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {days.map((day) => {
              const isSelected =
                day === selectedDate && displayMonth.getMonth() === selectedMonth && displayMonth.getFullYear() === selectedYear;
              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(day)}
                  className={`h-6 text-xs rounded transition-colors ${
                    isSelected
                      ? 'bg-[#5F3DFC] text-white font-semibold'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
