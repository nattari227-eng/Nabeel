import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { LineHighlight, PdfPageMetadata, StudyNote } from '../types/quran';
import {
  getMushafPageImageUrl,
  mapMushafToFallbackApiPage,
  TOTAL_PDF_PAGES,
} from '../data/quranPages';

interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
  surah?: {
    number: number;
    name: string;
    englishName: string;
  };
}

interface PdfQuranPageViewProps {
  pageMeta: PdfPageMetadata;
  comfortMode: boolean;
  showLineGuides: boolean;
  highlights: LineHighlight[];
  notes: StudyNote[];
  activeHighlightLine?: number | null;
  chromeVisible?: boolean;
  onCenterTap?: () => void;
  onSelectLine: (lineNumber: number) => void;
}

export function PdfQuranPageView({
  pageMeta,
  comfortMode,
  showLineGuides,
  highlights,
  notes,
  activeHighlightLine,
  chromeVisible = true,
  onCenterTap,
  onSelectLine,
}: PdfQuranPageViewProps) {
  const imageUrl = getMushafPageImageUrl(pageMeta.pdfPage);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Fallback AlQuran Cloud API state (triggered automatically only if the static page asset fails)
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackAyahs, setFallbackAyahs] = useState<ApiAyah[] | null>(null);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  const isLoaded = loadedUrl === imageUrl && !imageFailed;

  // Preload adjacent pages so page curls and swipes feel instant
  useEffect(() => {
    setImageFailed(false);
    setFallbackAyahs(null);
    setFallbackError(null);

    const neighbors = [pageMeta.pdfPage + 1, pageMeta.pdfPage - 1].filter(
      (p) => p >= 1 && p <= TOTAL_PDF_PAGES
    );
    for (const n of neighbors) {
      const pre = new Image();
      pre.src = getMushafPageImageUrl(n);
    }
  }, [pageMeta.pdfPage, reloadNonce]);

  // Automatic fallback to AlQuran Cloud API if an image fails to load
  useEffect(() => {
    if (!imageFailed || !pageMeta.isQuranTextPage) return;

    let cancelled = false;
    setFallbackLoading(true);
    setFallbackError(null);

    const apiPage = mapMushafToFallbackApiPage(pageMeta.mushafPage);
    fetch(`https://api.alquran.cloud/v1/page/${apiPage}/quran-indopak`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const ayahs: ApiAyah[] = json?.data?.ayahs ?? [];
        if (ayahs.length === 0) throw new Error('No Ayahs returned');
        setFallbackAyahs(ayahs);
        setFallbackLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setFallbackLoading(false);
        setFallbackError(err instanceof Error ? err.message : 'Unable to load Quran page.');
      });

    return () => {
      cancelled = true;
    };
  }, [imageFailed, pageMeta.isQuranTextPage, pageMeta.mushafPage]);

  const isCover = pageMeta.mushafPage === 0;
  const paperBg = isCover ? '#121316' : comfortMode ? '#F5ECD7' : '#FFFFFF';
  const cacheBustedUrl = reloadNonce > 0 ? `${imageUrl}?r=${reloadNonce}` : imageUrl;

  // Fit entire 15-line Mushaf page cleanly inside 100dvh without vertical or horizontal scrolling
  const responsiveWidth = chromeVisible
    ? 'min(calc(100vw - 12px), calc((100dvh - 76px) * 332 / 547))'
    : 'min(calc(100vw - 12px), calc((100dvh - 14px) * 332 / 547))';

  return (
    <div
      className="relative mx-auto rounded-2xl border border-[#D4AF37]/45 p-1 sm:p-1.5 shadow-[0_18px_48px_rgba(20,23,26,0.12)] transition-[width,background-color] duration-200"
      style={{
        backgroundColor: paperBg,
        width: responsiveWidth,
      }}
      data-testid="mushaf-page-frame"
    >
      {/* Royal Gold (#D4AF37) & Brushed Silver Frame */}
      <div className="relative rounded-xl border-[1.5px] border-[#CBD5E1] p-0.5">
        <div className="relative rounded-[8px] border-[1.5px] border-[#D4AF37] p-0.5">
          {/* Corner Royal Gold & Obsidian Medallions */}
          {(
            [
              'top-0 left-0',
              'top-0 right-0 -scale-x-100',
              'bottom-0 left-0 -scale-y-100',
              'bottom-0 right-0 -scale-x-100 -scale-y-100',
            ] as const
          ).map((pos, idx) => (
            <svg
              key={idx}
              aria-hidden="true"
              viewBox="0 0 48 48"
              className={`pointer-events-none absolute z-30 ${pos} h-5 w-5 sm:h-6 sm:w-6`}
            >
              <path d="M2 2 H24 L18 8 H8 V18 L2 24 Z" fill="#14171A" />
              <path d="M4 4 H20 L15 9 H9 V15 L4 20 Z" fill="#D4AF37" />
              <circle cx="13" cy="13" r="2.2" fill="#FFFFFF" />
            </svg>
          ))}

          {/* Fixed Aspect Ratio Mushaf Page Surface (~332 x 547 from the 15-Line PDF) */}
          <div
            className="relative w-full overflow-hidden rounded-[4px] aspect-[332/547]"
            style={{ backgroundColor: paperBg }}
          >
            {!imageFailed && (
              <img
                src={cacheBustedUrl}
                alt={
                  pageMeta.isQuranTextPage
                    ? `15-Line Hafizi Quran Page ${pageMeta.mushafPage} — ${pageMeta.surahUrdu}`
                    : `${pageMeta.sectionLabel} (PDF Page ${pageMeta.pdfPage})`
                }
                data-testid="mushaf-pdf-image"
                onLoad={() => setLoadedUrl(imageUrl)}
                onError={() => setImageFailed(true)}
                className={`h-full w-full object-contain select-none transition-opacity duration-150 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                } ${!isCover && comfortMode ? 'mix-blend-multiply' : ''}`}
                draggable={false}
              />
            )}

            {/* Center Tap Surface: smoothly hides/shows bottom reader toolbar */}
            {onCenterTap && !imageFailed && (
              <button
                type="button"
                onClick={onCenterTap}
                data-testid="mushaf-center-tap"
                aria-label={chromeVisible ? 'Hide bottom toolbar' : 'Show bottom toolbar'}
                className="absolute inset-0 z-10 cursor-pointer bg-transparent focus:outline-none"
              />
            )}

            {!isLoaded && !imageFailed && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#C59B27]" />
                <div className="font-quran text-xl text-[#14171A]" dir="rtl">
                  {pageMeta.sectionLabelUrdu}
                </div>
                <p className="text-xs font-medium text-[#575D66]">
                  Loading Mushaf Page {pageMeta.pdfPage} of {TOTAL_PDF_PAGES}...
                </p>
              </div>
            )}

            {/* Automatic AlQuran Cloud Indo-Pak Fallback if static image fails */}
            {imageFailed && (
              <div
                className="absolute inset-0 z-20 flex flex-col justify-between overflow-y-auto p-5 sm:p-7"
                style={{ backgroundColor: paperBg }}
              >
                {fallbackLoading && (
                  <div className="m-auto flex flex-col items-center gap-3 text-center">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#C59B27]" />
                    <p className="text-xs font-medium text-[#575D66]">
                      Loading Quran text via AlQuran Cloud...
                    </p>
                  </div>
                )}

                {fallbackAyahs && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D4AF37]/40 pb-2 text-xs text-[#9E7614]">
                      <span className="font-urdu" dir="rtl">
                        {pageMeta.surahUrdu}
                      </span>
                      <span className="font-mono-code">Page {pageMeta.mushafPage}</span>
                    </div>
                    <p
                      className="font-quran text-justify text-xl sm:text-2xl leading-[2.25] text-[#000000]"
                      dir="rtl"
                      data-testid="mushaf-api-fallback-text"
                    >
                      {fallbackAyahs.map((a) => `${a.text} ﴿${a.numberInSurah}﴾ `).join('')}
                    </p>
                  </div>
                )}

                {fallbackError && (
                  <div className="m-auto flex flex-col items-center gap-3 text-center">
                    <p className="text-sm font-medium text-rose-700">{fallbackError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFailed(false);
                        setReloadNonce((n) => n + 1);
                      }}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#14171A] px-4 py-2 text-xs font-semibold text-[#F3D26A] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Retry Page</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Non-blocking visual highlight bands across the 15 lines */}
            {pageMeta.isQuranTextPage && isLoaded && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[6.5%] top-[8.2%] bottom-[6.8%] z-10 grid grid-rows-15"
              >
                {Array.from({ length: 15 }, (_, idx) => {
                  const lineNo = idx + 1;
                  const hl = highlights.find(
                    (h) => h.pageNumber === pageMeta.mushafPage && h.lineNumber === lineNo
                  );
                  const isMutashabihFocus = activeHighlightLine === lineNo;

                  let bandClass = '';
                  if (isMutashabihFocus) {
                    bandClass = 'bg-[#D4AF37]/25 ring-1 ring-inset ring-[#C59B27]';
                  } else if (hl?.color === 'gold') {
                    bandClass = 'bg-[#D4AF37]/22';
                  } else if (hl?.color === 'emerald') {
                    bandClass = 'bg-emerald-600/18';
                  } else if (hl?.color === 'crimson') {
                    bandClass = 'bg-rose-600/18';
                  }

                  return <div key={lineNo} className={bandClass} />;
                })}
              </div>
            )}

            {/* Right-margin L1..L15 triggers when Hifz line guides are enabled (leaves center 90% free for tap-to-toggle) */}
            {pageMeta.isQuranTextPage && showLineGuides && isLoaded && (
              <div
                className="pointer-events-none absolute right-0.5 top-[8.2%] bottom-[6.8%] z-20 grid w-8 grid-rows-15"
                aria-label="15-line Hifz margin markers"
              >
                {Array.from({ length: 15 }, (_, idx) => {
                  const lineNo = idx + 1;
                  const hl = highlights.find(
                    (h) => h.pageNumber === pageMeta.mushafPage && h.lineNumber === lineNo
                  );
                  const lineNotes = notes.filter(
                    (n) => n.pageNumber === pageMeta.mushafPage && n.lineNumber === lineNo
                  );
                  const isMutashabihFocus = activeHighlightLine === lineNo;
                  const hasData = lineNotes.length > 0 || Boolean(hl) || isMutashabihFocus;

                  return (
                    <button
                      key={lineNo}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLine(lineNo);
                      }}
                      aria-label={`Line ${lineNo} on Mushaf page ${pageMeta.mushafPage}`}
                      className="pointer-events-auto group flex items-center justify-end pr-0.5 cursor-pointer"
                    >
                      <span
                        className={`rounded px-1 font-mono-code text-[8px] leading-tight transition-opacity tabular-nums ${
                          hasData
                            ? 'bg-[#14171A]/85 text-[#F3D26A] opacity-100'
                            : 'bg-[#14171A]/65 text-white opacity-35 group-hover:opacity-100'
                        }`}
                      >
                        {lineNotes.length > 0 ? `★${lineNo}` : `${lineNo}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
