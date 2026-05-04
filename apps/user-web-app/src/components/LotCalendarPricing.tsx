'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, X } from 'lucide-react';

interface LotCalendarPricingProps {
  lotId: string;
  lotName: string;
  lotAddress: string;
  lotCapacity: string;
  onBack: () => void;
}

interface DateConfig {
  date: string;
  capacity: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  priceMode: 'auto' | 'manual';
  price: number;
}

export function LotCalendarPricing({ lotId, lotName, lotAddress, lotCapacity, onBack }: LotCalendarPricingProps) {
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 4, 1));
  const [dateConfigs, setDateConfigs] = useState<Record<string, DateConfig>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!supabase) return;
        const { data: lot, error: err } = await supabase
          .from('locations')
          .select('verification_metadata')
          .eq('id', lotId)
          .single();

        if (err) throw err;
        if (lot?.verification_metadata?.dateConfigs) {
          setDateConfigs(lot.verification_metadata.dateConfigs);
        }
      } catch (err: any) {
        console.error('Failed to load lot data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lotId]);

  const croatianMonths = ['siječnja','veljače','ožujka','travnja','svibnja','lipnja','srpnja','kolovoza','rujna','listopada','studenog','prosinca'];
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const emptyBefore = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const getDateString = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDateConfig = (dateStr: string): DateConfig => {
    return dateConfigs[dateStr] || {
      date: dateStr,
      capacity: parseInt(lotCapacity),
      isOpen: true,
      openTime: '00:00',
      closeTime: '23:59',
      priceMode: 'auto',
      price: 0,
    };
  };

  const handleDateClick = (day: number) => {
    const dateStr = getDateString(day);
    setSelectedDate(dateStr);
  };

  const handleSaveDate = async (config: DateConfig) => {
    setDateConfigs((prev) => ({
      ...prev,
      [config.date]: config,
    }));

    try {
      if (!supabase) return;
      const { data: existing } = await supabase
        .from('locations')
        .select('verification_metadata')
        .eq('id', lotId)
        .single();

      const meta = existing?.verification_metadata || {};
      const newConfigs = { ...dateConfigs, [config.date]: config };

      await supabase
        .from('locations')
        .update({
          verification_metadata: {
            ...meta,
            dateConfigs: newConfigs,
          },
        })
        .eq('id', lotId);

      setSelectedDate(null);
    } catch (err: any) {
      console.error('Failed to save date config:', err.message);
    }
  };

  const handleCloseDate = async (dateStr: string) => {
    const newConfigs = { ...dateConfigs };
    delete newConfigs[dateStr];
    setDateConfigs(newConfigs);

    try {
      if (!supabase) return;
      const { data: existing } = await supabase
        .from('locations')
        .select('verification_metadata')
        .eq('id', lotId)
        .single();

      const meta = existing?.verification_metadata || {};
      await supabase
        .from('locations')
        .update({
          verification_metadata: {
            ...meta,
            dateConfigs: newConfigs,
          },
        })
        .eq('id', lotId);

      setSelectedDate(null);
    } catch (err: any) {
      console.error('Failed to delete date config:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5F3DFC] mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  const selectedDateConfig = selectedDate ? getDateConfig(selectedDate) : null;
  const selectedDay = selectedDate ? parseInt(selectedDate.split('-')[2]) : null;

  return (
    <div className="h-full bg-white flex flex-col w-full md:p-6 p-3 md:p-4">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{lotName}</h2>
        <p className="text-xs md:text-sm text-gray-600">{lotAddress} • Kapacitet: {lotCapacity} mjesta</p>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 overflow-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <button
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            className="text-[#5F3DFC] hover:text-[#4330c4] font-medium text-sm md:text-base"
          >← Prethodna</button>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{croatianMonths[month]} {year}</h3>
          <button
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            className="text-[#5F3DFC] hover:text-[#4330c4] font-medium text-sm md:text-base"
          >Dalje →</button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-lg p-3 md:p-6">
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'].map((day) => (
              <div key={day} className="text-center font-semibold text-xs md:text-sm text-gray-700 py-1.5 md:py-3 flex-shrink-0">
                {day}
              </div>
            ))}
            {[...Array(emptyBefore)].map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const date = i + 1;
              const dateStr = getDateString(date);
              const config = dateConfigs[dateStr];
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={date}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square border-2 rounded-lg p-1 md:p-3 flex flex-col items-center justify-center text-center transition-colors cursor-pointer text-[10px] md:text-sm ${
                    isSelected
                      ? 'border-[#5F3DFC] bg-[#5F3DFC]/10 hover:bg-[#5F3DFC]/20'
                      : config
                      ? 'border-[#5F3DFC] bg-[#5F3DFC]/5 hover:bg-[#5F3DFC]/10'
                      : 'border-[#5F3DFC] bg-[#5F3DFC]/5 hover:bg-[#5F3DFC]/10'
                  }`}
                >
                  <p className="font-bold text-gray-900">{date}</p>
                  <p className="text-[9px] md:text-xs text-gray-700 mt-0.5 md:mt-1 font-medium hidden md:block">{config?.capacity || lotCapacity} {parseInt(String(config?.capacity || lotCapacity)) === 1 ? 'mjesto' : 'mjesta'}</p>
                  <div className="flex items-center gap-0.5 md:gap-1 mt-0.5 md:mt-1 text-[8px] md:text-xs text-gray-600 hidden md:flex">
                    <Clock className="w-2 h-2 md:w-3 md:h-3" />
                    <span className="hidden lg:inline">{config ? (config.isOpen ? `${config.openTime} - ${config.closeTime}` : 'Zatvoreno') : '00:00 - 24:00'}</span>
                  </div>
                  {config && (
                    <p className="text-[8px] md:text-[10px] text-green-700 font-semibold mt-0.5 md:mt-1">✓ {config.priceMode === 'auto' ? 'Auto' : `${config.price}€`}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Config Modal - Responsive */}
      {selectedDateConfig && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-lg p-4 md:p-6 w-full md:w-96 md:max-h-[90vh] overflow-auto shadow-lg md:shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900">Postavke za {selectedDay}. {croatianMonths[month]}</h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DateConfigWidget
              config={selectedDateConfig}
              lotCapacity={parseInt(lotCapacity)}
              onSave={(config) => handleSaveDate(config)}
              onDelete={() => handleCloseDate(selectedDate!)}
              onCancel={() => setSelectedDate(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface DateConfigWidgetProps {
  config: DateConfig;
  lotCapacity: number;
  onSave: (config: DateConfig) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function DateConfigWidget({ config, lotCapacity, onSave, onDelete, onCancel }: DateConfigWidgetProps) {
  const [capacity, setCapacity] = useState(config.capacity);
  const [isOpen, setIsOpen] = useState(config.isOpen);
  const [openTime, setOpenTime] = useState(config.openTime);
  const [closeTime, setCloseTime] = useState(config.closeTime);
  const [priceMode, setPriceMode] = useState<'auto' | 'manual'>(config.priceMode || 'auto');
  const [price, setPrice] = useState(config.price);

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Open/Close Toggle */}
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-medium text-gray-900">Dostupnost</label>
        <div className="flex gap-2 md:gap-3">
          {[
            { id: 'open', label: 'Otvoreno' },
            { id: 'close', label: 'Zatvoreno' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setIsOpen(id === 'open')}
              className="flex-1 px-3 md:px-4 py-2 rounded-lg border-2 text-xs md:text-sm font-medium transition-colors"
              style={{
                borderColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#5F3DFC' : '#D1D5DB',
                backgroundColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? 'rgba(95, 61, 252, 0.05)' : 'white',
                color: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#5F3DFC' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label className="block text-xs md:text-sm font-medium text-gray-900">Kapacitet (mjesta)</label>
        <input
          type="number"
          min="1"
          max={lotCapacity}
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
        />
      </div>

      {/* Time Range */}
      {isOpen && (
        <div className="space-y-2 md:space-y-3">
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium text-gray-900">Od</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-medium text-gray-900">Do</label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
            />
          </div>
        </div>
      )}

      {/* Price */}
      {isOpen && (
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs md:text-sm font-medium text-gray-900">Cijena</label>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className={`text-xs font-medium ${priceMode === 'auto' ? 'text-[#5F3DFC]' : 'text-gray-500'}`}>Auto</span>
              <button
                onClick={() => setPriceMode(priceMode === 'auto' ? 'manual' : 'auto')}
                className="relative inline-flex h-5 md:h-6 w-10 md:w-11 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: priceMode === 'manual' ? '#5F3DFC' : '#D1D5DB',
                }}
              >
                <span
                  className="inline-block h-3.5 md:h-4 w-3.5 md:w-4 transform rounded-full bg-white transition-transform"
                  style={{
                    transform: priceMode === 'manual' ? 'translateX(18px)' : 'translateX(2px)',
                  }}
                />
              </button>
              <span className={`text-xs font-medium ${priceMode === 'manual' ? 'text-[#5F3DFC]' : 'text-gray-500'}`}>Ručno</span>
            </div>
          </div>

          {priceMode === 'manual' && (
            <div className="space-y-2">
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5F3DFC]/40"
                placeholder="Unesite cijenu u €"
              />
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-3 md:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Odustani
        </button>
        <button
          onClick={() => onSave({ date: config.date, capacity, isOpen, openTime, closeTime, priceMode, price })}
          className="flex-1 px-3 md:px-4 py-2 bg-[#5F3DFC] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#4330c4] transition-colors"
        >
          Spremi
        </button>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="w-full px-3 md:px-4 py-2 text-red-600 border border-red-300 rounded-lg text-xs md:text-sm font-medium hover:bg-red-50 transition-colors"
      >
        Ukloni postavke
      </button>
    </div>
  );
}
