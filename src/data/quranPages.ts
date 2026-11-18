import { PdfPageMetadata } from '../types/quran';
import { ALL_PARAS, ALL_SURAHS } from './quranMetadata';

export const TOTAL_PDF_PAGES = 619;
export const MIN_MUSHAF_PAGE = 0; // Front Cover (PDF Page 1)
export const MAX_MUSHAF_PAGE = 618; // Closing Medallion (PDF Page 619)
export const FIRST_QURAN_PAGE = 2; // Surah Al-Fatihah (PDF Page 3)
export const LAST_QURAN_PAGE = 611; // Surah Al-Falaq & An-Nas (PDF Page 612)

export interface PdfLandmark {
  id: string;
  label: string;
  urduLabel: string;
  mushafPage: number;
  pdfPage: number;
}

export const PDF_LANDMARKS: PdfLandmark[] = [
  { id: 'cover', label: 'Cover', urduLabel: 'جلد / سرورق', mushafPage: 0, pdfPage: 1 },
  { id: 'title', label: 'Shamsa Title', urduLabel: 'لوحِ قرآنی', mushafPage: 1, pdfPage: 2 },
  { id: 'fatihah', label: 'Al-Fatihah', urduLabel: 'سورۃ الفاتحہ', mushafPage: 2, pdfPage: 3 },
  { id: 'kursi', label: 'Ayat-ul-Kursi', urduLabel: 'آیت الکرسی', mushafPage: 43, pdfPage: 44 },
  { id: 'yasin', label: 'Ya-Sin', urduLabel: 'سورۃ یٰسٓ', mushafPage: 441, pdfPage: 442 },
  { id: 'rahman', label: 'Ar-Rahman', urduLabel: 'سورۃ الرحمٰن', mushafPage: 532, pdfPage: 533 },
  { id: 'mulk', label: 'Al-Mulk', urduLabel: 'سورۃ الملک', mushafPage: 563, pdfPage: 564 },
  { id: 'nas', label: 'Al-Ikhlas & An-Nas', urduLabel: 'المعوذات', mushafPage: 610, pdfPage: 611 },
  { id: 'rumooz', label: 'Rumooz-e-Auqaf', urduLabel: 'رموزِ اوقاف', mushafPage: 612, pdfPage: 613 },
  { id: 'index', label: 'PDF Surah Index', urduLabel: 'فہرستِ سورتیں', mushafPage: 616, pdfPage: 617 },
];

export function getMushafPageImageUrl(pdfPage: number): string {
  const safePdf = Math.max(1, Math.min(TOTAL_PDF_PAGES, Math.round(pdfPage)));
  return `/mushaf-pages/p-${String(safePdf).padStart(3, '0')}.png`;
}

export function mushafPageToPdfPage(mushafPage: number): number {
  const safeMushaf = Math.max(MIN_MUSHAF_PAGE, Math.min(MAX_MUSHAF_PAGE, Math.round(mushafPage)));
  return Math.max(1, Math.min(TOTAL_PDF_PAGES, safeMushaf + 1));
}

export function pdfPageToMushafPage(pdfPage: number): number {
  const safePdf = Math.max(1, Math.min(TOTAL_PDF_PAGES, Math.round(pdfPage)));
  return safePdf - 1;
}

export function mapMushafToFallbackApiPage(mushafPage: number): number {
  if (mushafPage <= FIRST_QURAN_PAGE) return 1;
  if (mushafPage >= LAST_QURAN_PAGE) return 604;
  const ratio = (mushafPage - FIRST_QURAN_PAGE) / (LAST_QURAN_PAGE - FIRST_QURAN_PAGE);
  return Math.max(1, Math.min(604, Math.round(1 + ratio * 603)));
}

export function resolveSurahAndParaForPage(mushafPage: number) {
  const clampedQuranPage = Math.max(FIRST_QURAN_PAGE, Math.min(LAST_QURAN_PAGE, Math.round(mushafPage)));

  let matchedSurah = ALL_SURAHS[0];
  for (const s of ALL_SURAHS) {
    if (s.startPage <= clampedQuranPage) {
      matchedSurah = s;
    } else {
      break;
    }
  }

  let matchedPara = ALL_PARAS[0];
  for (const p of ALL_PARAS) {
    if (p.startPage <= clampedQuranPage) {
      matchedPara = p;
    } else {
      break;
    }
  }

  return { matchedSurah, matchedPara };
}

export function getPdfPageMetadata(mushafPage: number): PdfPageMetadata {
  const safeMushaf = Math.max(MIN_MUSHAF_PAGE, Math.min(MAX_MUSHAF_PAGE, Math.round(mushafPage)));
  const pdfPage = mushafPageToPdfPage(safeMushaf);
  const { matchedSurah, matchedPara } = resolveSurahAndParaForPage(safeMushaf);

  if (safeMushaf === 0) {
    return {
      mushafPage: 0,
      pdfPage: 1,
      isQuranTextPage: false,
      sectionLabel: 'Front Cover',
      sectionLabelUrdu: 'القرآن الکریم — سرورق',
      paraNumber: 1,
      paraArabic: ALL_PARAS[0].arabicName,
      surahNumber: 1,
      surahArabic: ALL_SURAHS[0].arabicName,
      surahUrdu: ALL_SURAHS[0].urduName,
      manzil: 1,
    };
  }

  if (safeMushaf === 1) {
    return {
      mushafPage: 1,
      pdfPage: 2,
      isQuranTextPage: false,
      sectionLabel: 'Title & Shamsa',
      sectionLabelUrdu: 'مجمع الملك فهد — لوحِ قرآنی',
      paraNumber: 1,
      paraArabic: ALL_PARAS[0].arabicName,
      surahNumber: 1,
      surahArabic: ALL_SURAHS[0].arabicName,
      surahUrdu: ALL_SURAHS[0].urduName,
      manzil: 1,
    };
  }

  if (safeMushaf >= 612 && safeMushaf <= 614) {
    return {
      mushafPage: safeMushaf,
      pdfPage,
      isQuranTextPage: false,
      sectionLabel: 'Rumooz-e-Auqaf',
      sectionLabelUrdu: 'رموزِ اوقاف قرآن مجید',
      paraNumber: 30,
      paraArabic: ALL_PARAS[29].arabicName,
      surahNumber: 114,
      surahArabic: ALL_SURAHS[113].arabicName,
      surahUrdu: ALL_SURAHS[113].urduName,
      manzil: 7,
    };
  }

  if (safeMushaf === 615) {
    return {
      mushafPage: 615,
      pdfPage: 616,
      isQuranTextPage: false,
      sectionLabel: 'Colophon',
      sectionLabelUrdu: 'اشاعت و طباعت کی تفصیل',
      paraNumber: 30,
      paraArabic: ALL_PARAS[29].arabicName,
      surahNumber: 114,
      surahArabic: ALL_SURAHS[113].arabicName,
      surahUrdu: ALL_SURAHS[113].urduName,
      manzil: 7,
    };
  }

  if (safeMushaf === 616 || safeMushaf === 617) {
    return {
      mushafPage: safeMushaf,
      pdfPage,
      isQuranTextPage: false,
      sectionLabel: 'Printed Surah Index',
      sectionLabelUrdu: 'قرآن مجید کی سورتوں کی فہرست',
      paraNumber: 30,
      paraArabic: ALL_PARAS[29].arabicName,
      surahNumber: 114,
      surahArabic: ALL_SURAHS[113].arabicName,
      surahUrdu: ALL_SURAHS[113].urduName,
      manzil: 7,
    };
  }

  if (safeMushaf === 618) {
    return {
      mushafPage: 618,
      pdfPage: 619,
      isQuranTextPage: false,
      sectionLabel: 'Closing Medallion',
      sectionLabelUrdu: 'خاتمۃ المصحف الشریف',
      paraNumber: 30,
      paraArabic: ALL_PARAS[29].arabicName,
      surahNumber: 114,
      surahArabic: ALL_SURAHS[113].arabicName,
      surahUrdu: ALL_SURAHS[113].urduName,
      manzil: 7,
    };
  }

  const manzil = Math.min(7, Math.floor(((safeMushaf - FIRST_QURAN_PAGE) / (LAST_QURAN_PAGE - FIRST_QURAN_PAGE + 1)) * 7) + 1);

  return {
    mushafPage: safeMushaf,
    pdfPage,
    isQuranTextPage: true,
    sectionLabel: `Mushaf Page ${safeMushaf}`,
    sectionLabelUrdu: `صفحہ ${safeMushaf}`,
    paraNumber: matchedPara.number,
    paraArabic: matchedPara.arabicName,
    surahNumber: matchedSurah.number,
    surahArabic: matchedSurah.arabicName,
    surahUrdu: matchedSurah.urduName,
    manzil,
  };
}
