import {
  AdminAppConfig,
  FeaturedDailyAyah,
  HomeMenuSectionKey,
  MutashabihEntry,
  UrduTafsirEditionSlug,
  UrduTranslationEditionId,
} from '../types/quran';
import { removeJildPdfAttachment, saveJildPdfUrl } from './siratCache';

export const ADMIN_CONFIG_STORAGE_KEY = 'almushaf_admin_config_v1';
export const DEFAULT_ADMIN_PIN = '7860';

export const HOME_SECTION_LABELS: {
  key: HomeMenuSectionKey;
  labelEn: string;
  labelUr: string;
}[] = [
  { key: 'resume', labelEn: 'Resume Last Read', labelUr: 'دوبارہ شروع' },
  { key: 'bookmarks', labelEn: 'Bookmarks', labelUr: 'نشاندہی' },
  { key: 'notes', labelEn: 'Notes', labelUr: 'نوٹس' },
  { key: 'paras', labelEn: 'Juz / Para Index (30)', labelUr: 'پاروں کی فہرست' },
  { key: 'surahs', labelEn: 'Surah Index (114)', labelUr: 'سورتوں کی فہرست' },
  { key: 'sirat', labelEn: 'Sirat-ul-Jinan Tafsir', labelUr: 'صراط الجنان تفسیر' },
  { key: 'mutashabihat', labelEn: 'Mutashabihat Index', labelUr: 'متشابہات قرآن' },
  { key: 'quickPage', labelEn: 'Go to Page # Input', labelUr: 'صفحہ نمبر' },
];

export const DEFAULT_VISIBLE_HOME_SECTIONS: Record<HomeMenuSectionKey, boolean> = {
  resume: true,
  bookmarks: true,
  notes: true,
  paras: true,
  surahs: true,
  sirat: true,
  mutashabihat: true,
  quickPage: true,
};

const VALID_TRANSLATION_IDS: UrduTranslationEditionId[] = ['ur.kanzuliman'];

const VALID_TAFSIR_SLUGS: UrduTafsirEditionSlug[] = ['ur-noor-ul-irfan-sirat-ul-jinan'];

export const DEFAULT_ADMIN_CONFIG: AdminAppConfig = {
  adminPin: DEFAULT_ADMIN_PIN,
  banner: {
    enabled: false,
    titleEn: 'Jumma Mubarak & Recitation Reminder',
    messageEn: 'Remember to recite Surah Al-Kahf today and send Salawat upon the Prophet ﷺ.',
    messageUr: 'جمعۃ المبارک: آج سورۃ الکہف کی تلاوت اور کثرت سے درودِ پاک کا اہتمام فرمائیں۔',
  },
  visibleHomeSections: { ...DEFAULT_VISIBLE_HOME_SECTIONS },
  quranPdfUrl: '',
  jildPdfUrls: {},
  defaultTranslationId: 'ur.kanzuliman',
  defaultTafsirSlug: 'ur-noor-ul-irfan-sirat-ul-jinan',
  customMutashabihat: [],
  featuredAyahs: [],
  updatedAt: new Date(0).toISOString(),
};

/**
 * Pure tap-window detector for hidden owner access.
 * Triggers only when `requiredTaps` (default 5) occur within `windowMs` (default 3000ms).
 */
export function recordSecretLogoTap(
  taps: number[],
  nowMs: number,
  requiredTaps = 5,
  windowMs = 3000
): { nextTaps: number[]; triggered: boolean } {
  const recent = taps.filter((t) => nowMs - t >= 0 && nowMs - t <= windowMs);
  recent.push(nowMs);
  if (recent.length >= requiredTaps) {
    return { nextTaps: [], triggered: true };
  }
  return { nextTaps: recent, triggered: false };
}

export function verifyAdminPin(inputPin: string, storedPin: string): boolean {
  const cleanedInput = inputPin.trim();
  const cleanedStored = (storedPin || DEFAULT_ADMIN_PIN).trim();
  return cleanedInput.length > 0 && cleanedInput === cleanedStored;
}

export function validateNewPin(
  newPin: string,
  confirmPin: string
): { valid: boolean; error?: string } {
  const trimmed = newPin.trim();
  if (trimmed.length < 4 || trimmed.length > 12) {
    return { valid: false, error: 'PIN must be 4 to 12 characters long.' };
  }
  if (/\s/.test(trimmed)) {
    return { valid: false, error: 'PIN cannot contain spaces.' };
  }
  if (trimmed !== confirmPin.trim()) {
    return { valid: false, error: 'New PIN and confirmation PIN do not match.' };
  }
  return { valid: true };
}

function sanitizeMutashabihList(raw: unknown): MutashabihEntry[] {
  if (!Array.isArray(raw)) return [];
  const validCategories = new Set([
    'Opening',
    'Ending',
    'Word Difference',
    'Tashabuh',
    'Waw/Fa',
  ]);
  const list: MutashabihEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.arabicPhrase !== 'string' || !rec.arabicPhrase.trim()) continue;
    const category =
      typeof rec.category === 'string' && validCategories.has(rec.category)
        ? (rec.category as MutashabihEntry['category'])
        : 'Tashabuh';
    const spots = Array.isArray(rec.similarSpots)
      ? rec.similarSpots
          .filter((s) => s && typeof s === 'object')
          .map((s) => {
            const sr = s as Record<string, unknown>;
            return {
              surahName: String(sr.surahName ?? 'Al-Baqarah'),
              surahNumber: Math.max(1, Math.min(114, Number(sr.surahNumber) || 2)),
              ayahNumber: Math.max(1, Number(sr.ayahNumber) || 1),
              paraNumber: Math.max(1, Math.min(30, Number(sr.paraNumber) || 1)),
              page: Math.max(2, Math.min(611, Number(sr.page) || 2)),
              line: Math.max(1, Math.min(15, Number(sr.line) || 1)),
              differenceNoteUrdu: String(sr.differenceNoteUrdu ?? ''),
            };
          })
      : [];
    list.push({
      id: typeof rec.id === 'string' && rec.id ? rec.id : `custom-mut-${Date.now()}`,
      paraNumber: Math.max(1, Math.min(30, Number(rec.paraNumber) || 1)),
      surahNumber: Math.max(1, Math.min(114, Number(rec.surahNumber) || 2)),
      surahName: String(rec.surahName ?? 'Al-Baqarah'),
      arabicPhrase: rec.arabicPhrase.trim(),
      page: Math.max(2, Math.min(611, Number(rec.page) || 2)),
      line: Math.max(1, Math.min(15, Number(rec.line) || 1)),
      category,
      hifzTipUrdu: String(rec.hifzTipUrdu ?? ''),
      similarSpots: spots,
    });
  }
  return list;
}

function sanitizeFeaturedAyahs(raw: unknown): FeaturedDailyAyah[] {
  if (!Array.isArray(raw)) return [];
  const list: FeaturedDailyAyah[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.arabicText !== 'string' || !rec.arabicText.trim()) continue;
    list.push({
      id: typeof rec.id === 'string' && rec.id ? rec.id : `ayah-${Date.now()}`,
      surahName: String(rec.surahName ?? 'Al-Quran'),
      ayahRef: String(rec.ayahRef ?? '1:1'),
      arabicText: rec.arabicText.trim(),
      urduTranslation: String(rec.urduTranslation ?? ''),
      englishNote: String(rec.englishNote ?? ''),
      createdAt:
        typeof rec.createdAt === 'string' && rec.createdAt
          ? rec.createdAt
          : new Date().toISOString(),
    });
  }
  return list;
}

export function sanitizeAdminConfig(raw: unknown): AdminAppConfig {
  const base: AdminAppConfig = {
    ...DEFAULT_ADMIN_CONFIG,
    banner: { ...DEFAULT_ADMIN_CONFIG.banner },
    visibleHomeSections: { ...DEFAULT_VISIBLE_HOME_SECTIONS },
    jildPdfUrls: {},
    customMutashabihat: [],
    featuredAyahs: [],
  };

  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.adminPin === 'string' && obj.adminPin.trim().length >= 4) {
    base.adminPin = obj.adminPin.trim().slice(0, 12);
  }

  if (obj.banner && typeof obj.banner === 'object') {
    const b = obj.banner as Record<string, unknown>;
    base.banner = {
      enabled: Boolean(b.enabled),
      titleEn: typeof b.titleEn === 'string' ? b.titleEn : base.banner.titleEn,
      messageEn: typeof b.messageEn === 'string' ? b.messageEn : base.banner.messageEn,
      messageUr: typeof b.messageUr === 'string' ? b.messageUr : base.banner.messageUr,
    };
  }

  if (obj.visibleHomeSections && typeof obj.visibleHomeSections === 'object') {
    const vis = obj.visibleHomeSections as Record<string, unknown>;
    for (const { key } of HOME_SECTION_LABELS) {
      if (typeof vis[key] === 'boolean') {
        base.visibleHomeSections[key] = vis[key] as boolean;
      }
    }
  }

  if (typeof obj.quranPdfUrl === 'string') {
    base.quranPdfUrl = obj.quranPdfUrl.trim();
  }

  if (obj.jildPdfUrls && typeof obj.jildPdfUrls === 'object') {
    const urls = obj.jildPdfUrls as Record<string, unknown>;
    for (let j = 1; j <= 10; j += 1) {
      const val = urls[String(j)];
      if (typeof val === 'string' && val.trim()) {
        base.jildPdfUrls[j] = val.trim();
      }
    }
  }

  if (
    typeof obj.defaultTranslationId === 'string' &&
    VALID_TRANSLATION_IDS.includes(obj.defaultTranslationId as UrduTranslationEditionId)
  ) {
    base.defaultTranslationId = obj.defaultTranslationId as UrduTranslationEditionId;
  }

  if (
    typeof obj.defaultTafsirSlug === 'string' &&
    VALID_TAFSIR_SLUGS.includes(obj.defaultTafsirSlug as UrduTafsirEditionSlug)
  ) {
    base.defaultTafsirSlug = obj.defaultTafsirSlug as UrduTafsirEditionSlug;
  }

  base.customMutashabihat = sanitizeMutashabihList(obj.customMutashabihat);
  base.featuredAyahs = sanitizeFeaturedAyahs(obj.featuredAyahs);
  base.updatedAt =
    typeof obj.updatedAt === 'string' && obj.updatedAt
      ? obj.updatedAt
      : new Date().toISOString();

  return base;
}

export function parseAndValidateAdminConfigJson(rawJson: string): {
  valid: boolean;
  config?: AdminAppConfig;
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Configuration file must contain a valid JSON object.' };
    }
    const obj = parsed as Record<string, unknown>;
    const hasKnownKey = [
      'adminPin',
      'banner',
      'visibleHomeSections',
      'quranPdfUrl',
      'jildPdfUrls',
      'customMutashabihat',
      'featuredAyahs',
      'defaultTranslationId',
      'defaultTafsirSlug',
    ].some((k) => k in obj);

    if (!hasKnownKey) {
      return {
        valid: false,
        error: 'Unrecognized JSON format. Please import an exported Al-Mushaf config file.',
      };
    }

    const sanitized = sanitizeAdminConfig(parsed);
    sanitized.updatedAt = new Date().toISOString();
    return { valid: true, config: sanitized };
  } catch {
    return { valid: false, error: 'Invalid JSON syntax. Unable to parse configuration file.' };
  }
}

export function loadAdminConfig(): AdminAppConfig {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_CONFIG;
  try {
    const raw = window.localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_CONFIG;
    return sanitizeAdminConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminConfig(config: AdminAppConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}

export async function syncJildPdfUrlsWithCache(
  nextUrls: Record<number, string>,
  prevUrls: Record<number, string> = {}
): Promise<void> {
  for (let j = 1; j <= 10; j += 1) {
    const nextUrl = (nextUrls[j] ?? '').trim();
    const prevUrl = (prevUrls[j] ?? '').trim();
    if (nextUrl) {
      if (nextUrl !== prevUrl) {
        await saveJildPdfUrl(j, nextUrl);
      }
    } else if (prevUrl) {
      await removeJildPdfAttachment(j);
    }
  }
}
