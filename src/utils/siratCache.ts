import { CachedSurahTafsirPayload, JildPdfAttachmentMeta } from '../types/quran';

const DB_NAME = 'almushaf_sirat_db_v1';
const DB_VERSION = 1;
const STORE_SURAH_TAFSIR = 'surah_tafsir';
const STORE_JILD_PDFS = 'jild_pdfs';
const LS_TAFSIR_INDEX_KEY = 'almushaf_cached_surah_keys_v1';
const LS_PDF_META_PREFIX = 'almushaf_jild_pdf_meta_v1_';

interface StoredJildPdfRecord {
  meta: JildPdfAttachmentMeta;
  blob?: Blob;
}

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openSiratDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SURAH_TAFSIR)) {
        db.createObjectStore(STORE_SURAH_TAFSIR, { keyPath: 'cacheKey' });
      }
      if (!db.objectStoreNames.contains(STORE_JILD_PDFS)) {
        db.createObjectStore(STORE_JILD_PDFS, { keyPath: 'jildNumber' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

function readLocalSurahFallback(cacheKey: string): CachedSurahTafsirPayload | null {
  try {
    const raw = window.localStorage.getItem(`sirat_cache_${cacheKey}`);
    return raw ? (JSON.parse(raw) as CachedSurahTafsirPayload) : null;
  } catch {
    return null;
  }
}

function writeLocalSurahFallback(payload: CachedSurahTafsirPayload): void {
  try {
    const raw = window.localStorage.getItem(LS_TAFSIR_INDEX_KEY);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(payload.cacheKey)) {
      list.push(payload.cacheKey);
      window.localStorage.setItem(LS_TAFSIR_INDEX_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore localStorage index errors
  }
}

export async function getCachedSurahTafsir(
  cacheKey: string
): Promise<CachedSurahTafsirPayload | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await openSiratDb();
    return await new Promise<CachedSurahTafsirPayload | null>((resolve) => {
      const tx = db.transaction(STORE_SURAH_TAFSIR, 'readonly');
      const store = tx.objectStore(STORE_SURAH_TAFSIR);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        const res = (req.result as CachedSurahTafsirPayload | undefined) ?? null;
        if (
          res &&
          res.translationId === 'ur.kanzuliman' &&
          res.tafsirSlug === 'ur-noor-ul-irfan-sirat-ul-jinan'
        ) {
          resolve(res);
          return;
        }
        resolve(null);
      };
      req.onerror = () => resolve(readLocalSurahFallback(cacheKey));
    });
  } catch {
    const fallback = readLocalSurahFallback(cacheKey);
    if (
      fallback &&
      fallback.translationId === 'ur.kanzuliman' &&
      fallback.tafsirSlug === 'ur-noor-ul-irfan-sirat-ul-jinan'
    ) {
      return fallback;
    }
    return null;
  }
}

export async function saveCachedSurahTafsir(payload: CachedSurahTafsirPayload): Promise<void> {
  if (typeof window === 'undefined') return;
  writeLocalSurahFallback(payload);
  try {
    const db = await openSiratDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_SURAH_TAFSIR, 'readwrite');
      const store = tx.objectStore(STORE_SURAH_TAFSIR);
      store.put(payload);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    try {
      window.localStorage.setItem(`sirat_cache_${payload.cacheKey}`, JSON.stringify(payload));
    } catch {
      // Quota exceeded fallback: keep in-memory cache working cleanly
    }
  }
}

export async function listCachedSurahNumbers(): Promise<number[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await openSiratDb();
    const keys = await new Promise<string[]>((resolve) => {
      const tx = db.transaction(STORE_SURAH_TAFSIR, 'readonly');
      const store = tx.objectStore(STORE_SURAH_TAFSIR);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) ?? []);
      req.onerror = () => resolve([]);
    });
    const nums = new Set<number>();
    for (const k of keys) {
      const parts = String(k).split(':');
      if (parts[1] !== 'ur.kanzuliman' || parts[2] !== 'ur-noor-ul-irfan-sirat-ul-jinan') {
        continue;
      }
      const n = Number(parts[0]);
      if (Number.isInteger(n) && n >= 1 && n <= 114) nums.add(n);
    }
    return Array.from(nums).sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export async function saveJildPdfFile(
  jildNumber: number,
  file: File
): Promise<JildPdfAttachmentMeta> {
  const meta: JildPdfAttachmentMeta = {
    jildNumber,
    sourceType: 'file',
    fileName: file.name,
    fileSize: file.size,
    lastPdfPage: 1,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return meta;

  window.localStorage.setItem(`${LS_PDF_META_PREFIX}${jildNumber}`, JSON.stringify(meta));

  try {
    const db = await openSiratDb();
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: 'application/pdf' });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_JILD_PDFS);
      store.put({ jildNumber, meta, blob });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to store PDF'));
    });
  } catch {
    // Even if IndexedDB fails, metadata stays for current session via returned object
  }
  return meta;
}

export async function saveJildPdfUrl(
  jildNumber: number,
  url: string
): Promise<JildPdfAttachmentMeta> {
  const trimmed = url.trim();
  const inferredName = trimmed.split('/').pop()?.split('?')[0] || `sirat-ul-jinan-jild-${jildNumber}.pdf`;
  const meta: JildPdfAttachmentMeta = {
    jildNumber,
    sourceType: 'url',
    fileName: inferredName,
    customUrl: trimmed,
    lastPdfPage: 1,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return meta;
  window.localStorage.setItem(`${LS_PDF_META_PREFIX}${jildNumber}`, JSON.stringify(meta));

  try {
    const db = await openSiratDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_JILD_PDFS);
      store.put({ jildNumber, meta });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // localStorage holds URL metadata cleanly
  }
  return meta;
}

export async function updateJildPdfPage(jildNumber: number, page: number): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(`${LS_PDF_META_PREFIX}${jildNumber}`);
    if (raw) {
      const parsed = JSON.parse(raw) as JildPdfAttachmentMeta;
      parsed.lastPdfPage = page;
      window.localStorage.setItem(`${LS_PDF_META_PREFIX}${jildNumber}`, JSON.stringify(parsed));
    }
    const db = await openSiratDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_JILD_PDFS);
      const getReq = store.get(jildNumber);
      getReq.onsuccess = () => {
        const rec = getReq.result as (StoredJildPdfRecord & { jildNumber: number }) | undefined;
        if (rec) {
          rec.meta.lastPdfPage = page;
          store.put(rec);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore page persistence failures
  }
}

export async function getJildPdfRecord(
  jildNumber: number
): Promise<{ meta: JildPdfAttachmentMeta; blob?: Blob } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const db = await openSiratDb();
    const record = await new Promise<(StoredJildPdfRecord & { jildNumber: number }) | null>((resolve) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readonly');
      const store = tx.objectStore(STORE_JILD_PDFS);
      const req = store.get(jildNumber);
      req.onsuccess = () =>
        resolve((req.result as (StoredJildPdfRecord & { jildNumber: number }) | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
    if (record) {
      return { meta: record.meta, blob: record.blob };
    }
  } catch {
    // Fall back to localStorage URL metadata
  }
  try {
    const raw = window.localStorage.getItem(`${LS_PDF_META_PREFIX}${jildNumber}`);
    if (!raw) return null;
    const meta = JSON.parse(raw) as JildPdfAttachmentMeta;
    if (meta.sourceType === 'url' && meta.customUrl) {
      return { meta };
    }
  } catch {
    return null;
  }
  return null;
}

export async function listAllJildPdfAttachments(): Promise<Record<number, JildPdfAttachmentMeta>> {
  const map: Record<number, JildPdfAttachmentMeta> = {};
  if (typeof window === 'undefined') return map;

  for (let j = 1; j <= 10; j += 1) {
    try {
      const raw = window.localStorage.getItem(`${LS_PDF_META_PREFIX}${j}`);
      if (raw) {
        map[j] = JSON.parse(raw) as JildPdfAttachmentMeta;
      }
    } catch {
      // Ignore corrupt entry
    }
  }

  try {
    const db = await openSiratDb();
    const all = await new Promise<(StoredJildPdfRecord & { jildNumber: number })[]>((resolve) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readonly');
      const store = tx.objectStore(STORE_JILD_PDFS);
      const req = store.getAll();
      req.onsuccess = () =>
        resolve((req.result as (StoredJildPdfRecord & { jildNumber: number })[]) ?? []);
      req.onerror = () => resolve([]);
    });
    for (const rec of all) {
      if (rec?.meta) {
        map[rec.jildNumber] = rec.meta;
      }
    }
  } catch {
    // Ignore
  }
  return map;
}

export async function removeJildPdfAttachment(jildNumber: number): Promise<void> {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(`${LS_PDF_META_PREFIX}${jildNumber}`);
  try {
    const db = await openSiratDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_JILD_PDFS, 'readwrite');
      const store = tx.objectStore(STORE_JILD_PDFS);
      store.delete(jildNumber);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore
  }
}
