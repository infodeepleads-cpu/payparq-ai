"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocalNotifications } from '@capacitor/local-notifications';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';

export default function CalendarPage() {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('pp_scheduledDate');
      const savedTime = localStorage.getItem('pp_scheduledTime');

      const now = new Date();
      // Set tomorrow as default if nothing saved
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setDate(savedDate || tomorrow.toISOString().split('T')[0]);
      setTime(savedTime || "12:00");
    }
  }, []);

  const handleConfirm = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_scheduledDate', date);
      localStorage.setItem('pp_scheduledTime', time);

      try {
        const scheduledDateTime = new Date(`${date}T${time}`);
        const reminderTime = new Date(scheduledDateTime.getTime() - 10 * 60 * 1000); // 10 min before
        
        // Capacitor Notifications
        try {
          const notifs = await LocalNotifications.checkPermissions();
          if (notifs.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
          
          await LocalNotifications.schedule({
            notifications: [{
              title: "Podsjetnik za vožnju",
              body: `Vaša vožnja kreće za 10 minuta.`,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: reminderTime }
            }]
          });
        } catch (notifErr) {
          console.error("Notification error:", notifErr);
        }

        // Calendar Event
        try {
          await CapacitorCalendar.requestFullCalendarAccess();
          await CapacitorCalendar.createEvent({
            title: `Payparq: Vožnja`,
            startDate: scheduledDateTime.getTime(),
            endDate: scheduledDateTime.getTime() + 30 * 60 * 1000,
            location: ''
          });
        } catch (calErr) {
          console.error("Calendar error:", calErr);
        }
      } catch (err) {
        console.error("Failed to set reminder:", err);
      }
    }
    router.push('/rides?step=destination&payment_mode=scheduled' as any);
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden fixed inset-0 z-[2000]">
      <style jsx global>{`
        /* Sakrij default browser ikone za kalendar i sat */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }

        /* Moderniji time picker za mobilne uređaje */
        input[type="time"] {
          position: relative;
          -webkit-appearance: none;
          appearance: none;
        }

        /* Desktop specific refinements if needed */
        @media (hover: hover) {
          input[type="time"]:hover {
            background-color: rgba(0,0,0,0.04);
          }
        }
      `}</style>
      <div className="w-full max-w-sm mx-auto flex flex-col h-full py-4">
        
        {/* Header - Styled like Payment Page */}
        <div className="flex flex-col space-y-4 mb-6 px-2">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push("/rides" as any)}
              className="p-1 -ml-1 bg-transparent border-0 shadow-none outline-none cursor-pointer active:scale-90 transition-all"
            >
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-[20px] font-normal tracking-tight">Odaberi vrijeme preuzimanja</div>
          </div>
          <div className="px-1">
            <p className="text-[12px] text-black/40 font-normal leading-tight">
              30 min do 90 dana unaprijed
            </p>
          </div>
        </div>

        <div className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Date Picker - Styled like Payment list items */}
          <div className="space-y-3">
            <div className="px-1 text-[10px] uppercase tracking-[0.2em] font-normal text-black/40">Datum preuzimanja</div>
            <div className="relative group">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-5 py-4 text-[15px] font-normal focus:outline-none focus:bg-white focus:border-black/10 transition-all appearance-none cursor-pointer"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Time Picker */}
          <div className="space-y-3">
            <div className="px-1 text-[10px] uppercase tracking-[0.2em] font-normal text-black/40">Vrijeme preuzimanja</div>
            <div className="relative group">
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-black/[0.02] border border-black/5 rounded-xl px-5 py-4 text-[15px] font-normal focus:outline-none focus:bg-white focus:border-black/10 transition-all appearance-none cursor-pointer"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Terms Link instead of Reminder Widget */}
          <div className="pt-4 space-y-4">
            <div className="px-1 text-[10px] uppercase tracking-[0.2em] font-normal text-black/40">Uvjeti</div>
            <button 
              onClick={() => router.push('/terms/scheduled-rides' as any)}
              className="w-full flex items-center justify-between bg-transparent border-0 shadow-none p-0 active:scale-95 transition-all outline-none cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-black/[0.03] rounded-lg group-hover:bg-black/[0.05] transition-colors">
                  <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-[14px] font-normal text-black/60 group-hover:text-black transition-colors">Uvjeti rezerviranih vožnji</span>
              </div>
              <svg className="w-4 h-4 text-black/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

        </div>

        <div className="p-4 mt-auto">
          <button 
            onClick={handleConfirm}
            className="w-full bg-black text-white h-[1.4cm] rounded-[2rem] text-[15px] font-normal tracking-tight active:scale-95 transition-all shadow-lg border-none cursor-pointer"
          >
            Rezerviraj vožnju
          </button>
        </div>
      </div>
    </div>
  );
}
