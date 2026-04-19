'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { key: 'score_security',      hr: 'Sigurnost',       desc: 'Kamere, osvjetljenje, zapreke' },
  { key: 'score_accessibility', hr: 'Pristupačnost',   desc: 'Ulaz, izlaz, oznake' },
  { key: 'score_cleanliness',   hr: 'Čistoća',         desc: 'Stanje parkirališta' },
  { key: 'score_staff',         hr: 'Osoblje',         desc: 'Usluga i odziv' },
  { key: 'score_value',         hr: 'Vrijednost',      desc: 'Cijena i kvaliteta' },
  { key: 'score_location',      hr: 'Lokacija',        desc: 'Blizina i pristup' },
] as const;

type ScoreKey = typeof CATEGORIES[number]['key'];

const OPTIONS = [
  { value: 2.5,  emoji: '😞', label: 'Loše',        color: '#e8372a' },
  { value: 5,    emoji: '😕', label: 'Zadovoljava', color: '#f4a400' },
  { value: 7.5,  emoji: '🙂', label: 'Dobro',       color: '#4caf50' },
  { value: 10,   emoji: '😍', label: 'Izvrsno',     color: '#003580' },
];

function overallLabel(v: number) {
  if (v >= 9) return 'Izvrsno';
  if (v >= 8) return 'Odlično';
  if (v >= 7) return 'Dobro';
  if (v >= 6) return 'Zadovoljava';
  return 'Loše';
}

function overallColor(v: number) {
  if (v >= 9) return '#003580';
  if (v >= 7) return '#4caf50';
  if (v >= 5) return '#f4a400';
  return '#e8372a';
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f2f6fa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReviewInner />
    </Suspense>
  );
}

function ReviewInner() {
  const params = useSearchParams();
  const token = params.get('token');

  const [locationName, setLocationName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    score_security: 0, score_accessibility: 0, score_cleanliness: 0,
    score_staff: 0, score_value: 0, score_location: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setLoadError('Nevažeći link za recenziju.'); return; }
    fetch(`/api/reviews/token?token=${token}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error === 'already_submitted') { setDone(true); return; }
        if (j.error) { setLoadError('Link je nevažeći ili je istekao.'); return; }
        setLocationName(j.location_name);
      })
      .catch(() => setLoadError('Greška pri učitavanju.'));
  }, [token]);

  const filledCount = Object.values(scores).filter((v) => v > 0).length;
  const allFilled = filledCount === 6;
  const overall = filledCount > 0
    ? Math.round((Object.values(scores).filter((v) => v > 0).reduce((a, b) => a + b, 0) / filledCount) * 10) / 10
    : null;

  const submit = async () => {
    if (!allFilled || !token) return;
    setSubmitting(true);
    const intScores = Object.fromEntries(
      Object.entries(scores).map(([k, v]) => [k, Math.round(v)])
    );
    const res = await fetch('/api/reviews/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...intScores, comment }),
    });
    if (res.ok) setDone(true);
    else setLoadError('Greška pri slanju. Pokušajte ponovo.');
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#003580] flex flex-col items-center justify-center text-white text-center px-6">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
          <svg className="w-10 h-10 text-[#003580]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Hvala na recenziji!</h1>
        <p className="text-white/70 text-sm mb-8">Vaša povratna informacija pomaže poboljšati iskustvo svim gostima.</p>
        <a href="/" className="px-8 py-3 bg-white text-[#003580] font-bold rounded-lg text-sm hover:bg-white/90 transition-colors">
          Povratak na PayParq
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f2f6fa] flex flex-col items-center justify-center text-center px-6">
        <p className="text-black/50 text-sm mb-4">{loadError}</p>
        <a href="/" className="text-[#003580] text-sm font-semibold underline">Povratak na PayParq</a>
      </div>
    );
  }

  if (!locationName) {
    return (
      <div className="min-h-screen bg-[#f2f6fa] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#003580] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f6fa] font-sans">
      {/* Top bar */}
      <div className="bg-[#003580] px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
          <span className="text-[#003580] font-black text-[11px] tracking-tight">PP</span>
        </div>
        <span className="text-white font-semibold text-sm">PayParq</span>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

        {/* Location header card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#003580] px-5 py-5">
            <p className="text-white/70 text-xs font-medium mb-1 uppercase tracking-wider">Recenzija za</p>
            <h1 className="text-white text-xl font-bold leading-tight">{locationName}</h1>
          </div>
          <div className="px-5 py-4 flex items-center gap-4">
            {overall !== null ? (
              <>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xl shadow"
                  style={{ background: overallColor(overall) }}
                >
                  {overall.toFixed(1)}
                </div>
                <div>
                  <p className="font-bold text-black text-[15px]">{overallLabel(overall)}</p>
                  <p className="text-xs text-black/50">{filledCount} od 6 kategorija ocijenjeno</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-black/50">Ocijenite svaku kategoriju ispod</p>
            )}
          </div>
        </div>

        {/* Category cards */}
        {CATEGORIES.map((cat) => {
          const v = scores[cat.key];
          const selected = OPTIONS.find((o) => o.value === v);
          return (
            <div key={cat.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 pt-5 pb-2 flex items-start justify-between">
                <div>
                  <p className="font-bold text-black text-[15px]">{cat.hr}</p>
                  <p className="text-xs text-black/40 mt-0.5">{cat.desc}</p>
                </div>
                {selected && (
                  <div
                    className="shrink-0 ml-3 px-2.5 py-1 rounded-lg text-white text-xs font-bold"
                    style={{ background: selected.color }}
                  >
                    {selected.value} · {selected.label}
                  </div>
                )}
              </div>

              {/* Score bar */}
              <div className="px-5 py-2">
                <div className="w-full h-1.5 bg-[#e8edf2] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: v > 0 ? `${v * 10}%` : '0%',
                      background: selected?.color ?? '#e8edf2',
                    }}
                  />
                </div>
              </div>

              {/* Emoji buttons */}
              <div className="grid grid-cols-4 gap-px bg-[#e8edf2] border-t border-[#e8edf2] mt-2">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScores((prev) => ({ ...prev, [cat.key]: opt.value }))}
                    className="flex flex-col items-center gap-1.5 py-4 transition-all"
                    style={{
                      background: v === opt.value ? opt.color : '#fff',
                    }}
                  >
                    <span className="text-[28px] leading-none">{opt.emoji}</span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: v === opt.value ? '#fff' : '#6b7280' }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Comment */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-bold text-black text-[15px] mb-1">Komentar</p>
          <p className="text-xs text-black/40 mb-3">Neobavezno — opišite svoje iskustvo</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Što vam se svidjelo? Što biste poboljšali?"
            rows={4}
            className="w-full bg-[#f2f6fa] border border-[#e8edf2] rounded-lg px-4 py-3 text-sm text-black placeholder:text-black/25 outline-none focus:border-[#003580] resize-none transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!allFilled || submitting}
          className="w-full py-4 rounded-xl font-bold text-[15px] text-white shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
          style={{ background: '#003580' }}
        >
          {submitting ? 'Šaljemo recenziju...' : allFilled ? 'Pošalji recenziju' : `Ocijenite još ${6 - filledCount} kategorij${6 - filledCount === 1 ? 'u' : 6 - filledCount < 5 ? 'e' : 'a'}`}
        </button>

        <p className="text-center text-[11px] text-black/30 pb-4">
          Zaštićeno · PayParq · Recenzije se objavljuju anonimno
        </p>
      </div>
    </div>
  );
}
