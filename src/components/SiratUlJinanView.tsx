import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  Link2,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { ALL_SURAHS } from '../data/quranMetadata';
import { SIRAT_VOLUMES } from '../data/siratVolumes';
import {
  CachedSurahTafsirPayload,
  JildPdfAttachmentMeta,
  SiratVolume,
} from '../types/quran';
import { filterSiratVolumes, getJildForPara } from '../utils/quranLogic';
import {
  STRICT_TAFSIR_HEADER_UR,
  STRICT_TRANSLATION_LABEL_UR,
  fetchCompleteSurahWithTafsir,
} from '../utils/siratApi';
import {
  listAllJildPdfAttachments,
  listCachedSurahNumbers,
  removeJildPdfAttachment,
  saveJildPdfFile,
  saveJildPdfUrl,
} from '../utils/siratCache';
import { JildPdfViewerModal } from './JildPdfViewerModal';

interface SiratUlJinanViewProps {
  initialParaFilter?: number | 'all';
  pdfSyncVersion?: number;
  onOpenInMushaf: (page: number) => void;
}

export function SiratUlJinanView({
  initialParaFilter = 'all',
  pdfSyncVersion = 0,
  onOpenInMushaf,
}: SiratUlJinanViewProps) {
  const initialJild: number | 'all' =
    initialParaFilter === 'all' ? 'all' : getJildForPara(initialParaFilter);

  const [selectedJild, setSelectedJild] = useState<number | 'all'>(initialJild);
  const [indexQuery, setIndexQuery] = useState('');

  // Complete Surah Tarjuma (Kanz-ul-Imaan) & Tafsir (Noor-ul-Irfan / Sirat-ul-Jinan) Reader state
  const [activeSurahNumber, setActiveSurahNumber] = useState<number | null>(null);
  const [targetStartAyah, setTargetStartAyah] = useState<number>(1);

  const [surahPayload, setSurahPayload] = useState<CachedSurahTafsirPayload | null>(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);
  const [surahLoading, setSurahLoading] = useState(false);
  const [surahError, setSurahError] = useState<string | null>(null);
  const [ayahSearchQuery, setAyahSearchQuery] = useState('');
  const [copiedAyahKey, setCopiedAyahKey] = useState<string | null>(null);
  const [collapsedTafsirMap, setCollapsedTafsirMap] = useState<Record<number, boolean>>({});
  const [cachedSurahNumbers, setCachedSurahNumbers] = useState<number[]>([]);

  // Per-Jild custom PDF file / link state
  const [pdfAttachments, setPdfAttachments] = useState<Record<number, JildPdfAttachmentMeta>>({});
  const [openPdfVolume, setOpenPdfVolume] = useState<SiratVolume | null>(null);
  const [urlEditorJild, setUrlEditorJild] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [pdfActionMessage, setPdfActionMessage] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    listCachedSurahNumbers().then(setCachedSurahNumbers);
    listAllJildPdfAttachments().then(setPdfAttachments);
  }, [pdfSyncVersion]);

  useEffect(() => {
    if (initialParaFilter !== 'all') {
      setSelectedJild(getJildForPara(initialParaFilter));
    }
  }, [initialParaFilter]);

  const loadSurahData = async (surahNo: number, forceRefresh = false) => {
    setSurahLoading(true);
    setSurahError(null);
    try {
      const { payload, fromCache } = await fetchCompleteSurahWithTafsir(
        surahNo,
        { forceRefresh }
      );
      setSurahPayload(payload);
      setLoadedFromCache(fromCache);
      setSurahLoading(false);
      listCachedSurahNumbers().then(setCachedSurahNumbers);
    } catch (err) {
      setSurahLoading(false);
      setSurahError(
        err instanceof Error
          ? err.message
          : 'Unable to fetch Surah Tarjuma and Tafsir. Check your internet connection and retry.'
      );
    }
  };

  useEffect(() => {
    if (activeSurahNumber === null) return;
    loadSurahData(activeSurahNumber);
  }, [activeSurahNumber]);

  // Smoothly scroll to requested start Ayah after Surah data loads
  useEffect(() => {
    if (!surahPayload || surahLoading || targetStartAyah <= 1) return;
    const el = document.getElementById(`sirat-ayah-${targetStartAyah}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [surahPayload, surahLoading, targetStartAyah]);

  const openSurahReader = (surahNo: number, startAyah = 1) => {
    setAyahSearchQuery('');
    setCollapsedTafsirMap({});
    setTargetStartAyah(startAyah);
    setActiveSurahNumber(surahNo);
  };

  const filteredVolumes = useMemo(
    () => filterSiratVolumes(SIRAT_VOLUMES, ALL_SURAHS, indexQuery, selectedJild),
    [indexQuery, selectedJild]
  );

  const activeSurahMeta =
    activeSurahNumber !== null ? ALL_SURAHS[activeSurahNumber - 1] ?? null : null;

  const filteredAyahs = useMemo(() => {
    const all = surahPayload?.ayahs ?? [];
    const q = ayahSearchQuery.trim();
    if (!q) return all;
    const qLower = q.toLowerCase();
    return all.filter(
      (a) =>
        String(a.numberInSurah) === qLower ||
        a.arabicText.includes(q) ||
        a.urduTranslation.includes(q) ||
        a.urduTafsir.includes(q)
    );
  }, [surahPayload, ayahSearchQuery]);

  const handleSelectPdfFile = async (vol: SiratVolume, file: File | undefined) => {
    if (!file) return;
    setPdfActionMessage(null);
    const meta = await saveJildPdfFile(vol.jildNumber, file);
    setPdfAttachments((prev) => ({ ...prev, [vol.jildNumber]: meta }));
    setOpenPdfVolume(vol);
  };

  const handleAttachPdfUrl = async (e: React.FormEvent, vol: SiratVolume) => {
    e.preventDefault();
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    const meta = await saveJildPdfUrl(vol.jildNumber, trimmed);
    setPdfAttachments((prev) => ({ ...prev, [vol.jildNumber]: meta }));
    setUrlEditorJild(null);
    setUrlDraft('');
    setOpenPdfVolume(vol);
  };

  const handleRemovePdf = async (jildNumber: number) => {
    await removeJildPdfAttachment(jildNumber);
    setPdfAttachments((prev) => {
      const next = { ...prev };
      delete next[jildNumber];
      return next;
    });
    setPdfActionMessage(`Removed attached PDF for Jild ${jildNumber}.`);
  };

  const handleCopyAyah = async (
    surahName: string,
    ayahNo: number,
    arabic: string,
    urdu: string
  ) => {
    const text = `${surahName} (${ayahNo})\n${arabic}\n${urdu}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyahKey(`${activeSurahNumber}:${ayahNo}`);
      setTimeout(() => setCopiedAyahKey(null), 1800);
    } catch {
      // Clipboard blocked in non-HTTPS contexts
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 space-y-6">
      {/* VIEW 1: 10-Volume Noor-ul-Irfan & Sirat-ul-Jinan Index (Jild 1 to Jild 10) */}
      {activeSurahNumber === null && (
        <>
          <div className="flex flex-col gap-4 border-b border-[#E2DFD7] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
                Kanz-ul-Imaan &amp; Noor-ul-Irfan / Sirat-ul-Jinan
              </h1>
              <p className="font-urdu text-lg text-[#A87C14]" dir="rtl">
                {STRICT_TRANSLATION_LABEL_UR} · {STRICT_TAFSIR_HEADER_UR}
              </p>
              <p className="text-xs text-[#575D66] tabular-nums">
                10 Volumes (Jild 1–10) · All 114 Surahs &amp; 6,236 Ayahs · Strictly Kanz-ul-Imaan &amp; Mufti Ahmad Yaar Khan Naeemi ({cachedSurahNumbers.length}/114 Surahs cached)
              </p>
            </div>

            {/* Search & Direct 114-Surah Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
              <div className="relative w-full sm:w-60">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B58918]"
                  aria-hidden="true"
                />
                <label htmlFor="sirat-volume-search" className="sr-only">
                  Search Jild, Para, or Surah
                </label>
                <input
                  id="sirat-volume-search"
                  type="search"
                  value={indexQuery}
                  onChange={(e) => setIndexQuery(e.target.value)}
                  placeholder="Search Surah, Para, or Jild..."
                  className="min-h-[44px] w-full rounded-xl border border-[#CBD5E1] bg-white pl-9 pr-3 text-sm text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <label htmlFor="sirat-quick-surah-select" className="sr-only">
                Open any Surah (1 to 114)
              </label>
              <select
                id="sirat-quick-surah-select"
                aria-label="Open any Surah 1 to 114"
                value=""
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (num >= 1 && num <= 114) openSurahReader(num, 1);
                }}
                className="min-h-[44px] w-full sm:w-56 rounded-xl border border-[#D4AF37]/60 bg-[#FBF6E6] px-3 text-xs font-semibold text-[#9E7614] focus:border-[#D4AF37] focus:outline-none cursor-pointer"
              >
                <option value="">Open Any Surah (1–114)...</option>
                {ALL_SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.englishName} ({s.versesCount} Ayahs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 10-Jild Quick Filter Bar */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter by Sirat-ul-Jinan Jild volume"
          >
            <button
              type="button"
              onClick={() => setSelectedJild('all')}
              className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                selectedJild === 'all'
                  ? 'border-[#C59B27] bg-gradient-to-r from-[#C89D28] to-[#B6891B] text-white'
                  : 'border-[#CBD5E1] bg-white text-[#575D66] hover:border-[#D4AF37] hover:text-[#14171A]'
              }`}
            >
              All 10 Jilds
            </button>
            {SIRAT_VOLUMES.map((vol) => (
              <button
                key={vol.jildNumber}
                type="button"
                onClick={() => setSelectedJild(vol.jildNumber)}
                className={`min-h-[40px] rounded-xl border px-3 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors tabular-nums ${
                  selectedJild === vol.jildNumber
                    ? 'border-[#C59B27] bg-gradient-to-r from-[#C89D28] to-[#B6891B] text-white'
                    : 'border-[#CBD5E1] bg-white text-[#575D66] hover:border-[#D4AF37] hover:text-[#14171A]'
                }`}
              >
                Jild {vol.jildNumber}
              </button>
            ))}
          </div>

          {pdfActionMessage && (
            <div className="rounded-xl border border-[#E2DFD7] bg-white px-4 py-2.5 text-xs text-[#575D66]">
              {pdfActionMessage}
            </div>
          )}

          {/* 10-Volume Grid */}
          {filteredVolumes.length === 0 ? (
            <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center space-y-3">
              <p className="text-sm text-[#575D66]">
                No Jild or Surah matched &ldquo;{indexQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIndexQuery('');
                  setSelectedJild('all');
                }}
                className="min-h-[42px] rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-5 text-xs font-semibold text-white cursor-pointer"
              >
                Show All 10 Volumes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredVolumes.map((vol) => {
                const attached = pdfAttachments[vol.jildNumber];
                const isUrlOpen = urlEditorJild === vol.jildNumber;

                return (
                  <section
                    key={vol.jildNumber}
                    data-testid={`sirat-jild-card-${vol.jildNumber}`}
                    className="flex flex-col justify-between rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-[0_6px_20px_rgba(20,23,26,0.04)] space-y-4"
                  >
                    {/* Volume Header */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-[#E2DFD7] pb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#A87C14] tabular-nums">
                            <span>{vol.titleEn}</span>
                            <span aria-hidden="true">·</span>
                            <span>{vol.paraRangeLabelEn}</span>
                          </div>
                          <h2 className="mt-1 text-sm font-semibold text-[#14171A]">
                            {vol.surahRangeSummaryEn}
                          </h2>
                        </div>

                        <div className="text-right shrink-0" dir="rtl">
                          <div className="font-urdu text-lg font-semibold text-[#14171A] leading-tight">
                            {vol.titleUr}
                          </div>
                          <div className="font-urdu text-xs text-[#A87C14] leading-tight">
                            {vol.paraRangeLabelUr}
                          </div>
                        </div>
                      </div>

                      {/* Exact Surahs Covered in this Volume */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#575D66]">
                          Surahs in Jild {vol.jildNumber} ({vol.surahs.length})
                        </div>
                        <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1">
                          {vol.surahs.map((span) => {
                            const surah = ALL_SURAHS[span.surahNumber - 1];
                            if (!surah) return null;
                            const isCached = cachedSurahNumbers.includes(surah.number);

                            return (
                              <button
                                key={`${vol.jildNumber}-${span.surahNumber}-${span.startAyah}`}
                                type="button"
                                onClick={() => openSurahReader(surah.number, span.startAyah)}
                                data-testid={`jild-${vol.jildNumber}-surah-${surah.number}`}
                                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 py-1 text-xs text-[#14171A] hover:border-[#D4AF37] hover:bg-[#FBF6E6] transition-colors cursor-pointer"
                              >
                                <span className="font-mono-code text-[11px] font-semibold text-[#A87C14] tabular-nums">
                                  {surah.number}.
                                </span>
                                <span className="font-medium whitespace-nowrap">
                                  {surah.englishName}
                                </span>
                                {span.isPartial && (
                                  <span className="font-mono-code text-[10px] text-[#575D66] tabular-nums">
                                    ({span.startAyah}–{span.endAyah})
                                  </span>
                                )}
                                {isCached && (
                                  <Check
                                    className="h-3 w-3 text-emerald-700 shrink-0"
                                    aria-label="Cached offline"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Per-Volume Custom PDF File / Link Bar */}
                    <div className="border-t border-[#E2DFD7] pt-3.5 space-y-2.5">
                      <input
                        ref={(el) => {
                          fileInputRefs.current[vol.jildNumber] = el;
                        }}
                        type="file"
                        accept=".pdf,application/pdf"
                        aria-label={`Select PDF file for ${vol.titleEn}`}
                        data-testid={`jild-${vol.jildNumber}-pdf-input`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          handleSelectPdfFile(vol, file);
                          e.target.value = '';
                        }}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-[#14171A]">
                            <FileText className="h-3.5 w-3.5 text-[#B58918] shrink-0" aria-hidden="true" />
                            <span className="truncate font-mono-code text-[11px]">
                              {attached ? attached.fileName : vol.suggestedPdfFilename}
                            </span>
                          </div>
                          {attached && (
                            <div className="text-[11px] text-emerald-700">
                              {attached.sourceType === 'file'
                                ? `Saved in browser · Page ${attached.lastPdfPage}`
                                : `Linked URL · Page ${attached.lastPdfPage}`}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {attached && (
                            <>
                              <button
                                type="button"
                                onClick={() => setOpenPdfVolume(vol)}
                                data-testid={`open-jild-${vol.jildNumber}-pdf`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-3.5 text-xs font-semibold text-white shadow-xs hover:brightness-105 whitespace-nowrap cursor-pointer"
                              >
                                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Open PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePdf(vol.jildNumber)}
                                aria-label={`Remove PDF for Jild ${vol.jildNumber}`}
                                className="inline-flex min-h-[40px] w-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-rose-300 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[vol.jildNumber]?.click()}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-medium text-[#14171A] hover:border-[#D4AF37] whitespace-nowrap cursor-pointer"
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-[#B58918]" aria-hidden="true" />
                            <span>{attached ? 'Change File' : 'Select PDF'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUrlEditorJild(isUrlOpen ? null : vol.jildNumber);
                              setUrlDraft(attached?.customUrl ?? '');
                            }}
                            aria-expanded={isUrlOpen}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-medium text-[#14171A] hover:border-[#D4AF37] whitespace-nowrap cursor-pointer"
                          >
                            <Link2 className="h-3.5 w-3.5 text-[#B58918]" aria-hidden="true" />
                            <span>PDF Link</span>
                          </button>
                        </div>
                      </div>

                      {isUrlOpen && (
                        <form
                          onSubmit={(e) => handleAttachPdfUrl(e, vol)}
                          className="flex items-center gap-2 pt-1"
                        >
                          <label htmlFor={`jild-url-${vol.jildNumber}`} className="sr-only">
                            Custom PDF URL for Jild {vol.jildNumber}
                          </label>
                          <input
                            id={`jild-url-${vol.jildNumber}`}
                            type="url"
                            required
                            value={urlDraft}
                            onChange={(e) => setUrlDraft(e.target.value)}
                            placeholder={`https://.../sirat-ul-jinan-jild-${vol.jildNumber}.pdf`}
                            className="h-10 flex-1 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            className="min-h-[40px] rounded-xl bg-[#14171A] px-3.5 text-xs font-semibold text-[#F3D26A] whitespace-nowrap cursor-pointer"
                          >
                            Attach &amp; Open
                          </button>
                        </form>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: Complete Quran Urdu Tarjuma & Tafsir Reader (All 114 Surahs & 6,236 Ayahs) */}
      {activeSurahNumber !== null && activeSurahMeta && (
        <div className="space-y-5" data-testid="surah-tafsir-reader">
          {/* Top Reader Control Card */}
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-4 sm:p-5 shadow-[0_6px_20px_rgba(20,23,26,0.04)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DFD7] pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveSurahNumber(null)}
                  data-testid="back-to-volumes-button"
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-semibold text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14] shrink-0 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-[#A87C14]" aria-hidden="true" />
                  <span>All 10 Jilds</span>
                </button>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-lg sm:text-xl font-semibold text-[#14171A]">
                      {activeSurahMeta.number}. {activeSurahMeta.englishName}
                    </h1>
                    <span className="font-urdu text-lg font-semibold text-[#A87C14]" dir="rtl">
                      {activeSurahMeta.urduName}
                    </span>
                  </div>
                  <div className="text-xs text-[#575D66] tabular-nums">
                    {activeSurahMeta.revelationType} · {activeSurahMeta.versesCount} Ayahs · Para {activeSurahMeta.paraNumber} · Jild {getJildForPara(activeSurahMeta.paraNumber)}
                    {loadedFromCache ? ' · Cached Offline' : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenInMushaf(activeSurahMeta.startPage)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#D4AF37] bg-[#FBF6E6] px-3.5 text-xs font-semibold text-[#9E7614] hover:bg-[#D4AF37] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Read in Mushaf (Pg {activeSurahMeta.startPage})</span>
              </button>
            </div>

            {/* Surah / Ayah / Search Controls */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="reader-surah-switch"
                  className="mb-1 block text-[11px] font-semibold text-[#575D66]"
                >
                  Surah (1–114)
                </label>
                <select
                  id="reader-surah-switch"
                  value={activeSurahNumber}
                  onChange={(e) => openSurahReader(Number(e.target.value), 1)}
                  className="min-h-[42px] w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-medium text-[#14171A] focus:border-[#D4AF37] focus:outline-none cursor-pointer"
                >
                  {ALL_SURAHS.map((s) => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.englishName} ({s.versesCount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reader-ayah-jump"
                  className="mb-1 block text-[11px] font-semibold text-[#575D66]"
                >
                  Jump to Ayah (1–{activeSurahMeta.versesCount})
                </label>
                <select
                  id="reader-ayah-jump"
                  value={targetStartAyah}
                  onChange={(e) => {
                    const ay = Number(e.target.value);
                    setTargetStartAyah(ay);
                    document
                      .getElementById(`sirat-ayah-${ay}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="min-h-[42px] w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-medium text-[#14171A] focus:border-[#D4AF37] focus:outline-none cursor-pointer tabular-nums"
                >
                  {Array.from({ length: activeSurahMeta.versesCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Ayah {n} (آیت {n})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reader-ayah-search"
                  className="mb-1 block text-[11px] font-semibold text-[#575D66]"
                >
                  Search inside Surah
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#B58918]"
                    aria-hidden="true"
                  />
                  <input
                    id="reader-ayah-search"
                    type="search"
                    value={ayahSearchQuery}
                    onChange={(e) => setAyahSearchQuery(e.target.value)}
                    placeholder="Ayah # or Urdu text..."
                    className="min-h-[42px] w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] pl-8 pr-2.5 text-xs text-[#14171A] placeholder:text-[#94A3B8] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Strict Tarjuma Badge & Strict Tafsir Source Header */}
            <div
              className="flex flex-col gap-2 rounded-xl border border-[#D4AF37]/45 bg-[#FBF6E6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              dir="rtl"
            >
              <div
                data-testid="strict-translation-badge"
                className="inline-flex items-center rounded-lg border border-[#D4AF37]/60 bg-white px-3 py-1 font-urdu text-sm font-semibold text-[#9E7614]"
              >
                {STRICT_TRANSLATION_LABEL_UR}
              </div>
              <div
                data-testid="strict-tafsir-header"
                className="font-urdu text-sm font-semibold text-[#14171A]"
              >
                {STRICT_TAFSIR_HEADER_UR}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {surahLoading && (
            <div className="rounded-2xl border border-[#CBD5E1] bg-white p-12 text-center space-y-3">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#C59B27]" />
              <p className="font-urdu text-lg text-[#A87C14]" dir="rtl">
                {activeSurahMeta.urduName} — ترجمہ کنز الایمان اور تفسیر نور العرفان و صراط الجنان لوڈ ہو رہی ہے...
              </p>
              <p className="text-xs text-[#575D66]">
                Fetching all {activeSurahMeta.versesCount} Ayahs with Kanz-ul-Imaan and saving locally for offline access...
              </p>
            </div>
          )}

          {/* Error State */}
          {!surahLoading && surahError && (
            <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-4">
              <p className="text-sm font-medium text-rose-700">{surahError}</p>
              <button
                type="button"
                onClick={() => loadSurahData(activeSurahNumber, true)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-5 text-xs font-semibold text-white cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Retry Loading Surah</span>
              </button>
            </div>
          )}

          {/* Complete Ayah-by-Ayah Tarjuma & Tafsir List */}
          {!surahLoading && !surahError && surahPayload && (
            <div className="space-y-4" data-testid="tafsir-ayah-list">
              {filteredAyahs.length === 0 ? (
                <div className="rounded-2xl border border-[#CBD5E1] bg-white p-8 text-center space-y-3">
                  <p className="text-sm text-[#575D66]">
                    No Ayahs matched &ldquo;{ayahSearchQuery}&rdquo; in {activeSurahMeta.englishName}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAyahSearchQuery('')}
                    className="min-h-[40px] rounded-xl border border-[#D4AF37] bg-[#FBF6E6] px-4 text-xs font-semibold text-[#9E7614] cursor-pointer"
                  >
                    Show All {surahPayload.ayahs.length} Ayahs
                  </button>
                </div>
              ) : (
                filteredAyahs.map((ayah) => {
                  const isCollapsed = Boolean(collapsedTafsirMap[ayah.numberInSurah]);
                  const copyKey = `${activeSurahNumber}:${ayah.numberInSurah}`;

                  return (
                    <article
                      key={ayah.globalAyahNumber}
                      id={`sirat-ayah-${ayah.numberInSurah}`}
                      data-testid={`ayah-card-${ayah.numberInSurah}`}
                      className="scroll-mt-20 rounded-2xl border border-[#CBD5E1] bg-white p-5 sm:p-6 space-y-4 shadow-[0_4px_16px_rgba(20,23,26,0.03)]"
                    >
                      {/* Ayah Meta Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2DFD7] pb-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-[#575D66] tabular-nums">
                          <span className="font-semibold text-[#A87C14]">
                            Ayah {ayah.numberInSurah} of {activeSurahMeta.versesCount}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Para {ayah.juz}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyAyah(
                                activeSurahMeta.urduName,
                                ayah.numberInSurah,
                                ayah.arabicText,
                                ayah.urduTranslation
                              )
                            }
                            aria-label={`Copy Ayah ${ayah.numberInSurah}`}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-[11px] font-medium text-[#575D66] hover:border-[#D4AF37] hover:text-[#14171A] cursor-pointer"
                          >
                            {copiedAyahKey === copyKey ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {ayah.urduTafsir && (
                            <button
                              type="button"
                              onClick={() =>
                                setCollapsedTafsirMap((prev) => ({
                                  ...prev,
                                  [ayah.numberInSurah]: !prev[ayah.numberInSurah],
                                }))
                              }
                              className="inline-flex min-h-[36px] items-center rounded-lg border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-[11px] font-medium text-[#575D66] hover:border-[#D4AF37] hover:text-[#14171A] cursor-pointer"
                            >
                              {isCollapsed ? 'Show Tafsir' : 'Hide Tafsir'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Arabic Text */}
                      <p
                        className="font-quran rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] px-4 py-4 text-2xl sm:text-3xl leading-[2.2] text-[#14171A] text-right"
                        dir="rtl"
                      >
                        {ayah.arabicText}{' '}
                        <span className="text-[#A87C14] font-normal">
                          ﴿{ayah.numberInSurah}﴾
                        </span>
                      </p>

                      {/* Urdu Tarjuma — Strictly Kanz-ul-Imaan */}
                      <div className="space-y-1" dir="rtl">
                        <h2 className="font-urdu text-xs font-semibold text-[#A87C14]">
                          {STRICT_TRANSLATION_LABEL_UR}:
                        </h2>
                        <p className="font-urdu text-lg sm:text-xl leading-[2.3] text-[#14171A]">
                          {ayah.urduTranslation}
                        </p>
                      </div>

                      {/* Strict Noor-ul-Irfan & Sirat-ul-Jinan Tafsir */}
                      {!isCollapsed && (
                        <div className="space-y-1.5 border-t border-[#E2DFD7] pt-3.5" dir="rtl">
                          <h2 className="font-urdu text-xs font-semibold text-[#A87C14]">
                            {STRICT_TAFSIR_HEADER_UR}:
                          </h2>
                          {ayah.tafsirNote && (
                            <p className="font-urdu text-xs text-[#575D66]">{ayah.tafsirNote}</p>
                          )}
                          <p className="font-urdu text-base sm:text-lg leading-[2.35] whitespace-pre-line text-[#334155]">
                            {ayah.urduTafsir ||
                              'نور العرفان و صراط الجنان کے مطابق اس آیت کا مستند ترجمہ کنز الایمان اوپر درج ہے۔'}
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })
              )}

              {/* Bottom Surah Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={activeSurahNumber <= 1}
                  onClick={() => openSurahReader(activeSurahNumber - 1, 1)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-semibold text-[#14171A] hover:border-[#D4AF37] disabled:opacity-35 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {activeSurahNumber > 1
                      ? `${activeSurahNumber - 1}. ${ALL_SURAHS[activeSurahNumber - 2].englishName}`
                      : 'First Surah'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={activeSurahNumber >= 114}
                  onClick={() => openSurahReader(activeSurahNumber + 1, 1)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-semibold text-[#14171A] hover:border-[#D4AF37] disabled:opacity-35 cursor-pointer"
                >
                  <span>
                    {activeSurahNumber < 114
                      ? `${activeSurahNumber + 1}. ${ALL_SURAHS[activeSurahNumber].englishName}`
                      : 'Last Surah'}
                  </span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Built-In Jild PDF Reader Modal */}
      {openPdfVolume && pdfAttachments[openPdfVolume.jildNumber] && (
        <JildPdfViewerModal
          volume={openPdfVolume}
          attachment={pdfAttachments[openPdfVolume.jildNumber]}
          onClose={() => {
            setOpenPdfVolume(null);
            listAllJildPdfAttachments().then(setPdfAttachments);
          }}
        />
      )}
    </div>
  );
}
