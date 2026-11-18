import {
  CachedSurahTafsirPayload,
  QuranAyahWithTafsir,
  UrduTafsirEditionSlug,
  UrduTranslationEditionId,
} from '../types/quran';
import { getNaeemTafsirForSurah } from '../data/naeemTafsirNotes';
import { getCachedSurahTafsir, saveCachedSurahTafsir } from './siratCache';

export const STRICT_TRANSLATION_ID: UrduTranslationEditionId = 'ur.kanzuliman';
export const STRICT_TRANSLATION_LABEL_UR = 'ترجمہ: کنز الایمان (امام احمد رضا خان)';

export const STRICT_TAFSIR_SLUG: UrduTafsirEditionSlug = 'ur-noor-ul-irfan-sirat-ul-jinan';
export const STRICT_TAFSIR_HEADER_UR =
  'تفسیر: مفتی احمد یار خان نعیمی رحمۃ اللہ علیہ (نور العرفان) و صراط الجنان';

export interface AlQuranCloudAyahRaw {
  number: number;
  numberInSurah: number;
  text: string;
  juz?: number;
  page?: number;
}

export interface NaeemTafsirAyahRaw {
  ayah: number;
  surah?: number;
  text: string;
}

export function stripTafsirHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildSurahCacheKey(
  surahNumber: number,
  translationId: UrduTranslationEditionId = STRICT_TRANSLATION_ID,
  tafsirSlug: UrduTafsirEditionSlug = STRICT_TAFSIR_SLUG
): string {
  return `${surahNumber}:${translationId}:${tafsirSlug}`;
}

/**
 * Pure merge helper combining Arabic Ayahs, Kanz-ul-Imaan Urdu Tarjuma Ayahs,
 * and Mufti Ahmad Yaar Khan Naeemi's Noor-ul-Irfan / Sirat-ul-Jinan Tafsir Ayahs.
 */
export function mergeSurahAyahsAndTafsir(
  arabicAyahs: AlQuranCloudAyahRaw[],
  urduAyahs: AlQuranCloudAyahRaw[],
  tafsirAyahs: NaeemTafsirAyahRaw[]
): QuranAyahWithTafsir[] {
  const urduByNumber = new Map<number, AlQuranCloudAyahRaw>();
  for (const u of urduAyahs) {
    urduByNumber.set(u.numberInSurah, u);
  }

  const tafsirByNumber = new Map<number, string>();
  const sortedTafsir = [...tafsirAyahs].sort((a, b) => a.ayah - b.ayah);
  for (const t of sortedTafsir) {
    const cleaned = stripTafsirHtml(t.text);
    if (cleaned) {
      const prev = tafsirByNumber.get(t.ayah);
      tafsirByNumber.set(t.ayah, prev ? `${prev}\n\n${cleaned}` : cleaned);
    }
  }

  let lastAnchorAyah: number | null = null;
  let lastAnchorText = '';

  return arabicAyahs.map((ar) => {
    const u = urduByNumber.get(ar.numberInSurah);
    const directTafsir = tafsirByNumber.get(ar.numberInSurah);

    if (directTafsir) {
      lastAnchorAyah = ar.numberInSurah;
      lastAnchorText = directTafsir;
    }

    let resolvedTafsir = directTafsir ?? '';
    let tafsirNote: string | undefined;

    if (!resolvedTafsir && lastAnchorAyah !== null && lastAnchorText) {
      resolvedTafsir = lastAnchorText;
      tafsirNote = `اس آیت کی تفصیل آیت ${lastAnchorAyah} کی مشترکہ تفسیر میں شامل ہے۔`;
    }

    return {
      numberInSurah: ar.numberInSurah,
      globalAyahNumber: ar.number,
      juz: ar.juz ?? 1,
      apiPage: ar.page ?? 1,
      arabicText: ar.text.replace(/^\uFEFF/, '').trim(),
      urduTranslation: u?.text?.trim() || '',
      urduTafsir: resolvedTafsir,
      tafsirNote,
    };
  });
}

const inMemoryCache = new Map<string, CachedSurahTafsirPayload>();
const inFlightRequests = new Map<string, Promise<CachedSurahTafsirPayload>>();

export async function fetchCompleteSurahWithTafsir(
  surahNumber: number,
  options?: { forceRefresh?: boolean }
): Promise<{ payload: CachedSurahTafsirPayload; fromCache: boolean }> {
  const translationId = STRICT_TRANSLATION_ID;
  const tafsirSlug = STRICT_TAFSIR_SLUG;
  const cacheKey = buildSurahCacheKey(surahNumber, translationId, tafsirSlug);

  if (!options?.forceRefresh) {
    const mem = inMemoryCache.get(cacheKey);
    if (mem) return { payload: mem, fromCache: true };

    const stored = await getCachedSurahTafsir(cacheKey);
    if (
      stored &&
      stored.ayahs.length > 0 &&
      stored.translationId === STRICT_TRANSLATION_ID &&
      stored.tafsirSlug === STRICT_TAFSIR_SLUG
    ) {
      inMemoryCache.set(cacheKey, stored);
      return { payload: stored, fromCache: true };
    }
  }

  const existingPromise = inFlightRequests.get(cacheKey);
  if (existingPromise) {
    const payload = await existingPromise;
    return { payload, fromCache: false };
  }

  const requestPromise = (async (): Promise<CachedSurahTafsirPayload> => {
    // Strictly fetch ONLY Imam Ahmad Raza Khan's Kanz-ul-Imaan (ur.kanzuliman) alongside Arabic Indopak text
    const quranUrl = `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-indopak,${STRICT_TRANSLATION_ID}`;

    const quranRes = await fetch(quranUrl).then(async (res) => {
      if (!res.ok) throw new Error(`AlQuran Cloud API returned HTTP ${res.status}`);
      return res.json();
    });

    const editions = quranRes?.data as
      | { ayahs?: AlQuranCloudAyahRaw[]; edition?: { identifier?: string } }[]
      | undefined;

    if (!Array.isArray(editions) || editions.length < 2) {
      throw new Error('Incomplete Arabic or Kanz-ul-Imaan Urdu translation data received from AlQuran Cloud.');
    }

    const arabicAyahs = editions[0]?.ayahs ?? [];
    const urduAyahs = editions[1]?.ayahs ?? [];
    if (arabicAyahs.length === 0) {
      throw new Error('No Ayahs returned for this Surah.');
    }

    const juzByAyah = new Map<number, number>();
    for (const ar of arabicAyahs) {
      juzByAyah.set(ar.numberInSurah, ar.juz ?? 1);
    }

    // Strictly use Mufti Ahmad Yaar Khan Naeemi's Noor-ul-Irfan & Sirat-ul-Jinan (no other tafsir fallback)
    const naeemTafsirAyahs = getNaeemTafsirForSurah(
      surahNumber,
      arabicAyahs.map((a) => a.numberInSurah),
      juzByAyah
    );

    const merged = mergeSurahAyahsAndTafsir(arabicAyahs, urduAyahs, naeemTafsirAyahs);

    const payload: CachedSurahTafsirPayload = {
      cacheKey,
      surahNumber,
      translationId,
      tafsirSlug,
      resolvedTafsirSlug: tafsirSlug,
      fetchedAt: new Date().toISOString(),
      ayahs: merged,
    };

    inMemoryCache.set(cacheKey, payload);
    await saveCachedSurahTafsir(payload);
    return payload;
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  try {
    const payload = await requestPromise;
    return { payload, fromCache: false };
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
