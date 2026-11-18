export type FlipMode = 'curl3d' | 'swipeHorizontal' | 'swipeVertical';

export type AppSection =
  | 'dashboard'
  | 'reader'
  | 'surahs'
  | 'paras'
  | 'mutashabihat'
  | 'sirat'
  | 'bookmarks'
  | 'favorites'
  | 'notes'
  | 'android_code'
  | 'settings'
  | 'about';

export interface Surah {
  number: number;
  arabicName: string;
  urduName: string;
  englishName: string;
  meaning: string;
  revelationType: 'Makki' | 'Madani';
  versesCount: number;
  startPage: number; // Printed Mushaf page in the attached 15-Line Hafizi PDF (2..611)
  paraNumber: number;
}

export interface Para {
  number: number;
  arabicName: string;
  urduName: string;
  englishName: string;
  startSurah: string;
  startPage: number; // Printed Mushaf page in the attached 15-Line Hafizi PDF (2..587)
}

export interface MutashabihMatch {
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  paraNumber: number;
  page: number;
  line: number;
  differenceNoteUrdu: string;
}

export interface MutashabihEntry {
  id: string;
  paraNumber: number;
  surahNumber: number;
  surahName: string;
  arabicPhrase: string;
  page: number;
  line: number;
  category: 'Opening' | 'Ending' | 'Word Difference' | 'Tashabuh' | 'Waw/Fa';
  hifzTipUrdu: string;
  similarSpots: MutashabihMatch[];
}

export interface SiratUlJinanEntry {
  id: string;
  paraNumber: number;
  paraUrdu: string;
  surahNumber: number;
  surahArabic: string;
  surahUrdu: string;
  ayahRange: string;
  page: number;
  arabicText: string;
  urduTranslation: string;
  urduTafsir: string;
  keyLessonsUrdu: string[];
}

export interface PdfPageMetadata {
  mushafPage: number; // 0 (Cover), 1 (Title), 2..611 (Quran Text), 612..618 (Rumooz-e-Auqaf & Index)
  pdfPage: number; // 1..619 in the PDF file
  isQuranTextPage: boolean;
  sectionLabel: string;
  sectionLabelUrdu: string;
  paraNumber: number;
  paraArabic: string;
  surahNumber: number;
  surahArabic: string;
  surahUrdu: string;
  manzil: number;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  surahNumber: number;
  surahName: string;
  paraNumber: number;
  label: string;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  type: 'surah' | 'page';
  surahNumber: number;
  pageNumber: number;
  titleArabic: string;
  titleUrdu: string;
  subtitle: string;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  pageNumber: number;
  lineNumber: number; // 1-15
  surahName: string;
  noteText: string;
  highlightColor: 'gold' | 'emerald' | 'crimson';
  createdAt: string;
}

export interface LineHighlight {
  pageNumber: number;
  lineNumber: number;
  color: 'gold' | 'emerald' | 'crimson';
}

export interface ReaderSettings {
  flipMode: FlipMode;
  brightness: number; // 40 to 110
  comfortMode: boolean; // warm sepia reading comfort
  showLineGuides: boolean; // 15-line interactive Hifz overlay grid over PDF page
  lastReadPage: number; // Mushaf page (defaults to 2 = Al-Fatihah -> PDF page 3)
  lastReadSurah: string;
  lastReadPara: number;
  lastReadTimestamp: string;
}

export interface SiratVolumeSurahSpan {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  isPartial: boolean;
}

export interface SiratVolume {
  jildNumber: number; // 1 to 10
  titleEn: string;
  titleUr: string;
  paraStart: number;
  paraEnd: number;
  paraRangeLabelEn: string;
  paraRangeLabelUr: string;
  suggestedPdfFilename: string;
  surahRangeSummaryEn: string;
  surahRangeSummaryUr: string;
  surahs: SiratVolumeSurahSpan[];
}

export type UrduTranslationEditionId = 'ur.kanzuliman';

export type UrduTafsirEditionSlug = 'ur-noor-ul-irfan-sirat-ul-jinan';

export interface QuranAyahWithTafsir {
  numberInSurah: number;
  globalAyahNumber: number;
  juz: number;
  apiPage: number;
  arabicText: string;
  urduTranslation: string;
  urduTafsir: string;
  tafsirNote?: string;
}

export interface CachedSurahTafsirPayload {
  cacheKey: string;
  surahNumber: number;
  translationId: UrduTranslationEditionId;
  tafsirSlug: UrduTafsirEditionSlug;
  resolvedTafsirSlug: string;
  fetchedAt: string;
  ayahs: QuranAyahWithTafsir[];
}

export interface JildPdfAttachmentMeta {
  jildNumber: number;
  sourceType: 'file' | 'url';
  fileName: string;
  fileSize?: number;
  customUrl?: string;
  lastPdfPage: number;
  updatedAt: string;
}

export type HomeMenuSectionKey =
  | 'resume'
  | 'bookmarks'
  | 'notes'
  | 'paras'
  | 'surahs'
  | 'sirat'
  | 'mutashabihat'
  | 'quickPage';

export interface AdminAnnouncementBanner {
  enabled: boolean;
  titleEn: string;
  messageEn: string;
  messageUr: string;
}

export interface FeaturedDailyAyah {
  id: string;
  surahName: string;
  ayahRef: string;
  arabicText: string;
  urduTranslation: string;
  englishNote: string;
  createdAt: string;
}

export interface AdminAppConfig {
  adminPin: string;
  banner: AdminAnnouncementBanner;
  visibleHomeSections: Record<HomeMenuSectionKey, boolean>;
  quranPdfUrl: string;
  jildPdfUrls: Record<number, string>;
  defaultTranslationId: UrduTranslationEditionId;
  defaultTafsirSlug: UrduTafsirEditionSlug;
  customMutashabihat: MutashabihEntry[];
  featuredAyahs: FeaturedDailyAyah[];
  updatedAt: string;
}

