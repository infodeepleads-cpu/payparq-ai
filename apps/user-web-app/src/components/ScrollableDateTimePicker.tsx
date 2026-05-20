'use client';

import { useState, useRef, useEffect } from 'react';

interface ScrollableDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  subtitle: string;
  step: string;
}

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;

export function ScrollableDateTimePicker({
  value,
  onChange,
  onConfirm,
  onCancel,
  title,
  subtitle,
  step,
}: ScrollableDateTimePickerProps) {
  const now = new Date();
  const defaultTime = new Date(now);
  defaultTime.setHours(defaultTime.getHours() + 3);
  defaultTime.setMinutes(0);

  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : defaultTime);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);

  const generateDates = () => {
    const dates = [];
    for (let i = -7; i <= 90; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const generateTimes = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push({ h, m, display: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` });
      }
    }
    return times;
  };

  const dates = generateDates();
  const times = generateTimes();

  const handleDateScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newOffset = Math.max(0, Math.min(dates.length - 1, Math.round(-dateOffset / ITEM_HEIGHT) + direction));
    setDateOffset(-newOffset * ITEM_HEIGHT);
    const selectedDateObj = dates[newOffset];
    const updated = new Date(selectedDate);
    updated.setFullYear(selectedDateObj.getFullYear());
    updated.setMonth(selectedDateObj.getMonth());
    updated.setDate(selectedDateObj.getDate());
    setSelectedDate(updated);
    updateValue(updated);
  };

  const handleTimeScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newOffset = Math.max(0, Math.min(times.length - 1, Math.round(-timeOffset / ITEM_HEIGHT) + direction));
    setTimeOffset(-newOffset * ITEM_HEIGHT);
    const selectedTime = times[newOffset];
    const updated = new Date(selectedDate);
    updated.setHours(selectedTime.h);
    updated.setMinutes(selectedTime.m);
    setSelectedDate(updated);
    updateValue(updated);
  };

  const updateValue = (date: Date) => {
    const isoString = date.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const weekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' }).format(date);
    return `${weekday}, ${day}. ${month}.`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-3 md:p-0">
      <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-3xl p-4 md:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1 md:space-y-2">
          <div className="text-xs font-semibold text-black/50 uppercase tracking-wide">{step}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-black">{title}</h2>
          <p className="text-xs md:text-sm text-black/60">{subtitle}</p>
        </div>

        {/* Scrollable Pickers */}
        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold text-black/50 mb-2 block uppercase tracking-wide">Datum</label>
            <div
              ref={dateScrollRef}
              onWheel={handleDateScroll}
              className="relative h-32 md:h-40 bg-gradient-to-b from-black/5 via-transparent to-black/5 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-14 md:h-16 -translate-y-1/2 border-t-2 border-b-2 border-black/20"></div>
              </div>
              <div
                className="transition-transform duration-300 ease-out"
                style={{ transform: `translateY(calc(-50% + ${ITEM_HEIGHT * 2}px ${dateOffset}px))` }}
              >
                {dates.map((date, i) => (
                  <div
                    key={i}
                    className="h-14 md:h-16 flex items-center justify-center text-sm md:text-base font-semibold text-black/70 hover:text-black transition-colors"
                  >
                    {formatDate(date)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-xs font-semibold text-black/50 mb-2 block uppercase tracking-wide">Vrijeme</label>
            <div
              ref={timeScrollRef}
              onWheel={handleTimeScroll}
              className="relative h-32 md:h-40 bg-gradient-to-b from-black/5 via-transparent to-black/5 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-14 md:h-16 -translate-y-1/2 border-t-2 border-b-2 border-black/20"></div>
              </div>
              <div
                className="transition-transform duration-300 ease-out"
                style={{ transform: `translateY(calc(-50% + ${ITEM_HEIGHT * 2}px ${timeOffset}px))` }}
              >
                {times.map((time, i) => (
                  <div
                    key={i}
                    className="h-14 md:h-16 flex items-center justify-center text-xl md:text-2xl font-bold text-black/70 hover:text-black transition-colors tabular-nums"
                  >
                    {time.display}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Display */}
        <div className="text-xs md:text-sm text-black/60 text-center px-2 py-2 bg-black/5 rounded-xl">
          ✓ {selectedDate.toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onConfirm}
            className="w-full px-5 py-3 md:py-4 bg-black text-white font-bold rounded-2xl hover:bg-gray-900 active:scale-95 transition-all"
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
