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

const SMILEYS = [
  { value: 2.5,  emoji: '😞', label: 'Loše' },
  { value: 5,    emoji: '😐', label: 'Zadovoljava' },
  { value: 7.5,  emoji: '🙂', label: 'Dobro' },
  { value: 10,   emoji: '😄', label: 'Izvrsno' },
];

function scoreColor(v: number) {
  if (v >= 9) return '#003580';
  if (v >= 7) return '#5F3DFC';
  if (v >= 4) return '#f59e0b';
  return '#dc2626';
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#5F3DFC] border-t-transparent rounded-full animate-spin" /></div>}>
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

  const allFilled = Object.values(scores).every((v) => v > 0);
  const overall = allFilled
    ? Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / 6) * 10) / 10
    : null;

  const submit = async () => {
    if (!allFilled || !token) return;
    setSubmitting(true);
    // Round to nearest integer for DB (scores are smallint 1–10)
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
      <div className="min-h-screen bg-[#5F3DFC] flex flex-col items-center justify-center text-white text-center px-6">
        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl">
          <svg className="w-10 h-10 text-[#5F3DFC]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[28px] font-black tracking-tight mb-2">Hvala na recenziji!</h1>
        <p className="text-white/70 text-[15px] font-bold mb-8">Vaša ocjena pomaže svima.</p>
        <a href="/" className="px-6 py-3 bg-white text-[#5F3DFC] font-black rounded-full text-[14px] uppercase tracking-widest">
          Povratak
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
        <p className="text-black/50 text-sm mb-4">{loadError}</p>
        <a href="/" className="text-[#5F3DFC] text-sm underline">Povratak na PayParq</a>
      </div>
    );
  }

  if (!locationName) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#5F3DFC] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-[#5F3DFC] px-6 pt-12 pb-10 text-white text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">PayParq Recenzija</p>
        <h1 className="text-[24px] font-black tracking-tight leading-tight">{locationName}</h1>
        <p className="text-white/70 text-[13px] font-bold mt-1">Ocijenite vaše iskustvo</p>
      </div>

      <div className="px-5 -mt-4 pb-10 max-w-lg mx-auto">
        {/* Overall score preview */}
        {overall !== null && (
          <div className="bg-white rounded-2xl px-5 py-4 mb-4 flex items-center justify-between shadow-sm border border-black/5">
            <span className="text-[13px] font-bold text-black/50 uppercase tracking-wider">Ukupna ocjena</span>
            <div className="flex items-center gap-2">
              <span className="text-[32px] font-black leading-none" style={{ color: scoreColor(overall) }}>{overall.toFixed(1)}</span>
              <span className="text-[13px] font-bold text-black/40">/ 10</span>
            </div>
          </div>
        )}

        {/* Category scores */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-black/5 mb-4">
          {CATEGORIES.map((cat, i) => {
            const v = scores[cat.key];
            const selected = SMILEYS.find((s) => s.value === v);
            return (
              <div key={cat.key} className={`px-5 py-4 ${i < CATEGORIES.length - 1 ? 'border-b border-black/5' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[14px] font-black text-black">{cat.hr}</p>
                    <p className="text-[11px] text-black/40">{cat.desc}</p>
                  </div>
                  {selected && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[22px] leading-none">{selected.emoji}</span>
                      <span className="text-[11px] font-bold text-black/40">{selected.label}</span>
                    </div>
                  )}
                </div>
                {/* Smiley buttons */}
                <div className="flex gap-2">
                  {SMILEYS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setScores((prev) => ({ ...prev, [cat.key]: s.value }))}
                      className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                      style={{
                        background: v === s.value ? scoreColor(s.value) : '#F3F4F6',
                      }}
                    >
                      <span className="text-[22px] leading-none">{s.emoji}</span>
                      <span
                        className="text-[10px] font-black"
                        style={{ color: v === s.value ? '#fff' : '#9ca3af' }}
                      >{s.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-black/5 mb-4">
          <p className="text-[12px] font-black text-black/40 uppercase tracking-widest mb-2">Komentar (neobavezno)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Recite nam više o svom iskustvu..."
            rows={3}
            className="w-full bg-[#F9FAFB] border border-black/5 rounded-xl px-4 py-3 text-[14px] text-black placeholder:text-black/20 outline-none resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={!allFilled || submitting}
          className="w-full py-5 rounded-[2rem] font-black text-[15px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 text-white"
          style={{ background: '#5F3DFC' }}
        >
          {submitting ? 'Šaljemo...' : 'Pošalji recenziju'}
        </button>
      </div>
    </div>
  );
}
