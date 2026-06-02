import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Real Google reviews - 19 reviews distributed across all 4 airports
const reviews = [
  { author: 'Matea Mijat', rating: 5, text: 'Odličan servis!', airport: 'split', date: '2025-05-12' },
  { author: 'Ivan Tokić', rating: 5, text: 'Jednostavno i brzo!', airport: 'zadar', date: '2025-05-12' },
  { author: 'Ivana Šarac', rating: 5, text: 'Sigurno mjesto! Preporuka', airport: 'zagreb', date: '2025-05-12' },
  { author: 'Josipa Žitko', rating: 5, text: 'Brzo i jednostavno! Odlična usluga!', airport: 'dubrovnik', date: '2025-05-12' },
  { author: 'Ana Pralija', rating: 5, text: 'Brzo i jednostavno!', airport: 'split', date: '2025-05-12' },
  { author: 'Luka Klarić', rating: 5, text: 'Brzo i jednostavno!', airport: 'zadar', date: '2025-05-12' },
  { author: 'L Androja', rating: 5, text: 'Odlično!', airport: 'zagreb', date: '2025-05-02' },
  { author: 'Diana Kokan', rating: 5, text: 'Brzo i praktično. Preporuka!', airport: 'dubrovnik', date: '2025-05-02' },
  { author: 'Ivo', rating: 5, text: 'Brzo i jednostavno! Jako blizu aerodromu i za obići Trogir. Preporuke!', airport: 'split', date: '2025-05-02' },
  { author: 'L Androja', rating: 5, text: 'Pristupačno i jeftino.', airport: 'zadar', date: '2025-04-28' },
  { author: 'Ivo', rating: 5, text: 'Odlično', airport: 'zagreb', date: '2025-04-28' },
  { author: 'Ivan Tokić', rating: 5, text: 'Super, preporučujem!', airport: 'dubrovnik', date: '2025-04-28' },
  { author: 'Ivana Šarac', rating: 5, text: 'Odlično i sigurno mjesto! Preporuka!', airport: 'split', date: '2025-04-28' },
  { author: 'Josipa Žitko', rating: 5, text: 'Odličan servis', airport: 'zadar', date: '2025-04-28' },
  { author: 'Ana Pralija', rating: 5, text: 'Preporučujem svima', airport: 'zagreb', date: '2025-04-28' },
  { author: 'Diana Kokan', rating: 5, text: 'Preporuka!', airport: 'dubrovnik', date: '2025-04-28' },
  { author: 'L Androja', rating: 5, text: 'Odlicno!', airport: 'split', date: '2025-04-28' },
  { author: 'Ivo', rating: 5, text: 'Jednostavno, uredno, jeftino! Bila nam potrebna vožnja i vrlo brzo riješen problem. Full usluga!', airport: 'zadar', date: '2025-04-28' },
  { author: 'Luka Klarić', rating: 5, text: 'Odličan izbor za parking', airport: 'zagreb', date: '2025-04-28' },
];

export async function POST() {
  try {
    const { error } = await supabase.from('parking_reviews').insert(reviews);

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: `Successfully seeded ${reviews.length} real Google reviews`,
      count: reviews.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
