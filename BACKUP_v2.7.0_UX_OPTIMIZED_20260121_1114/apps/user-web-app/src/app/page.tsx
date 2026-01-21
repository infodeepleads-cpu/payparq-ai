'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { 
  Home, 
  History, 
  CreditCard, 
  Car, 
  Clock, 
  MapPin, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

export default function UserHomePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plate, setPlate] = useState('');
  const [loc, setLoc] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams(window.location.search);
        const locParam = params.get('loc') || '';
        setLoc(locParam);
        const lsPlate = localStorage.getItem('plate_number') || '';
        setPlate(lsPlate);
        // Fetch recent history
        const { data: historyData, error } = await supabase
          .from('parking_sessions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (historyData) {
          setHistory(historyData.map(item => ({
            id: item.id,
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            location: item.location_name || 'Unknown Zone',
            duration: item.duration_minutes ? `${Math.floor(item.duration_minutes / 60)}h ${item.duration_minutes % 60}m` : 'Ongoing',
            cost: item.total_cost || 0.00
          })));
        }

        // Fetch active session
        const { data: activeData } = await supabase
          .from('parking_sessions')
          .select('*')
          .eq('status', 'active')
          .single();

        if (activeData) {
          setActiveSession({
            id: activeData.id,
            plate: activeData.vehicle_plate || 'UNKNOWN',
            location: activeData.location_name || 'Zone A',
            entry: activeData.created_at,
            cost: activeData.current_cost || 0.00,
          });
        }
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-surface border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-bold">P</div>
            <span className="font-bold text-lg tracking-tight">PAYPARQ.AI</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-lg font-medium transition-colors">
            <Home size={20} />
            Home
          </Link>
          <Link href="/success" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <History size={20} />
            Activity
          </Link>
          <Link href="/vehicles" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <Car size={20} />
            Vehicles
          </Link>
          <Link href="/payment" className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white rounded-lg font-medium transition-colors">
            <CreditCard size={20} />
            Payment
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-white/50 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Greeting */}
          <div>
            <h1 className="text-2xl font-bold">Good Afternoon, Karlo</h1>
            <p className="text-white/50">Here is your parking summary.</p>
          </div>

          {/* Active Session Card */}
          {activeSession ? (
            <div className="bg-surface border border-primary/50 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                  Active Session
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  <Clock size={32} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <MapPin size={14} />
                    {activeSession.location}
                  </div>
                  <div className="text-3xl font-bold font-mono">{activeSession.plate}</div>
                  <div className="text-white/70">Started at {new Date(activeSession.entry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-white/50">Current Total</div>
                  <div className="text-2xl font-bold text-white">${activeSession.cost.toFixed(2)}</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 flex gap-4">
                <Link href="/success" className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                  View Details
                  <ChevronRight size={18} />
                </Link>
                <button className="px-6 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-white font-medium transition-colors">
                  End Session
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-white/50 gap-3">
               <Clock size={48} className="opacity-20" /> 
               <div className="text-lg">No active parking session</div>
               <Link href="/payment" className="text-primary hover:underline text-sm">Start a new session</Link>
            </div>
          )}

          {/* Recent History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent History</h2>
              <Link href="/success" className="text-sm text-primary hover:text-primary-hover">View All</Link>
            </div>
            
            <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
              {history.map((item, i) => (
                <div key={item.id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${i !== history.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/50">
                      <History size={20} />
                    </div>
                    <div>
                      <div className="font-medium">{item.location}</div>
                      <div className="text-xs text-white/50">{item.date} • {item.duration}</div>
                    </div>
                  </div>
                  <div className="font-mono font-medium">${item.cost.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="flex gap-3">
              <input
                className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20"
                placeholder="Plate number"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
              />
              <button
                className="px-4 py-2 bg-primary rounded text-white"
                onClick={() => {
                  localStorage.setItem('plate_number', plate);
                }}
              >
                Save Plate
              </button>
            </div>
            <button
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl"
              onClick={async () => {
                const res = await fetch('/api/stripe/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ location_id: loc, plate_number: plate }),
                });
                const json = await res.json();
                if (json.url) window.location.href = json.url;
              }}
            >
              Start Checkout
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
