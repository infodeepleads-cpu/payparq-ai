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
  locale?: 'en' | 'hr';
  confirmLabel?: string;
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
  locale = 'hr',
  confirmLabel,
}: ScrollableDateTimePickerProps) {
  const now = new Date();
  const baseTime = initialDateTime ? new Date(initialDateTime) : now;
  const defaultTime = new Date(baseTime);
  defaultTime.setHours(defaultTime.getHours() + 3);
  defaultTime.setMinutes(0);

  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : defaultTime);

  const toLocalISO = (date: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
  };

  useEffect(() => {
    if (!value) {
      onChange(toLocalISO(defaultTime));
    }
  }, [value]);
  const [viewMonth, setViewMonth] = useState<Date>(new Date(now.getFullYear(), now.getMonth()));
  const daysContainerRef = useRef<HTMLDivElement>(null);

  const updateValue = (date: Date) => {
    onChange(toLocalISO(date));
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
          <div className="text-xs font-semibold text-black uppercase tracking-wide">{step}</div>
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
          <div className="text-xs text-black/60 mb-1">{locale === 'en' ? 'Selected time' : 'Odabrano vrijeme'}:</div>
          <div className="text-2xl md:text-3xl font-bold text-black">
            {selectedDate.getDate()}. {new Intl.DateTimeFormat('hr-HR', { month: 'long' }).format(selectedDate)} {String(selectedDate.getHours()).padStart(2, '0')}:{String(selectedDate.getMinutes()).padStart(2, '0')}
          </div>
        </div>

        {/* Time Picker - All 30-minute intervals (daytime first, nighttime last) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-black/50 uppercase tracking-wide">
            {locale === 'en' ? 'Time' : 'Vrijeme'}
          </label>
          <div className="text-center text-3xl md:text-4xl font-bold text-black tabular-nums mb-3">
            {String(selectedDate.getHours()).padStart(2, '0')}:{String(selectedDate.getMinutes()).padStart(2, '0')}
          </div>
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2" style={{ maxHeight: "108px", WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
            {Array.from({ length: 48 }, (_, i) => {
              const totalMinutes = (i * 30 + 6 * 60) % (24 * 60);
              const hour = Math.floor(totalMinutes / 60);
              const minute = totalMinutes % 60;
              const isSelected = selectedDate.getHours() === hour && selectedDate.getMinutes() === minute;
              return (
                <button
                  key={`${hour}:${minute}`}
                  onClick={() => handleTimeSelect(hour, minute)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!value && (
            <div className="text-xs text-black/60 text-center px-2 py-2 bg-blue-50 rounded-lg">
              ℹ️ {locale === 'en'
                ? 'Using default time. Change if you need different time.'
                : 'Korišćenje zadane vrijednosti. Promijenite ako trebate drugačije vrijeme.'}
            </div>
          )}
          <button
            onClick={onConfirm}
            disabled={!value}
            translate="no"
            className={`w-full px-5 py-3 md:py-4 font-bold rounded-2xl transition-all notranslate ${
              value
                ? 'bg-black text-white hover:bg-gray-900 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span className="notranslate" translate="no">
              {confirmLabel ?? (locale === 'en' ? 'Continue →' : 'Nastavi →')}
            </span>
          </button>
          <button
            onClick={onCancel}
            className="w-full px-5 py-3 md:py-4 border-2 border-black/10 text-black font-semibold rounded-2xl hover:bg-black/5 active:scale-95 transition-all"
          >
            {locale === 'en' ? 'Cancel' : 'Otkaži'}
          </button>
        </div>
      </div>
    </div>
  );
}
