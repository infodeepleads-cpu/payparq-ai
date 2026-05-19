'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollableDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  subtitle: string;
  step: string;
}

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
  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : now);
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const timeScrollRef = useRef<HTMLDivElement>(null);

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

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
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

  const updateValue = (date: Date) => {
    const isoString = date.toISOString().slice(0, 16);
    onChange(isoString);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hr-HR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white w-full md:w-96 rounded-t-3xl md:rounded-3xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold text-black/60 uppercase tracking-wide">{step}</div>
          <h2 className="text-3xl font-bold text-black">{title}</h2>
          <p className="text-sm text-black/60">{subtitle}</p>
        </div>

        {/* Scrollable Pickers */}
        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="text-xs font-semibold text-black/60 mb-2 block">DATUM</label>
            <div className="border-2 border-gray-300 rounded-2xl p-4 h-32 flex items-center justify-center overflow-hidden bg-gray-50">
              <div className="flex gap-2 justify-center items-center">
                {/* Previous Date */}
                {selectedDate.getTime() > now.getTime() && (
                  <button
                    onClick={() => {
                      const prev = new Date(selectedDate);
                      prev.setDate(prev.getDate() - 1);
                      handleDateSelect(prev);
                    }}
                    className="opacity-40 text-center min-w-[80px]"
                  >
                    <div className="text-xs text-black/40">{formatDate(new Date(selectedDate.getTime() - 86400000))}</div>
                  </button>
                )}

                {/* Current Date */}
                <div className="bg-black rounded-xl px-4 py-3 text-white text-center min-w-[100px]">
                  <div className="text-sm font-bold">{formatDate(selectedDate)}</div>
                  <div className="text-xs opacity-80">{selectedDate.getDate()}. {String(selectedDate.getMonth() + 1).padStart(2, '0')}.</div>
                </div>

                {/* Next Date */}
                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    handleDateSelect(next);
                  }}
                  className="opacity-40 text-center min-w-[80px]"
                >
                  <div className="text-xs text-black/40">{formatDate(new Date(selectedDate.getTime() + 86400000))}</div>
                </button>
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div>
            <label className="text-xs font-semibold text-black/60 mb-2 block">VRIJEME</label>
            <div className="border-2 border-gray-300 rounded-2xl p-4 h-24 flex items-center justify-center bg-gray-50">
              <div className="flex gap-4 justify-center items-center">
                {/* Hour Column */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">
                    {String(selectedDate.getHours()).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-black/40 mt-1">sat</div>
                </div>

                {/* Separator */}
                <div className="text-2xl font-bold text-black/40">:</div>

                {/* Minute Column */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-black">
                    {String(selectedDate.getMinutes()).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-black/40 mt-1">min</div>
                </div>
              </div>
            </div>

            {/* Time Quick Select */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[0, 6, 12, 18].map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeSelect(hour, 0)}
                  className={`py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedDate.getHours() === hour
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  {String(hour).padStart(2, '0')}:00
                </button>
              ))}
            </div>

            {/* Minute Quick Select */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[0, 15, 30, 45].map((minute) => (
                <button
                  key={minute}
                  onClick={() =>
                    handleTimeSelect(selectedDate.getHours(), minute)
                  }
                  className={`py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedDate.getMinutes() === minute
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                >
                  :{String(minute).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Display */}
        {value && (
          <div className="text-sm text-black/70 text-center px-2">
            ✓ Odabrano: <span className="font-semibold">{new Date(value).toLocaleString('hr-HR')}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onConfirm}
            disabled={!value}
            className="w-full px-6 py-4 bg-black text-white text-lg font-bold rounded-2xl hover:bg-gray-900 disabled:opacity-30 transition-all"
          >
            Nastavi →
          </button>
          <button
            onClick={onCancel}
            className="w-full px-6 py-3 border-2 border-gray-300 rounded-2xl text-black font-semibold hover:bg-gray-50 transition-colors"
          >
            Otkaži
          </button>
        </div>
      </div>
    </div>
  );
}
