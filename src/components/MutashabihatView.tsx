import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { ALL_PARAS, MUTASHABIHAT_INDEX } from '../data/quranMetadata';
import { MutashabihEntry } from '../types/quran';
import { filterMutashabihat } from '../utils/quranLogic';

interface MutashabihatViewProps {
  customEntries?: MutashabihEntry[];
  onJumpToLocation: (page: number, line: number) => void;
}

export function MutashabihatView({
  customEntries = [],
  onJumpToLocation,
}: MutashabihatViewProps) {
  const [query, setQuery] = useState('');
  const [paraFilter, setParaFilter] = useState<number | 'all'>('all');

  const combinedEntries = useMemo(
    () => [...customEntries, ...MUTASHABIHAT_INDEX],
    [customEntries]
  );

  const filtered = useMemo(
    () => filterMutashabihat(combinedEntries, query, paraFilter),
    [combinedEntries, query, paraFilter]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2DFD7] pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
            Mutashabihat-ul-Quran Index
          </h1>
          <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
            متشابہاتِ قرآن — حفاظِ کرام کے لیے پارہ، سورۃ، صفحہ اور سطر کے مطابق رہنمائی
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="mutashabihat-para-select" className="sr-only">
            Filter Mutashabihat by Para
          </label>
          <select
            id="mutashabihat-para-select"
            value={paraFilter}
            onChange={(e) => setParaFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="min-h-[44px] rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-medium text-[#14171A] focus:border-[#D4AF37] focus:outline-none cursor-pointer"
          >
            <option value="all">All 30 Paras</option>
            {ALL_PARAS.map((p) => (
              <option key={p.number} value={p.number}>
                Para {p.number} — {p.englishName}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58918]"
              aria-hidden="true"
            />
            <label htmlFor="mutashabihat-search" className="sr-only">
              Search Mutashabihat
            </label>
            <input
              id="mutashabihat-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search verse, Surah, or page..."
              className="min-h-[44px] w-64 rounded-xl border border-[#CBD5E1] bg-white pl-9 pr-4 text-sm text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center">
          <p className="text-sm text-[#575D66]">No Mutashabihat entries match your current filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-[#CBD5E1] bg-white p-5 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#575D66]">
                  <span className="font-semibold text-[#A87C14]">Para {entry.paraNumber}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium text-[#14171A]">{entry.surahName}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{entry.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-code tabular-nums">
                    Page {entry.page} / Line {entry.line}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onJumpToLocation(entry.page, entry.line)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-105 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Jump to Page {entry.page}, Line {entry.line}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              <p className="font-quran text-2xl sm:text-3xl text-[#14171A] leading-relaxed" dir="rtl">
                {entry.arabicPhrase}
              </p>

              <p className="font-urdu text-sm sm:text-base text-[#575D66]" dir="rtl">
                {entry.hifzTipUrdu}
              </p>

              <div className="border-t border-[#E2DFD7] pt-3">
                <div className="mb-2 text-xs font-medium text-[#575D66]">
                  Paired Similar Spots (Tap to jump directly):
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {entry.similarSpots.map((spot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onJumpToLocation(spot.page, spot.line)}
                      className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] px-3.5 py-2.5 text-left hover:border-[#D4AF37] cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#14171A]">
                          {spot.surahName} ({spot.surahNumber}:{spot.ayahNumber})
                        </div>
                        <div className="font-urdu text-xs text-[#575D66] truncate" dir="rtl">
                          {spot.differenceNoteUrdu}
                        </div>
                      </div>
                      <span className="font-mono-code text-xs font-semibold text-[#A87C14] whitespace-nowrap shrink-0 tabular-nums">
                        Pg {spot.page} · L{spot.line}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
