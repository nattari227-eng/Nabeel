import { useState } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  BookOpen,
  Compass,
  ExternalLink,
  FileText,
  Layers,
  ListOrdered,
  Megaphone,
  Play,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  AdminAppConfig,
  AppSection,
  Bookmark,
  ReaderSettings,
  StudyNote,
} from '../types/quran';
import { MAX_MUSHAF_PAGE, MIN_MUSHAF_PAGE } from '../data/quranPages';
import { parsePageInput } from '../utils/quranLogic';

interface DashboardViewProps {
  settings: ReaderSettings;
  bookmarks: Bookmark[];
  notes: StudyNote[];
  adminConfig: AdminAppConfig;
  onContinueReading: () => void;
  onJumpToPage: (page: number) => void;
  onNavigate: (section: AppSection) => void;
  onOpenCustomQuranPdf?: () => void;
}

export function DashboardView({
  settings,
  bookmarks,
  notes,
  adminConfig,
  onContinueReading,
  onJumpToPage,
  onNavigate,
  onOpenCustomQuranPdf,
}: DashboardViewProps) {
  const [quickPage, setQuickPage] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);

  const vis = adminConfig.visibleHomeSections;
  const showBookmarks = vis.bookmarks;
  const showNotes = vis.notes;
  const latestFeaturedAyah = adminConfig.featuredAyahs[0] ?? null;

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault();
    const res = parsePageInput(quickPage, MAX_MUSHAF_PAGE, MIN_MUSHAF_PAGE);
    if (!res.valid || res.page === undefined) {
      setQuickError(res.error || 'Invalid page');
      return;
    }
    setQuickError(null);
    onJumpToPage(res.page);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-69px)] w-full max-w-3xl flex-col justify-between bg-white sm:border-x sm:border-[#E2DFD7]">
      <div>
        {/* Royal Gold Live Announcement Banner (Controlled via Hidden Admin Console) */}
        {adminConfig.banner.enabled && (
          <section
            aria-label="Announcement"
            data-testid="home-announcement-banner"
            className="border-b border-[#D4AF37]/60 bg-gradient-to-r from-[#FBF4DC] via-[#FFFDF7] to-[#F7EBCB] px-5 py-3.5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#9E7614]">
                <Megaphone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                {adminConfig.banner.titleEn && (
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E7614]">
                    {adminConfig.banner.titleEn}
                  </div>
                )}
                {adminConfig.banner.messageUr && (
                  <p className="font-urdu text-sm sm:text-base leading-relaxed text-[#14171A]" dir="rtl">
                    {adminConfig.banner.messageUr}
                  </p>
                )}
                {adminConfig.banner.messageEn && (
                  <p className="text-xs text-[#575D66] leading-snug">
                    {adminConfig.banner.messageEn}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Compact Deeniyat-Inspired Full-Width Menu List */}
        <nav aria-label="Home menu" className="divide-y divide-[#E2DFD7] border-b border-[#E2DFD7]">
          {/* 1. Resume */}
          {vis.resume && (
            <div className="flex items-center justify-between gap-2 transition-colors hover:bg-[#FBF9F5]">
              <button
                type="button"
                onClick={onContinueReading}
                data-testid="home-menu-resume"
                className="flex flex-1 items-center justify-between gap-4 px-5 py-3.5 text-left active:bg-[#FBF6E6] cursor-pointer min-w-0"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                    <Play className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                      دوبارہ شروع
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66] truncate">
                      RESUME · {settings.lastReadPage === 0 ? 'COVER' : `PAGE ${settings.lastReadPage}`} · PARA {settings.lastReadPara}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-urdu text-sm font-medium text-[#A87C14]" dir="rtl">
                    {settings.lastReadSurah}
                  </div>
                </div>
              </button>

              {adminConfig.quranPdfUrl && onOpenCustomQuranPdf && (
                <button
                  type="button"
                  onClick={onOpenCustomQuranPdf}
                  data-testid="home-custom-quran-pdf"
                  className="mr-4 inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-lg border border-[#D4AF37]/60 bg-[#FBF6E6] px-2.5 text-[11px] font-semibold text-[#9E7614] hover:bg-[#D4AF37] hover:text-white cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span>PDF</span>
                </button>
              )}
            </div>
          )}

          {/* 2. Split Row: Bookmarks (left) & Notes (right) */}
          {(showBookmarks || showNotes) && (
            <div
              className={`grid ${
                showBookmarks && showNotes
                  ? 'grid-cols-2 divide-x divide-[#E2DFD7]'
                  : 'grid-cols-1'
              }`}
            >
              {showBookmarks && (
                <button
                  type="button"
                  onClick={() => onNavigate('bookmarks')}
                  data-testid="home-menu-bookmarks"
                  className="flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                    <BookmarkCheck className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                    {bookmarks.length > 0 && (
                      <span className="absolute -right-1 -top-0.5 rounded bg-[#FBF6E6] border border-[#D4AF37]/60 px-1 font-mono-code text-[10px] font-bold text-[#9E7614] tabular-nums">
                        {bookmarks.length}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                      نشاندہی
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                      BOOKMARKS
                    </div>
                  </div>
                </button>
              )}

              {showNotes && (
                <button
                  type="button"
                  onClick={() => onNavigate('notes')}
                  data-testid="home-menu-notes"
                  className="flex items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                    <FileText className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                    {notes.length > 0 && (
                      <span className="absolute -right-1 -top-0.5 rounded bg-[#FBF6E6] border border-[#D4AF37]/60 px-1 font-mono-code text-[10px] font-bold text-[#9E7614] tabular-nums">
                        {notes.length}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                      نوٹس
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                      NOTES
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* 3. Juz / Para Index (with 30 badge) */}
          {vis.paras && (
            <button
              type="button"
              onClick={() => onNavigate('paras')}
              data-testid="home-menu-paras"
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                <BookOpen className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                <span className="absolute -right-1.5 -top-0.5 rounded border border-[#D4AF37]/60 bg-[#FBF6E6] px-1 font-mono-code text-[10px] font-bold text-[#9E7614] tabular-nums">
                  30
                </span>
              </span>
              <div className="min-w-0">
                <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                  پاروں کی فہرست
                </div>
                <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                  JUZ / PARA INDEX
                </div>
              </div>
            </button>
          )}

          {/* 4. Surah Index (with 114 badge) */}
          {vis.surahs && (
            <button
              type="button"
              onClick={() => onNavigate('surahs')}
              data-testid="home-menu-surahs"
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                <ListOrdered className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                <span className="absolute -right-2 -top-0.5 rounded border border-[#D4AF37]/60 bg-[#FBF6E6] px-1 font-mono-code text-[10px] font-bold text-[#9E7614] tabular-nums">
                  114
                </span>
              </span>
              <div className="min-w-0">
                <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                  سورتوں کی فہرست
                </div>
                <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                  SURAH INDEX
                </div>
              </div>
            </button>
          )}

          {/* 5. Sirat-ul-Jinan Tafsir */}
          {vis.sirat && (
            <button
              type="button"
              onClick={() => onNavigate('sirat')}
              data-testid="home-menu-sirat"
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                <Layers className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                  صراط الجنان تفسیر
                </div>
                <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                  SIRAT-UL-JINAN TAFSIR
                </div>
              </div>
            </button>
          )}

          {/* 6. Mutashabihat Index */}
          {vis.mutashabihat && (
            <button
              type="button"
              onClick={() => onNavigate('mutashabihat')}
              data-testid="home-menu-mutashabihat"
              className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[#FBF9F5] active:bg-[#FBF6E6] cursor-pointer"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                <Scale className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="font-urdu text-lg leading-snug text-[#14171A]" dir="rtl">
                  متشابہات قرآن
                </div>
                <div className="mt-0.5 text-[11px] font-semibold tracking-wider uppercase text-[#575D66]">
                  MUTASHABIHAT INDEX
                </div>
              </div>
            </button>
          )}

          {/* 7. Go to Page # (inline row with compact input + arrow button) */}
          {vis.quickPage && (
            <form onSubmit={handleQuickJump} className="px-5 py-3.5" data-testid="home-menu-quickpage">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-[#A87C14]">
                    <Compass className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-urdu text-lg leading-snug text-[#14171A] text-left" dir="rtl">
                      صفحہ نمبر
                    </div>
                    <label
                      htmlFor="dashboard-quick-page"
                      className="mt-0.5 block text-[11px] font-semibold tracking-wider uppercase text-[#575D66]"
                    >
                      GO TO PAGE #
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    id="dashboard-quick-page"
                    type="number"
                    min={MIN_MUSHAF_PAGE}
                    max={MAX_MUSHAF_PAGE}
                    value={quickPage}
                    onChange={(e) => {
                      setQuickPage(e.target.value);
                      setQuickError(null);
                    }}
                    placeholder="2–611"
                    aria-label="Enter Mushaf page number"
                    className="h-10 w-24 rounded-lg border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-center font-mono-code text-sm text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Go to entered page"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4AF37]/60 bg-[#FBF6E6] text-[#9E7614] hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {quickError && (
                <p className="mt-1.5 pl-14 text-xs text-rose-600">{quickError}</p>
              )}
            </form>
          )}
        </nav>

        {/* Featured Daily Ayah (Shown cleanly only when Admin publishes one) */}
        {latestFeaturedAyah && (
          <section
            aria-label="Featured Daily Ayah"
            data-testid="home-featured-ayah"
            className="border-b border-[#E2DFD7] bg-[#FBF9F5] px-5 py-4 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#9E7614]">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Ayah of the Day · {latestFeaturedAyah.surahName}</span>
              </span>
              <span className="font-mono-code tabular-nums">{latestFeaturedAyah.ayahRef}</span>
            </div>
            <p className="font-quran text-xl leading-loose text-[#14171A]" dir="rtl">
              {latestFeaturedAyah.arabicText}
            </p>
            {latestFeaturedAyah.urduTranslation && (
              <p className="font-urdu text-sm text-[#575D66]" dir="rtl">
                {latestFeaturedAyah.urduTranslation}
              </p>
            )}
            {latestFeaturedAyah.englishNote && (
              <p className="text-xs text-[#575D66]">{latestFeaturedAyah.englishNote}</p>
            )}
          </section>
        )}
      </div>

      {/* Clean Respectful Two-Column Footer Note */}
      <footer className="border-t border-[#E2DFD7] bg-[#FBF9F5] px-5 py-3">
        <div className="grid grid-cols-2 items-center gap-3 sm:gap-5">
          <p className="text-[10px] sm:text-[11px] leading-snug text-[#575D66]">
            Screen par Maujooda Qurani Aayaton ko Bagair Wazu Chhuna Durust Nahi Hai.
          </p>
          <p className="font-urdu text-xs sm:text-sm leading-relaxed text-[#575D66] text-right" dir="rtl">
            اسکرین پر موجودہ قرآنی آیات کو بغیر وضو چھونا درست نہیں ہے۔
          </p>
        </div>
      </footer>
    </div>
  );
}
