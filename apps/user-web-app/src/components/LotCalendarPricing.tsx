'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, X } from 'lucide-react';
import { useLocale } from './LocaleProvider';

interface LotCalendarPricingProps {
  lotId: string;
  lotName: string;
  lotAddress: string;
  lotCapacity: string;
  onBack: () => void;
}

interface DateConfig {
  date: string;
  capacity: number | null;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  priceMode: 'auto' | 'manual';
  priceHourly: number | null;
  priceDaily: number | null;
  priceMonthly: number | null;
}

const TRANSLATIONS = {
  'Odustani': { en: 'Cancel', hr: 'Odustani' },
} as const;

const t = (key: string, locale: 'en' | 'hr'): string => {
  const trans = TRANSLATIONS[key as keyof typeof TRANSLATIONS];
  return trans ? trans[locale] : key;
};

export function LotCalendarPricing({ lotId, lotName, lotAddress, lotCapacity, onBack }: LotCalendarPricingProps) {
  const { locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(() => new Date(2026, 4, 1));
  const [dateConfigs, setDateConfigs] = useState<Record<string, DateConfig>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeStartDate, setRangeStartDate] = useState<string | null>(null);
  const [rangeEndDate, setRangeEndDate] = useState<string | null>(null);

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
      priceHourly: null,
      priceDaily: null,
      priceMonthly: null,
    };
  };

  const isDateInRange = (dateStr: string): boolean => {
    if (!rangeStartDate || !rangeEndDate) return false;
    return dateStr >= rangeStartDate && dateStr <= rangeEndDate;
  };

  const isRangeStart = (dateStr: string): boolean => dateStr === rangeStartDate;
  const isRangeEnd = (dateStr: string): boolean => dateStr === rangeEndDate;

  const handleDateClick = (day: number) => {
    const dateStr = getDateString(day);

    if (!rangeStartDate) {
      setRangeStartDate(dateStr);
      setRangeEndDate(null);
    } else if (!rangeEndDate) {
      if (dateStr < rangeStartDate) {
        setRangeStartDate(dateStr);
        setRangeEndDate(rangeStartDate);
      } else {
        setRangeEndDate(dateStr);
      }
      setSelectedDate(null);
    } else {
      setRangeStartDate(dateStr);
      setRangeEndDate(null);
    }
  };

  const handleApplyRangeConfig = (config: Omit<DateConfig, 'date'>) => {
    if (!rangeStartDate || !rangeEndDate) return;

    const start = new Date(rangeStartDate);
    const end = new Date(rangeEndDate);
    const newConfigs = { ...dateConfigs };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      newConfigs[dateStr] = { date: dateStr, ...config };
    }

    handleSaveBatch(newConfigs);
  };

  const handleSaveBatch = async (newConfigs: Record<string, DateConfig>) => {
    setDateConfigs(newConfigs);
    try {
      if (!supabase) {
        setRangeStartDate(null);
        setRangeEndDate(null);
        return;
      }
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

      setRangeStartDate(null);
      setRangeEndDate(null);
    } catch (err: any) {
      console.error('Failed to save date config:', err.message);
    }
  };

  const handleSaveDate = async (config: DateConfig) => {
    const newConfigs = { ...dateConfigs, [config.date]: config };
    await handleSaveBatch(newConfigs);
    setSelectedDate(null);
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
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-black/10 border-t-black animate-spin" style={{ animationDuration: '1s' }} />
          <div className="animate-pulse w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-lg z-10">
            <span className="text-sm font-black tracking-tight text-white select-none">P</span>
          </div>
        </div>
      </div>
    );
  }

  const selectedDateConfig = selectedDate ? getDateConfig(selectedDate) : null;
  const selectedDay = selectedDate ? parseInt(selectedDate.split('-')[2]) : null;

  return (
    <div className="h-full bg-white flex flex-col w-full md:p-6 p-3 md:p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{lotName}</h2>
        <div className="text-xs md:text-sm text-gray-600 flex flex-col md:flex-row md:gap-2">
          <span>{lotAddress}</span>
          <span className="hidden md:inline">•</span>
          <span>Kapacitet: {lotCapacity} mjesta</span>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 overflow-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3 md:mb-6">
          <button
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            className="text-black hover:text-gray-700 font-medium text-sm md:text-base"
          >← Prethodna</button>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">{croatianMonths[month]} {year}</h3>
          <button
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            className="text-black hover:text-gray-700 font-medium text-sm md:text-base"
          >Dalje →</button>
        </div>

        {/* Calendar Grid */}
        <div className="border border-gray-200 rounded-lg p-2 md:p-6">
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {[['Ponedjeljak', 'Po'], ['Utorak', 'U'], ['Srijeda', 'Sr'], ['Četvrtak', 'Č'], ['Petak', 'Pe'], ['Subota', 'Su'], ['Nedjelja', 'Ne']].map(([fullDay, shortLabel]) => (
              <div key={fullDay} className="text-center font-semibold text-xs md:text-sm text-gray-700 py-2 md:py-3 flex-shrink-0">
                <span translate="no">{shortLabel}</span>
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
              const isInRange = isDateInRange(dateStr);
              const isStart = isRangeStart(dateStr);
              const isEnd = isRangeEnd(dateStr);
              const isClosed = config && !config.isOpen;

              return (
                <button
                  key={date}
                  onClick={() => handleDateClick(date)}
                  className={`aspect-square border-2 rounded-lg p-1 md:p-3 flex flex-col items-center justify-center text-center transition-all cursor-pointer text-[10px] md:text-sm font-medium ${
                    isClosed
                      ? 'border-black bg-gradient-to-br from-black to-black/80 hover:from-black/90 hover:to-black/70 text-white shadow-lg'
                      : isStart || isEnd
                      ? 'border-black bg-black/20 hover:bg-black/30 text-gray-900 font-bold'
                      : isInRange
                      ? 'border-black/40 bg-black/5 hover:bg-black/10 text-gray-900'
                      : isSelected
                      ? 'border-black bg-black/10 hover:bg-black/20 text-gray-900'
                      : config
                      ? 'border-black bg-black/5 hover:bg-black/10 text-gray-900'
                      : 'border-black bg-black/5 hover:bg-black/10 text-gray-900'
                  }`}
                >
                  <p className={`font-bold ${isClosed ? 'text-white' : 'text-gray-900'}`}>{date}</p>
                  {!isClosed && (
                    <>
                      <p className={`text-[9px] md:text-xs mt-0.5 md:mt-1 font-medium hidden md:block ${isClosed ? 'text-white/80' : 'text-gray-700'}`}>{config?.capacity || lotCapacity} {parseInt(String(config?.capacity || lotCapacity)) === 1 ? 'mjesto' : 'mjesta'}</p>
                      <div className={`flex items-center gap-0.5 md:gap-1 mt-0.5 md:mt-1 text-[8px] md:text-xs hidden md:flex ${isClosed ? 'text-white/60' : 'text-gray-600'}`}>
                        <Clock className="w-2 h-2 md:w-3 md:h-3" />
                        <span className="hidden lg:inline">{config ? (config.isOpen ? `${config.openTime} - ${config.closeTime}` : 'Zatvoreno') : '00:00 - 24:00'}</span>
                      </div>
                      {config && (
                        <p className="text-[8px] md:text-[10px] text-green-700 font-semibold mt-0.5 md:mt-1">✓ {config.priceMode === 'auto' ? 'Auto' : `${config.priceHourly ?? ''}€/h`}</p>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Config Modal - Responsive */}
      {selectedDateConfig && selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0">
          <div className="bg-white rounded-t-3xl md:rounded-xl p-5 md:p-8 w-full md:w-96 md:max-h-[90vh] overflow-auto shadow-2xl md:shadow-2xl max-h-[90vh]">
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
              onCancel={() => setSelectedDate(null)}
            />
          </div>
        </div>
      )}

      {/* Range Selection Modal */}
      {rangeStartDate && rangeEndDate && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0">
          <div className="bg-white rounded-t-3xl md:rounded-xl p-5 md:p-8 w-full md:w-96 md:max-h-[90vh] overflow-auto shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                Postavke za periode
              </h3>
              <button
                onClick={() => {
                  setRangeStartDate(null);
                  setRangeEndDate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {rangeStartDate.split('-')[2]}. - {rangeEndDate.split('-')[2]}. {croatianMonths[month]}
              </p>
            </div>

            <RangeConfigWidget
              lotCapacity={parseInt(lotCapacity)}
              onApply={(config) => handleApplyRangeConfig(config)}
              onCancel={() => {
                setRangeStartDate(null);
                setRangeEndDate(null);
              }}
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
  onCancel: () => void;
}

function DateConfigWidget({ config, lotCapacity, onSave, onCancel }: DateConfigWidgetProps) {
  const [capacity, setCapacity] = useState(config.capacity ? String(config.capacity) : '');
  const [isOpen, setIsOpen] = useState(config.isOpen);
  const [openTime, setOpenTime] = useState(config.openTime);
  const [closeTime, setCloseTime] = useState(config.closeTime);
  const [priceMode, setPriceMode] = useState<'auto' | 'manual'>(config.priceMode || 'auto');
  const [priceHourly, setPriceHourly] = useState(config.priceHourly != null ? String(config.priceHourly) : '');
  const [priceDaily, setPriceDaily] = useState(config.priceDaily != null ? String(config.priceDaily) : '');
  const [priceMonthly, setPriceMonthly] = useState(config.priceMonthly != null ? String(config.priceMonthly) : '');

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Open/Close Toggle */}
      <div className="space-y-2">
        <label className="block text-sm md:text-base font-semibold text-gray-900">Dostupnost</label>
        <div className="flex gap-2 md:gap-3">
          {[
            { id: 'open', label: 'Otvoreno' },
            { id: 'close', label: 'Zatvoreno' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setIsOpen(id === 'open')}
              className="flex-1 px-3 md:px-4 py-3 md:py-2.5 rounded-lg border-2 text-sm md:text-base font-medium transition-colors min-h-[44px] md:min-h-auto"
              style={{
                borderColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#000000' : '#D1D5DB',
                backgroundColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? 'rgba(0, 0, 0, 0.05)' : 'white',
                color: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#000000' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label className="block text-sm md:text-base font-semibold text-gray-900">Kapacitet (mjesta)</label>
        <input
          type="number"
          min="1"
          max={lotCapacity}
          value={capacity}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') { setCapacity(''); return; }
            const stripped = val.replace(/^0+/, '') || '0';
            const num = parseInt(stripped);
            if (!isNaN(num) && num >= 1 && num <= lotCapacity) setCapacity(String(num));
          }}
          className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
        />
      </div>

      {/* Time Range */}
      {isOpen && (
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-semibold text-gray-900">Od</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-semibold text-gray-900"><span translate="no">Kraj</span></label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto"
            />
          </div>
        </div>
      )}

      {/* Price */}
      {isOpen && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm md:text-base font-semibold text-gray-900">Cijene</label>
            <div className="flex items-center gap-2 md:gap-3">
              <span className={`text-sm md:text-base font-medium ${priceMode === 'auto' ? 'text-black' : 'text-gray-500'}`}>Auto</span>
              <button
                onClick={() => setPriceMode(priceMode === 'auto' ? 'manual' : 'auto')}
                className="relative inline-flex h-6 md:h-7 w-12 md:w-14 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: priceMode === 'manual' ? '#000000' : '#D1D5DB',
                }}
              >
                <span
                  className="inline-block h-4 md:h-5 w-4 md:w-5 transform rounded-full bg-white transition-transform duration-300"
                  style={{
                    transform: priceMode === 'manual' ? 'translateX(28px)' : 'translateX(4px)',
                  }}
                />
              </button>
              <span className={`text-sm md:text-base font-medium ${priceMode === 'manual' ? 'text-black' : 'text-gray-500'}`}>Ručno</span>
            </div>
          </div>

          {priceMode === 'manual' && (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Sat (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceHourly}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceHourly(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceHourly(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Dan (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceDaily}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceDaily(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceDaily(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Mjesec (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceMonthly}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceMonthly(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceMonthly(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {t('Odustani', locale)}
        </button>
        <button
          onClick={() => onSave({
            date: config.date,
            capacity: capacity === '' ? null : parseInt(capacity),
            isOpen,
            openTime,
            closeTime,
            priceMode,
            priceHourly: priceHourly === '' ? null : parseFloat(priceHourly),
            priceDaily: priceDaily === '' ? null : parseFloat(priceDaily),
            priceMonthly: priceMonthly === '' ? null : parseFloat(priceMonthly),
          })}
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-black text-white rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Spremi
        </button>
      </div>
    </div>
  );
}

interface RangeConfigWidgetProps {
  lotCapacity: number;
  onApply: (config: Omit<DateConfig, 'date'>) => void;
  onCancel: () => void;
}

function RangeConfigWidget({ lotCapacity, onApply, onCancel }: RangeConfigWidgetProps) {
  const [capacity, setCapacity] = useState(String(lotCapacity));
  const [isOpen, setIsOpen] = useState(true);
  const [openTime, setOpenTime] = useState('00:00');
  const [closeTime, setCloseTime] = useState('23:59');
  const [priceMode, setPriceMode] = useState<'auto' | 'manual'>('auto');
  const [priceHourly, setPriceHourly] = useState('');
  const [priceDaily, setPriceDaily] = useState('');
  const [priceMonthly, setPriceMonthly] = useState('');

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Open/Close Toggle */}
      <div className="space-y-2">
        <label className="block text-sm md:text-base font-semibold text-gray-900">Dostupnost</label>
        <div className="flex gap-2 md:gap-3">
          {[
            { id: 'open', label: 'Otvoreno' },
            { id: 'close', label: 'Zatvoreno' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setIsOpen(id === 'open')}
              className="flex-1 px-3 md:px-4 py-3 md:py-2.5 rounded-lg border-2 text-sm md:text-base font-medium transition-colors min-h-[44px] md:min-h-auto"
              style={{
                borderColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#000000' : '#D1D5DB',
                backgroundColor: (isOpen && id === 'open') || (!isOpen && id === 'close') ? 'rgba(0, 0, 0, 0.05)' : 'white',
                color: (isOpen && id === 'open') || (!isOpen && id === 'close') ? '#000000' : '#6B7280',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <label className="block text-sm md:text-base font-semibold text-gray-900">Kapacitet (mjesta)</label>
        <input
          type="number"
          min="1"
          max={lotCapacity}
          value={capacity}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') { setCapacity(''); return; }
            const stripped = val.replace(/^0+/, '') || '0';
            const num = parseInt(stripped);
            if (!isNaN(num) && num >= 1 && num <= lotCapacity) setCapacity(String(num));
          }}
          className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
        />
      </div>

      {/* Time Range */}
      {isOpen && (
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-semibold text-gray-900">Od</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-semibold text-gray-900"><span translate="no">Kraj</span></label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-3 md:py-2.5 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 min-h-[44px] md:min-h-auto"
            />
          </div>
        </div>
      )}

      {/* Price */}
      {isOpen && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm md:text-base font-semibold text-gray-900">Cijene</label>
            <div className="flex items-center gap-2 md:gap-3">
              <span className={`text-sm md:text-base font-medium ${priceMode === 'auto' ? 'text-black' : 'text-gray-500'}`}>Auto</span>
              <button
                onClick={() => setPriceMode(priceMode === 'auto' ? 'manual' : 'auto')}
                className="relative inline-flex h-6 md:h-7 w-12 md:w-14 items-center rounded-full transition-colors"
                style={{
                  backgroundColor: priceMode === 'manual' ? '#000000' : '#D1D5DB',
                }}
              >
                <span
                  className="inline-block h-4 md:h-5 w-4 md:w-5 transform rounded-full bg-white transition-transform duration-300"
                  style={{
                    transform: priceMode === 'manual' ? 'translateX(28px)' : 'translateX(4px)',
                  }}
                />
              </button>
              <span className={`text-sm md:text-base font-medium ${priceMode === 'manual' ? 'text-black' : 'text-gray-500'}`}>Ručno</span>
            </div>
          </div>

          {priceMode === 'manual' && (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Sat (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceHourly}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceHourly(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceHourly(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Dan (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceDaily}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceDaily(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceDaily(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs md:text-sm font-medium text-gray-700">Mjesec (€)</label>
                <input
                  type="number"
                  min="0"
                  value={priceMonthly}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') { setPriceMonthly(''); return; }
                    const stripped = val.replace(/^0+/, '') || '0';
                    const num = parseFloat(stripped);
                    if (!isNaN(num) && num >= 0) setPriceMonthly(stripped);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-2 md:px-3 py-2 md:py-2.5 text-xs md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          {t('Odustani', locale)}
        </button>
        <button
          onClick={() => onApply({
            capacity: capacity === '' ? null : parseInt(capacity),
            isOpen,
            openTime,
            closeTime,
            priceMode,
            priceHourly: priceHourly === '' ? null : parseFloat(priceHourly),
            priceDaily: priceDaily === '' ? null : parseFloat(priceDaily),
            priceMonthly: priceMonthly === '' ? null : parseFloat(priceMonthly),
          })}
          className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-black text-white rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Primijeni
        </button>
      </div>
    </div>
  );
}
