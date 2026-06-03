import { NextResponse } from 'next/server';

// Mock event data - replace with database queries
const MOCK_EVENTS: Record<string, Array<{ id: string; name: string; date: string }>> = {
  'Split Airport': [
    { id: '1', name: 'Hajduk vs Dinamo', date: '2025-07-15T18:00' },
    { id: '2', name: 'Beach Festival Split', date: '2025-07-22T19:00' },
  ],
  'Poljud Stadium': [
    { id: '3', name: 'Hajduk vs Dinamo', date: '2025-07-15T18:00' },
    { id: '4', name: 'Hajduk vs Inter', date: '2025-08-05T19:00' },
  ],
  'Maksimir Stadium': [
    { id: '5', name: 'Dinamo vs Rijeka', date: '2025-07-20T18:00' },
    { id: '6', name: 'Dinamo vs Hajduk', date: '2025-08-15T19:00' },
  ],
  'Arena Zagreb': [
    { id: '7', name: 'Concert Series 2025', date: '2025-07-18T20:00' },
    { id: '8', name: 'Dance Festival', date: '2025-08-10T21:00' },
  ],
  'Zagreb': [
    { id: '7', name: 'Concert Series 2025', date: '2025-07-18T20:00' },
    { id: '5', name: 'Dinamo vs Rijeka', date: '2025-07-20T18:00' },
  ],
  'Split': [
    { id: '1', name: 'Hajduk vs Dinamo', date: '2025-07-15T18:00' },
    { id: '2', name: 'Beach Festival Split', date: '2025-07-22T19:00' },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json([], { status: 200 });
  }

  const events = MOCK_EVENTS[location] || [];
  return NextResponse.json(events, { status: 200 });
}
