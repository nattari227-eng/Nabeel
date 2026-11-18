import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Heart,
  Highlighter,
  Home,
  Layers,
  MoreHorizontal,
  Sun,
  X,
} from 'lucide-react';
import {
  Bookmark,
  FavoriteItem,
  FlipMode,
  LineHighlight,
  ReaderSettings,
  StudyNote,
} from '../types/quran';
import {
  MAX_MUSHAF_PAGE,
  MIN_MUSHAF_PAGE,
  PDF_LANDMARKS,
  TOTAL_PDF_PAGES,
  getPdfPageMetadata,
} from '../data/quranPages';
import { computePaperStyleFilter, parsePageInput } from '../utils/quranLogic';
import { PdfQuranPageView } from './PdfQuranPageView';

interface QuranReaderProps {
  currentPage: number;
  settings: ReaderSettings;
  bookmarks: Bookmark[];
  favorites: FavoriteItem[];
  highlights: LineHighlight[];
  notes: StudyNote[];
  focusLine?: number | null;
  customQuranPdfUrl?: string;
  onExit: () => void;
  onPageChange: (page: number) => void;
  onUpdateSettings: (patch: Partial<ReaderSettings>) => void;
  onToggleBookmark: (page: number, surahNumber: number, surahName: string, paraNumber: number) => void;
  onToggleFavorite: (item: Omit<FavoriteItem, 'id' | 'createdAt'>) => void;
  onToggleHighlight: (pageNumber: number, lineNumber: number, color: 'gold' | 'emerald' | 'crimson') => void;
  onSaveNote: (pageNumber: number, lineNumber: number, surahName: string, text: string, color: 'gold' | 'emerald' | 'crimson') => void;
  onOpenSiratForPara: (paraNumber: number) => void;
  onOpenCustomQuranPdf?: () => void;
}

export function QuranReader({
  currentPage,
  settings,
  bookmarks,
  favorites,
  highlights,
  notes,
  focusLine,
  customQuranPdfUrl,
  onExit,
  onPageChange,
  onUpdateSettings,
  onToggleBookmark,
  onToggleFavorite,
  onToggleHighlight,
  onSaveNote,
  onOpenSiratForPara,
  onOpenCustomQuranPdf,
}: QuranReaderProps) {
  const pageMeta = getPdfPageMetadata(currentPage);

  const [chromeVisible, setChromeVisible] = useState(true);
  const [showToolsSheet, setShowToolsSheet] = useState(false);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev' | null>(null);
  const [showJumpDialog, setShowJumpDialog] = useState(false);
  const [jumpInput, setJumpInput] = useState(String(currentPage));
  const [jumpError, setJumpError] = useState<string | null>(null);

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [highlightColor, setHighlightColor] = useState<'gold' | 'emerald' | 'crimson'>('gold');

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);
  const isFavorited = favorites.some(
    (f) => f.type === 'page' && f.pageNumber === currentPage
  );

  const turnToPage = (target: number, dir: 'next' | 'prev') => {
    const safe = Math.max(MIN_MUSHAF_PAGE, Math.min(MAX_MUSHAF_PAGE, target));
    if (safe === currentPage) return;
    setAnimDirection(dir);
    onPageChange(safe);
  };

  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showJumpDialog || showToolsSheet || selectedLine !== null) return;
      if (e.key === 'ArrowLeft') {
        turnToPage(currentPage + 1, 'next');
      } else if (e.key === 'ArrowRight') {
        turnToPage(currentPage - 1, 'prev');
      } else if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = parsePageInput(jumpInput, MAX_MUSHAF_PAGE, MIN_MUSHAF_PAGE);
    if (!res.valid || res.page === undefined) {
      setJumpError(res.error || 'Invalid page number');
      return;
    }
    setJumpError(null);
    const dir = res.page >= currentPage ? 'next' : 'prev';
    setShowJumpDialog(false);
    setShowToolsSheet(false);
    turnToPage(res.page, dir);
  };

  const handleOpenLineModal = (lineNo: number) => {
    setSelectedLine(lineNo);
    const existingHighlight = highlights.find(
      (h) => h.pageNumber === currentPage && h.lineNumber === lineNo
    );
    setHighlightColor(existingHighlight?.color ?? 'gold');
    setNoteDraft('');
  };

  const handleSaveLineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLine === null) return;
    if (noteDraft.trim()) {
      onSaveNote(currentPage, selectedLine, pageMeta.surahUrdu, noteDraft, highlightColor);
    }
    onToggleHighlight(currentPage, selectedLine, highlightColor);
    setSelectedLine(null);
    setNoteDraft('');
  };

  const getFlipAnimationClass = () => {
    if (!animDirection) return '';
    if (settings.flipMode === 'curl3d') {
      return animDirection === 'next' ? 'page-curl-enter-next' : 'page-curl-enter-prev';
    }
    return animDirection === 'next' ? 'swipe-enter-next' : 'swipe-enter-prev';
  };

  const flipOptions: { id: FlipMode; label: string }[] = [
    { id: 'curl3d', label: '3D Book Curl' },
    { id: 'swipeHorizontal', label: 'Horizontal' },
    { id: 'swipeVertical', label: 'Vertical' },
  ];

  const pageNotes = notes.filter((n) => n.pageNumber === currentPage);

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-[#FBF9F5]"
      data-testid="fullscreen-reader"
    >
      {/* Persistent Top-Left Back / Home Button (remains reachable even when bottom toolbar is hidden) */}
      <button
        type="button"
        onClick={onExit}
        aria-label="Back to Home"
        data-testid="reader-persistent-back"
        className="fixed left-3 top-2.5 z-30 inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white/92 px-3 text-xs font-semibold text-[#14171A] shadow-sm backdrop-blur-md hover:border-[#D4AF37] hover:text-[#A87C14] transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 text-[#A87C14]" aria-hidden="true" />
        <span>Home</span>
      </button>

      {/* Full-Screen 100dvh Mushaf Page Stage */}
      <div
        className={`book-stage flex h-full w-full items-center justify-center px-1.5 transition-[padding] duration-300 ${
          chromeVisible ? 'pb-14 pt-1' : 'py-1'
        }`}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || touchStartY.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          const dy = e.changedTouches[0].clientY - touchStartY.current;
          if (settings.flipMode === 'swipeVertical') {
            if (dy < -50) turnToPage(currentPage + 1, 'next');
            if (dy > 50) turnToPage(currentPage - 1, 'prev');
          } else {
            if (dx > 50) turnToPage(currentPage + 1, 'next');
            if (dx < -50) turnToPage(currentPage - 1, 'prev');
          }
          touchStartX.current = null;
          touchStartY.current = null;
        }}
      >
        <div
          key={`${currentPage}-${settings.flipMode}`}
          onAnimationEnd={() => setAnimDirection(null)}
          className={getFlipAnimationClass()}
          style={{
            filter: computePaperStyleFilter(settings.brightness, settings.comfortMode),
          }}
        >
          <PdfQuranPageView
            pageMeta={pageMeta}
            comfortMode={settings.comfortMode}
            showLineGuides={settings.showLineGuides}
            highlights={highlights}
            notes={notes}
            activeHighlightLine={focusLine}
            chromeVisible={chromeVisible}
            onCenterTap={() => setChromeVisible((v) => !v)}
            onSelectLine={handleOpenLineModal}
          />
        </div>
      </div>

      {/* Single Sleek Fixed Bottom Navigation Bar (Tap page center to hide/show) */}
      <nav
        aria-label="Reader bottom navigation"
        aria-hidden={!chromeVisible}
        data-testid="reader-bottom-bar"
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-[#E2DFD7] bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(20,23,26,0.06)] transition-all duration-300 ${
          chromeVisible
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between gap-2 px-3">
          {/* Exit / Back to Home */}
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={onExit}
            aria-label="Exit reader to home"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14] transition-colors shrink-0 cursor-pointer"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Center Pager: Next Page (RTL Left) · Page Number · Previous Page (RTL Right) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              tabIndex={chromeVisible ? 0 : -1}
              disabled={currentPage >= MAX_MUSHAF_PAGE}
              onClick={() => turnToPage(currentPage + 1, 'next')}
              aria-label="Next page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14] disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              tabIndex={chromeVisible ? 0 : -1}
              onClick={() => setShowJumpDialog(true)}
              aria-label={`Current page ${currentPage}, tap to jump to page`}
              className="inline-flex h-11 min-w-[84px] items-center justify-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#FBF6E6] px-3.5 text-sm font-semibold text-[#9E7614] hover:border-[#D4AF37] tabular-nums whitespace-nowrap cursor-pointer"
            >
              <span className="font-mono-code">
                {currentPage === 0 ? 'Cover' : currentPage}
              </span>
              {isBookmarked && (
                <BookMarked className="h-3.5 w-3.5 fill-[#D4AF37] text-[#9E7614]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              tabIndex={chromeVisible ? 0 : -1}
              disabled={currentPage <= MIN_MUSHAF_PAGE}
              onClick={() => turnToPage(currentPage - 1, 'prev')}
              aria-label="Previous page"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14] disabled:opacity-35 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* More Options / Tools Popup Trigger */}
          <button
            type="button"
            tabIndex={chromeVisible ? 0 : -1}
            onClick={() => setShowToolsSheet(true)}
            aria-label="More options and tools"
            aria-expanded={showToolsSheet}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors shrink-0 cursor-pointer ${
              showToolsSheet
                ? 'border-[#D4AF37] bg-[#FBF6E6] text-[#9E7614]'
                : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14]'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* More Options / Tools Bottom Sheet */}
      {showToolsSheet && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#14171A]/40 backdrop-blur-[2px]"
          onClick={() => setShowToolsSheet(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Reader tools and options"
            data-testid="reader-tools-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-t-3xl border-t border-x border-[#D4AF37]/45 bg-white p-5 pb-7 shadow-2xl max-h-[84dvh] overflow-y-auto space-y-5"
          >
            {/* Drag Handle + Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#E2DFD7] pb-3.5">
              <div>
                <div className="font-quran text-xl text-[#A87C14]" dir="rtl">
                  {pageMeta.isQuranTextPage ? `سُوْرَةُ ${pageMeta.surahArabic}` : pageMeta.sectionLabelUrdu}
                </div>
                <div className="mt-0.5 text-xs font-medium text-[#575D66] tabular-nums">
                  {pageMeta.isQuranTextPage
                    ? `Para ${pageMeta.paraNumber} · Mushaf Pg ${currentPage} · PDF ${pageMeta.pdfPage}/${TOTAL_PDF_PAGES}`
                    : `${pageMeta.sectionLabel} · PDF ${pageMeta.pdfPage}/${TOTAL_PDF_PAGES}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowToolsSheet(false)}
                aria-label="Close reader tools"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Tools Row: Go to Page, Bookmark, Favorite, Tafsir */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setShowToolsSheet(false);
                  setShowJumpDialog(true);
                }}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 py-2 text-xs font-semibold text-[#14171A] hover:border-[#D4AF37] cursor-pointer"
              >
                <Compass className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                <span>Go to Page</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggleBookmark(
                    currentPage,
                    pageMeta.surahNumber,
                    pageMeta.isQuranTextPage ? pageMeta.surahUrdu : pageMeta.sectionLabel,
                    pageMeta.paraNumber
                  )
                }
                aria-label={isBookmarked ? 'Remove bookmark from this page' : 'Bookmark this page'}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${
                  isBookmarked
                    ? 'border-[#C59B27] bg-gradient-to-r from-[#C89D28] to-[#B6891B] text-white'
                    : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37]'
                }`}
              >
                <BookMarked className="h-4 w-4" aria-hidden="true" />
                <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggleFavorite({
                    type: 'page',
                    surahNumber: pageMeta.surahNumber,
                    pageNumber: currentPage,
                    titleArabic: pageMeta.surahArabic,
                    titleUrdu: pageMeta.isQuranTextPage
                      ? `${pageMeta.surahUrdu} — صفحہ ${currentPage}`
                      : pageMeta.sectionLabelUrdu,
                    subtitle: `Para ${pageMeta.paraNumber} · Mushaf Page ${currentPage}`,
                  })
                }
                aria-label={isFavorited ? 'Remove page from favorites' : 'Add page to favorites'}
                className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${
                  isFavorited
                    ? 'border-[#D4AF37] bg-[#FBF6E6] text-[#9E7614]'
                    : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#14171A] hover:border-[#D4AF37]'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${isFavorited ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#B58918]'}`}
                  aria-hidden="true"
                />
                <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowToolsSheet(false);
                  onOpenSiratForPara(pageMeta.paraNumber);
                }}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/50 bg-[#FBF6E6] px-3 py-2 text-xs font-semibold text-[#9E7614] hover:border-[#D4AF37] cursor-pointer"
              >
                <Layers className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                <span>Tafsir (Para {pageMeta.paraNumber})</span>
              </button>
            </div>

            {customQuranPdfUrl && onOpenCustomQuranPdf && (
              <button
                type="button"
                onClick={() => {
                  setShowToolsSheet(false);
                  onOpenCustomQuranPdf();
                }}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#D4AF37] bg-[#FBF6E6] px-4 text-xs font-semibold text-[#9E7614] hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>Open Custom Quran PDF</span>
              </button>
            )}

            {/* Reading / Page Flip Mode */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#14171A]">Reading / Flip Mode</div>
              <div
                className="grid grid-cols-3 gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#F4F1EA] p-1"
                role="group"
                aria-label="Reading flip mode"
              >
                {flipOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({ flipMode: opt.id })}
                    className={`min-h-[38px] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      settings.flipMode === opt.id
                        ? 'bg-white text-[#A87C14] border border-[#D4AF37]/50 font-semibold shadow-xs'
                        : 'text-[#575D66] hover:text-[#14171A]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-3 rounded-2xl border border-[#E2DFD7] bg-[#FBF9F5] p-3.5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="reader-brightness-slider" className="flex items-center gap-1.5 font-semibold text-[#14171A]">
                    <Sun className="h-3.5 w-3.5 text-[#B58918]" aria-hidden="true" />
                    Display Brightness
                  </label>
                  <span className="font-mono-code font-semibold text-[#A87C14] tabular-nums">
                    {settings.brightness}%
                  </span>
                </div>
                <input
                  id="reader-brightness-slider"
                  type="range"
                  min={40}
                  max={110}
                  value={settings.brightness}
                  onChange={(e) => onUpdateSettings({ brightness: Number(e.target.value) })}
                  className="w-full accent-[#C59B27] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#E2DFD7] pt-2.5">
                <div>
                  <div className="text-xs font-semibold text-[#14171A]">Reading Comfort Mode</div>
                  <div className="text-[11px] text-[#575D66]">Warm ivory paper blend</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.comfortMode}
                  onClick={() => onUpdateSettings({ comfortMode: !settings.comfortMode })}
                  className={`min-h-[34px] rounded-lg px-3.5 text-xs font-semibold cursor-pointer ${
                    settings.comfortMode
                      ? 'bg-[#D4AF37] text-white'
                      : 'border border-[#CBD5E1] bg-white text-[#575D66]'
                  }`}
                >
                  {settings.comfortMode ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-[#E2DFD7] pt-2.5">
                <div>
                  <div className="text-xs font-semibold text-[#14171A]">15-Line Hifz Margin Markers</div>
                  <div className="text-[11px] text-[#575D66]">Tap line numbers on right margin for notes</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.showLineGuides}
                  onClick={() => onUpdateSettings({ showLineGuides: !settings.showLineGuides })}
                  className={`min-h-[34px] rounded-lg px-3.5 text-xs font-semibold cursor-pointer ${
                    settings.showLineGuides
                      ? 'bg-[#D4AF37] text-white'
                      : 'border border-[#CBD5E1] bg-white text-[#575D66]'
                  }`}
                >
                  {settings.showLineGuides ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            {/* Mushaf PDF Sections */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#14171A]">Mushaf Sections</div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {PDF_LANDMARKS.map((lm) => (
                  <button
                    key={lm.id}
                    type="button"
                    onClick={() => {
                      setShowToolsSheet(false);
                      turnToPage(lm.mushafPage, lm.mushafPage >= currentPage ? 'next' : 'prev');
                    }}
                    className={`min-h-[42px] rounded-xl border px-2 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                      currentPage === lm.mushafPage
                        ? 'border-[#D4AF37] bg-[#FBF6E6] text-[#9E7614] font-semibold'
                        : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#475569] hover:border-[#D4AF37]'
                    }`}
                  >
                    <div className="truncate font-medium">{lm.label}</div>
                    <div className="font-mono-code text-[10px] opacity-80">
                      {lm.mushafPage === 0 ? 'PDF 1' : `Pg ${lm.mushafPage}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Page Notes Summary (if any exist) */}
            {pageNotes.length > 0 && (
              <div className="space-y-2 border-t border-[#E2DFD7] pt-3">
                <div className="text-xs font-semibold text-[#A87C14]">
                  Hifz Notes on Page {currentPage} ({pageNotes.length})
                </div>
                <ul className="space-y-1.5">
                  {pageNotes.map((n) => (
                    <li
                      key={n.id}
                      className="rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] px-3 py-2 text-xs text-[#14171A]"
                    >
                      <span className="font-mono-code font-semibold text-[#A87C14]">
                        Line {n.lineNumber}:
                      </span>{' '}
                      {n.noteText}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Go To Page Modal */}
      {showJumpDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14171A]/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Go to Page Number"
        >
          <form
            onSubmit={handleJumpSubmit}
            className="w-full max-w-md rounded-2xl border border-[#D4AF37]/50 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#14171A]">Go to Page Number</h2>
                <p className="font-urdu text-sm text-[#A87C14]" dir="rtl">
                  صفحہ نمبر درج کریں (۲ تا ۶۱۱ قرآنی صفحات، یا ۰ تا ۶۱۸ مکمل مصحف)
                </p>
              </div>
              <button
                type="button"
                aria-label="Close jump dialog"
                onClick={() => setShowJumpDialog(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#14171A] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label htmlFor="jump-page-input" className="block text-xs font-medium text-[#575D66] mb-1.5">
              Printed Mushaf Page (2 – 611) · Cover (0) · Appendix (612 – 618)
            </label>
            <input
              id="jump-page-input"
              type="number"
              min={MIN_MUSHAF_PAGE}
              max={MAX_MUSHAF_PAGE}
              value={jumpInput}
              onChange={(e) => {
                setJumpInput(e.target.value);
                setJumpError(null);
              }}
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-4 py-3 font-mono-code text-base text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
              autoFocus
            />
            {jumpError && <p className="mt-2 text-xs text-rose-600">{jumpError}</p>}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowJumpDialog(false)}
                className="min-h-[44px] rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-medium text-[#575D66] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Jump to Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Line Highlight & Personal Note Modal */}
      {selectedLine !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14171A]/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Highlight Line and Add Note"
        >
          <form
            onSubmit={handleSaveLineNote}
            className="w-full max-w-md rounded-2xl border border-[#D4AF37]/50 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Highlighter className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-[#14171A]">
                  Page {currentPage} · Line {selectedLine}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close line note dialog"
                onClick={() => setSelectedLine(null)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#14171A] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <span className="block text-xs font-medium text-[#575D66] mb-2">Highlight Color</span>
              <div className="flex items-center gap-2">
                {(['gold', 'emerald', 'crimson'] as const).map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => setHighlightColor(clr)}
                    className={`min-h-[38px] flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize cursor-pointer ${
                      highlightColor === clr
                        ? 'border-[#D4AF37] bg-[#FBF6E6] text-[#9E7614] font-semibold'
                        : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66]'
                    }`}
                  >
                    {clr}
                  </button>
                ))}
              </div>
            </div>

            <label htmlFor="study-note-textarea" className="block text-xs font-medium text-[#575D66] mb-1.5">
              Personal Hifz / Study Note (Optional)
            </label>
            <textarea
              id="study-note-textarea"
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="e.g. Watch Mutashabih ending with Surah Al-Araf..."
              className="w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] p-3 text-sm text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLine(null)}
                className="min-h-[44px] rounded-xl border border-[#CBD5E1] px-4 py-2 text-xs font-medium text-[#575D66] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-5 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Save Highlight &amp; Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
