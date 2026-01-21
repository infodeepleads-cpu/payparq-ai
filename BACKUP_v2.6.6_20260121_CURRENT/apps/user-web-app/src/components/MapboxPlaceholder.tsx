'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface MapboxPlaceholderProps {
  locationId?: string; // Would be used to fetch lat/lng
}

export default function MapboxPlaceholder({ locationId }: MapboxPlaceholderProps) {
  // In a real implementation, we would fetch the lot details from Supabase using locationId
  // const { data: lot } = supabase.from('locations').select('lat,lng').eq('id', locationId).single();
  
  const mockCoords = { lat: 40.7128, lng: -74.0060 }; // NYC Placeholder

  return (
    <div className="w-full h-48 bg-surface border border-white/10 rounded-xl overflow-hidden relative mb-6 group">
      {/* Visual Placeholder for Map */}
      <div className="absolute inset-0 bg-[#1E1B4B] flex items-center justify-center">
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #6D28D9 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />
        
        <div className="flex flex-col items-center gap-2 z-10">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <MapPin className="text-primary" size={24} />
          </div>
          <span className="text-xs text-white/50 font-mono">
            {mockCoords.lat.toFixed(4)}, {mockCoords.lng.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Overlay Badge */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full text-[10px] text-white/70">
        Mapbox Integration Ready
      </div>
    </div>
  );
}
