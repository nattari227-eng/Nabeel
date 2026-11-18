import { useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { ALL_SURAHS } from '../data/quranMetadata';
import { FavoriteItem, Surah } from '../types/quran';
import { filterSurahs } from '../utils/quranLogic';

interface SurahIndexViewProps {
  favorites: FavoriteItem[];
  onOpenSurahPage: (page: number) => void;
  onToggleFavorite: (item: Omit<FavoriteItem, 'id' | 'createdAt'>) => void;
}

export function SurahIndexView({
  favorites,
  onOpenSurahPage,
  onToggleFavorite,
}: SurahIndexViewProps) {
  const [query, setQuery] = useState('');
  const [revFilter, setRevFilter] = useState<'All' | 'Makki' | 'Madani'>('All');

  const filtered = useMemo(() => filterSurahs(ALL_SURAHS, query, revFilter), [query, revFilter]);

  const isFav = (surah: Surah) =>
    favorites.some((f) => f.type === 'surah' && f.surahNumber === surah.number);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2DFD7] pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
            Surah Index (114 Surahs)
          </h1>
          <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
            سورتوں کی مکمل فہرست · ۱۵ سطری حفاظی مصحف کے عین مطابق صفحہ نمبر (۲ تا ۶۱۱)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-[#CBD5E1] bg-[#F4F1EA] p-1">
            {(['All', 'Makki', 'Madani'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRevFilter(tab)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  revFilter === tab
                    ? 'bg-white text-[#A87C14] shadow-xs border border-[#D4AF37]/50 font-semibold'
                    : 'text-[#575D66] hover:text-[#14171A]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58918]"
              aria-hidden="true"
            />
            <label htmlFor="surah-search-input" className="sr-only">
              Search 114 Surahs
            </label>
            <input
              id="surah-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Surah name or #..."
              className="min-h-[44px] w-64 rounded-xl border border-[#CBD5E1] bg-white pl-9 pr-4 text-sm text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center">
          <p className="text-sm text-[#575D66]">No Surahs match "{query}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((surah) => {
            const page = surah.startPage;
            const fav = isFav(surah);
            return (
              <div
                key={surah.number}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-xs hover:border-[#D4AF37] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onOpenSurahPage(page)}
                  className="flex flex-1 items-center gap-3.5 text-left min-w-0 cursor-pointer"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#FBF6E6] font-mono-code text-xs font-semibold text-[#9E7614] tabular-nums">
                    {surah.number}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#14171A] truncate">
                      {surah.englishName}
                    </div>
                    <div className="mt-0.5 text-xs text-[#575D66] truncate">
                      <span>{surah.revelationType}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">{surah.versesCount} Ayahs</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-code font-semibold text-[#A87C14] tabular-nums">Pg {page}</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenSurahPage(page)}
                    className="font-quran text-xl text-[#A87C14] hover:text-[#14171A] cursor-pointer"
                    dir="rtl"
                    aria-label={`Open ${surah.englishName} on page ${page}`}
                  >
                    {surah.arabicName}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onToggleFavorite({
                        type: 'surah',
                        surahNumber: surah.number,
                        pageNumber: page,
                        titleArabic: surah.arabicName,
                        titleUrdu: surah.urduName,
                        subtitle: `${surah.revelationType} · ${surah.versesCount} Ayahs · Page ${page}`,
                      })
                    }
                    aria-label={fav ? `Remove ${surah.englishName} from favorites` : `Add ${surah.englishName} to favorites`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:text-[#B58918] cursor-pointer"
                  >
                    <Heart className={`h-4 w-4 ${fav ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
