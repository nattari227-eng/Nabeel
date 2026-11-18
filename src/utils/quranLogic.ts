import {
  Bookmark,
  FavoriteItem,
  LineHighlight,
  MutashabihEntry,
  ReaderSettings,
  SiratUlJinanEntry,
  SiratVolume,
  StudyNote,
  Surah,
} from '../types/quran';
import { FIRST_QURAN_PAGE, MAX_MUSHAF_PAGE, MIN_MUSHAF_PAGE } from '../data/quranPages';

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  flipMode: 'curl3d',
  brightness: 100,
  comfortMode: false,
  showLineGuides: true,
  lastReadPage: FIRST_QURAN_PAGE, // Printed Mushaf Page 2 = Surah Al-Fatihah (PDF Page 3)
  lastReadSurah: 'Al-Fatihah',
  lastReadPara: 1,
  lastReadTimestamp: new Date().toISOString(),
};

export function clampPageNumber(page: number, minPage: number = MIN_MUSHAF_PAGE, maxPage: number = MAX_MUSHAF_PAGE): number {
  if (!Number.isFinite(page)) return FIRST_QURAN_PAGE;
  return Math.max(minPage, Math.min(maxPage, Math.round(page)));
}

export function parsePageInput(
  raw: string,
  maxPage: number = MAX_MUSHAF_PAGE,
  minPage: number = 1
): { valid: boolean; page?: number; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a page number.' };
  }
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < minPage || num > maxPage) {
    return { valid: false, error: `Enter a valid page between ${minPage} and ${maxPage}.` };
  }
  return { valid: true, page: num };
}

export function filterSurahs(
  surahs: Surah[],
  query: string,
  revelationFilter: 'All' | 'Makki' | 'Madani'
): Surah[] {
  const q = query.trim().toLowerCase();
  return surahs.filter((s) => {
    const matchesRev = revelationFilter === 'All' || s.revelationType === revelationFilter;
    if (!matchesRev) return false;
    if (!q) return true;
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.meaning.toLowerCase().includes(q) ||
      s.arabicName.includes(query.trim()) ||
      s.urduName.includes(query.trim()) ||
      String(s.number) === q
    );
  });
}

export function filterMutashabihat(
  entries: MutashabihEntry[],
  query: string,
  paraFilter: number | 'all'
): MutashabihEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((item) => {
    if (paraFilter !== 'all' && item.paraNumber !== paraFilter) return false;
    if (!q) return true;
    return (
      item.surahName.toLowerCase().includes(q) ||
      item.arabicPhrase.includes(query.trim()) ||
      item.hifzTipUrdu.includes(query.trim()) ||
      item.category.toLowerCase().includes(q) ||
      String(item.page) === q
    );
  });
}

export function filterSiratUlJinan(
  entries: SiratUlJinanEntry[],
  query: string,
  paraFilter: number | 'all',
  surahFilter: number | 'all'
): SiratUlJinanEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (paraFilter !== 'all' && entry.paraNumber !== paraFilter) return false;
    if (surahFilter !== 'all' && entry.surahNumber !== surahFilter) return false;
    if (!q) return true;
    return (
      entry.surahUrdu.includes(query.trim()) ||
      entry.surahArabic.includes(query.trim()) ||
      entry.urduTranslation.includes(query.trim()) ||
      entry.urduTafsir.includes(query.trim()) ||
      entry.paraUrdu.includes(query.trim())
    );
  });
}

export function toggleBookmark(list: Bookmark[], candidate: Omit<Bookmark, 'id' | 'createdAt'>): {
  next: Bookmark[];
  added: boolean;
} {
  const existing = list.find((b) => b.pageNumber === candidate.pageNumber);
  if (existing) {
    return {
      next: list.filter((b) => b.pageNumber !== candidate.pageNumber),
      added: false,
    };
  }
  const newItem: Bookmark = {
    ...candidate,
    id: `bm-${candidate.pageNumber}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return {
    next: [newItem, ...list],
    added: true,
  };
}

export function toggleFavorite(list: FavoriteItem[], candidate: Omit<FavoriteItem, 'id' | 'createdAt'>): {
  next: FavoriteItem[];
  added: boolean;
} {
  const existing = list.find(
    (f) => f.type === candidate.type && f.surahNumber === candidate.surahNumber && f.pageNumber === candidate.pageNumber
  );
  if (existing) {
    return {
      next: list.filter((f) => f.id !== existing.id),
      added: false,
    };
  }
  const newItem: FavoriteItem = {
    ...candidate,
    id: `fav-${candidate.type}-${candidate.surahNumber}-${candidate.pageNumber}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return {
    next: [newItem, ...list],
    added: true,
  };
}

export function addStudyNote(
  list: StudyNote[],
  payload: Omit<StudyNote, 'id' | 'createdAt'>
): StudyNote[] {
  const trimmed = payload.noteText.trim();
  if (!trimmed) return list;
  const note: StudyNote = {
    ...payload,
    noteText: trimmed,
    id: `note-${payload.pageNumber}-${payload.lineNumber}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return [note, ...list];
}

export function toggleHighlight(
  list: LineHighlight[],
  pageNumber: number,
  lineNumber: number,
  color: 'gold' | 'emerald' | 'crimson'
): LineHighlight[] {
  const existing = list.find((h) => h.pageNumber === pageNumber && h.lineNumber === lineNumber);
  if (existing && existing.color === color) {
    return list.filter((h) => !(h.pageNumber === pageNumber && h.lineNumber === lineNumber));
  }
  const withoutTarget = list.filter((h) => !(h.pageNumber === pageNumber && h.lineNumber === lineNumber));
  return [...withoutTarget, { pageNumber, lineNumber, color }];
}

export function computePaperStyleFilter(brightness: number, comfortMode: boolean): string {
  const clampedBrightness = Math.max(40, Math.min(110, brightness));
  const sepia = comfortMode ? 0.24 : 0;
  const contrast = comfortMode ? 0.96 : 1;
  return `brightness(${(clampedBrightness / 100).toFixed(2)}) sepia(${sepia}) contrast(${contrast})`;
}

export interface SectionHeaderInfo {
  titleEn: string;
  titleUr: string;
}

const VALID_SECTIONS = new Set<string>([
  'dashboard',
  'reader',
  'surahs',
  'paras',
  'mutashabihat',
  'sirat',
  'bookmarks',
  'favorites',
  'notes',
  'android_code',
  'settings',
  'about',
]);

export function resolveSectionFromPopState(state: unknown): string {
  if (state && typeof state === 'object' && 'section' in state) {
    const candidate = (state as { section?: unknown }).section;
    if (typeof candidate === 'string' && VALID_SECTIONS.has(candidate)) {
      return candidate;
    }
  }
  return 'dashboard';
}

export function getSectionHeaderInfo(section: string): SectionHeaderInfo {
  switch (section) {
    case 'surahs':
      return { titleEn: 'Surah Index', titleUr: 'سورتوں کی فہرست' };
    case 'paras':
      return { titleEn: 'Juz / Para Index', titleUr: 'پاروں کی فہرست' };
    case 'mutashabihat':
      return { titleEn: 'Mutashabihat Index', titleUr: 'متشابہات قرآن' };
    case 'sirat':
      return { titleEn: 'Sirat-ul-Jinan Tafsir', titleUr: 'صراط الجنان تفسیر' };
    case 'bookmarks':
      return { titleEn: 'Bookmarks', titleUr: 'نشاندہی' };
    case 'favorites':
      return { titleEn: 'Favorites', titleUr: 'پسندیدہ' };
    case 'notes':
      return { titleEn: 'Personal Notes', titleUr: 'ذاتی نوٹس' };
    case 'android_code':
      return { titleEn: 'Android Source', titleUr: 'اینڈرائیڈ کوڈ' };
    case 'settings':
      return { titleEn: 'Settings', titleUr: 'ترتیبات' };
    case 'about':
      return { titleEn: 'About App', titleUr: 'تعارف' };
    case 'reader':
      return { titleEn: 'Quran Reader', titleUr: 'قرآنِ مجید' };
    default:
      return { titleEn: 'Al-Mushaf', titleUr: 'المصحف' };
  }
}

export function getJildForPara(paraNumber: number): number {
  if (!Number.isFinite(paraNumber)) return 1;
  const clamped = Math.max(1, Math.min(30, Math.round(paraNumber)));
  return Math.ceil(clamped / 3);
}

export function filterSiratVolumes(
  volumes: SiratVolume[],
  surahs: Surah[],
  query: string,
  selectedJild: number | 'all'
): SiratVolume[] {
  const q = query.trim().toLowerCase();
  const rawQ = query.trim();

  return volumes.filter((vol) => {
    if (selectedJild !== 'all' && vol.jildNumber !== selectedJild) {
      return false;
    }
    if (!q) return true;

    if (
      vol.titleEn.toLowerCase().includes(q) ||
      vol.titleUr.includes(rawQ) ||
      vol.paraRangeLabelEn.toLowerCase().includes(q) ||
      vol.paraRangeLabelUr.includes(rawQ) ||
      vol.surahRangeSummaryEn.toLowerCase().includes(q) ||
      vol.surahRangeSummaryUr.includes(rawQ) ||
      `jild ${vol.jildNumber}` === q ||
      String(vol.jildNumber) === q
    ) {
      return true;
    }

    // Check if any Para in this Jild matches query (e.g. "para 22")
    for (let p = vol.paraStart; p <= vol.paraEnd; p += 1) {
      if (`para ${p}` === q || `juz ${p}` === q || String(p) === q) {
        return true;
      }
    }

    // Check if any Surah inside this Jild matches query
    return vol.surahs.some((span) => {
      const s = surahs[span.surahNumber - 1];
      if (!s) return false;
      return (
        s.englishName.toLowerCase().includes(q) ||
        s.meaning.toLowerCase().includes(q) ||
        s.arabicName.includes(rawQ) ||
        s.urduName.includes(rawQ) ||
        String(s.number) === q
      );
    });
  });
}
