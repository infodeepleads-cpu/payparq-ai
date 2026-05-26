'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  subtitle: string;
  step: string;
  initialDateTime?: string;
}

export function ScrollableDateTimePicker({
  value,
  onChange,
  onConfirm,
  onCancel,
  title,
  subtitle,
  step,
  initialDateTime,
}: ScrollableDateTimePickerProps) {
  const now = new Date();
  const baseTime = initialDateTime ? new Date(initialDateTime) : now;
  const defaultTime = new Date(baseTime);
  defaultTime.setHours(defaultTime.getHours() + 3);
  defaultTime.setMinutes(0);

  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : defaultTime);

  useEffect(() => {
    if (!value) {
      const isoString = defaultTime.toISOString().slice(0, 16);
      onChange(isoString);
    }
  }, [value]);
  const [viewMonth, setViewMonth] = useState<Date>(new Date(now.getFullYear(), now.getMonth()));
  const daysContainerRef = useRef<HTMLDivElement>(null);

  const updateValue = (date: Date) => {
    const isoString = date.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewMonth);
    newDate.setDate(day);
    newDate.setHours(selectedDate.getHours());
    newDate.setMinutes(selectedDate.getMinutes());
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    newDate.setMinutes(minute);
    setSelectedDate(newDate);
    updateValue(newDate);
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat('hr-HR', { month: 'long', year: 'numeric' }).format(viewMonth);
  const daysInMonth = getDaysInMonth(viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  const nextMonth = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));

  useEffect(() => {
    if (daysContainerRef.current && selectedDate.getMonth() === viewMonth.getMonth()) {
      const selectedButton = daysContainerRef.current.querySelector('[data-selected="true"]');
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [viewMonth]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-3">
      <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wide">{step}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-black">{title}</h2>
          <p className="text-xs md:text-sm text-black/60">{subtitle}</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          <h3 className="text-base md:text-lg font-semibold text-black capitalize flex-1 text-center">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Days Scroll */}
        <div
          ref={daysContainerRef}
          data-scrollable
          className="flex gap-2 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {days.map(day => {
            const isSelected =
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === viewMonth.getMonth() &&
              selectedDate.getFullYear() === viewMonth.getFullYear();

            return (
              <button
                key={day}
                data-selected={isSelected}
                onClick={() => handleDateSelect(day)}
                className={`flex-shrink-0 w-16 md:w-20 py-3 rounded-xl font-semibold transition-all ${
                  isSelected
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                <div className="text-sm md:text-xs text-opacity-70">{new Intl.DateTimeFormat('hr-HR', { weekday: 'short' }).format(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))}</div>
                <div className="text-lg md:text-xl font-bold">{day}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Time Preview */}
        <div className="bg-black/5 rounded-lg p-3 text-center">
          <div className="text-xs text-black/60 mb-1">Odabrano vrijeme:</div>
          <div className="text-2xl md:text-3xl font-bold text-black">
            {selectedDate.getDate()}. {new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(selectedDate)} {String(selectedDate.getHours()).padStart(2, '0')}:{String(selectedDate.getMinutes()).padStart(2, '0')}
          </div>
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-black/50 uppercase tracking-wide">Vrijeme</label>
          <div className="text-center text-3xl md:text-4xl font-bold text-black tabular-nums mb-3">
            {String(selectedDate.getHours()).padStart(2, '0')}:{String(selectedDate.getMinutes()).padStart(2, '0')}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 6, 12, 18].map(hour => (
              <button
                key={hour}
                onClick={() => handleTimeSelect(hour, 0)}
                className={`py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  selectedDate.getHours() === hour
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                {String(hour).padStart(2, '0')}:00
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 15, 30, 45].map(minute => (
              <button
                key={minute}
                onClick={() => handleTimeSelect(selectedDate.getHours(), minute)}
                className={`py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  selectedDate.getMinutes() === minute
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black hover:bg-black/10'
                }`}
              >
                :{String(minute).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!value && (
            <div className="text-xs text-black/60 text-center px-2 py-2 bg-blue-50 rounded-lg">
              ℹ️ Korišćenje zadane vrijednosti. Promijenite ako trebate drugačije vrijeme.
            </div>
          )}
          <button
            onClick={onConfirm}
            disabled={!value}
            className={`w-full px-5 py-3 md:py-4 font-bold rounded-2xl transition-all ${
              value
                ? 'bg-black text-white hover:bg-gray-900 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Nastavi →
          </button>
          <button
            onClick={onCancel}
            className="w-full px-5 py-3 md:py-4 border-2 border-black/10 text-black font-semibold rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
          >
            Otkaži
          </button>
        </div>
      </div>
    </div>
  );
}
