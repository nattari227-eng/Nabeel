import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addStudyNote,
  clampPageNumber,
  computePaperStyleFilter,
  DEFAULT_READER_SETTINGS,
  filterMutashabihat,
  filterSurahs,
  getSectionHeaderInfo,
  parsePageInput,
  resolveSectionFromPopState,
  toggleBookmark,
  toggleFavorite,
  toggleHighlight,
} from './quranLogic';
import { ALL_PARAS, ALL_SURAHS, MUTASHABIHAT_INDEX, SIRAT_UL_JINAN_DATA } from '../data/quranMetadata';
import {
  getMushafPageImageUrl,
  getPdfPageMetadata,
  mapMushafToFallbackApiPage,
  MAX_MUSHAF_PAGE,
  MIN_MUSHAF_PAGE,
  mushafPageToPdfPage,
  pdfPageToMushafPage,
  resolveSurahAndParaForPage,
  TOTAL_PDF_PAGES,
} from '../data/quranPages';

test('PDF page mapping aligns printed Mushaf pages 2..611 to PDF pages 3..612', () => {
  assert.equal(TOTAL_PDF_PAGES, 619);
  assert.equal(DEFAULT_READER_SETTINGS.lastReadPage, 2);
  assert.equal(mushafPageToPdfPage(0), 1); // Cover
  assert.equal(mushafPageToPdfPage(1), 2); // Title Shamsa
  assert.equal(mushafPageToPdfPage(2), 3); // Al-Fatihah
  assert.equal(mushafPageToPdfPage(441), 442); // Ya-Sin
  assert.equal(mushafPageToPdfPage(611), 612); // Al-Falaq & An-Nas
  assert.equal(mushafPageToPdfPage(618), 619); // Closing Medallion
  assert.equal(pdfPageToMushafPage(3), 2);
  assert.equal(getMushafPageImageUrl(3), '/mushaf-pages/p-003.png');
  assert.equal(getMushafPageImageUrl(442), '/mushaf-pages/p-442.png');
  assert.equal(mapMushafToFallbackApiPage(2), 1);
  assert.equal(mapMushafToFallbackApiPage(611), 604);
});

test('Surah and Para indexes match exact attached Hafizi PDF start pages', () => {
  assert.equal(ALL_SURAHS.length, 114);
  assert.equal(ALL_PARAS.length, 30);

  assert.equal(ALL_SURAHS[0].startPage, 2); // Al-Fatihah
  assert.equal(ALL_SURAHS[1].startPage, 3); // Al-Baqarah
  assert.equal(ALL_SURAHS[2].startPage, 51); // Ali Imran
  assert.equal(ALL_SURAHS[35].startPage, 441); // Ya-Sin
  assert.equal(ALL_SURAHS[54].startPage, 532); // Ar-Rahman
  assert.equal(ALL_SURAHS[66].startPage, 563); // Al-Mulk
  assert.equal(ALL_SURAHS[113].startPage, 611); // An-Nas

  assert.equal(ALL_PARAS[0].startPage, 2); // Para 1
  assert.equal(ALL_PARAS[2].startPage, 43); // Para 3
  assert.equal(ALL_PARAS[29].startPage, 587); // Para 30
});

test('resolveSurahAndParaForPage resolves exact Surah and Para for PDF Mushaf pages', () => {
  const fatihah = resolveSurahAndParaForPage(2);
  assert.equal(fatihah.matchedSurah.number, 1);
  assert.equal(fatihah.matchedPara.number, 1);

  const kursi = resolveSurahAndParaForPage(43);
  assert.equal(kursi.matchedSurah.number, 2);
  assert.equal(kursi.matchedPara.number, 3);

  const yaseen = resolveSurahAndParaForPage(441);
  assert.equal(yaseen.matchedSurah.number, 36);
  assert.equal(yaseen.matchedPara.number, 22);
});

test('getPdfPageMetadata identifies Cover, Quran Pages, Rumooz-e-Auqaf, and PDF Index', () => {
  assert.equal(getPdfPageMetadata(0).isQuranTextPage, false);
  assert.equal(getPdfPageMetadata(0).sectionLabel, 'Front Cover');

  assert.equal(getPdfPageMetadata(2).isQuranTextPage, true);
  assert.equal(getPdfPageMetadata(2).pdfPage, 3);

  assert.equal(getPdfPageMetadata(612).isQuranTextPage, false);
  assert.equal(getPdfPageMetadata(612).sectionLabel, 'Rumooz-e-Auqaf');

  assert.equal(getPdfPageMetadata(616).sectionLabel, 'Printed Surah Index');
});

test('clampPageNumber and parsePageInput validate bounds cleanly', () => {
  assert.equal(clampPageNumber(-5, MIN_MUSHAF_PAGE, MAX_MUSHAF_PAGE), 0);
  assert.equal(clampPageNumber(999, MIN_MUSHAF_PAGE, MAX_MUSHAF_PAGE), 618);
  assert.equal(clampPageNumber(Number.NaN, MIN_MUSHAF_PAGE, MAX_MUSHAF_PAGE), 2);

  assert.equal(parsePageInput('', 618).valid, false);
  assert.equal(parsePageInput('0', 618).valid, false);
  assert.equal(parsePageInput('619', 618).valid, false);
  assert.deepEqual(parsePageInput('441', 618), { valid: true, page: 441 });
});

test('filterSurahs filters by query and Makki/Madani classification', () => {
  const yaseen = filterSurahs(ALL_SURAHS, 'Ya-Sin', 'All');
  assert.equal(yaseen.length, 1);
  assert.equal(yaseen[0].startPage, 441);

  const madaniOnly = filterSurahs(ALL_SURAHS, '', 'Madani');
  assert.ok(madaniOnly.every((s) => s.revelationType === 'Madani'));
  assert.ok(madaniOnly.length > 20);
});

test('filterMutashabihat and Sirat-ul-Jinan align to exact PDF pages', () => {
  const para1 = filterMutashabihat(MUTASHABIHAT_INDEX, '', 1);
  assert.ok(para1.length >= 2);
  assert.ok(para1.every((m) => m.paraNumber === 1));

  const kursi = filterMutashabihat(MUTASHABIHAT_INDEX, '43', 'all');
  assert.ok(kursi.some((m) => m.page === 43));

  assert.ok(SIRAT_UL_JINAN_DATA.some((s) => s.surahNumber === 36 && s.page === 441));
});

test('toggleBookmark, toggleFavorite, addStudyNote, and toggleHighlight manage Hifz tools', () => {
  const first = toggleBookmark([], {
    pageNumber: 441,
    surahNumber: 36,
    surahName: 'Ya-Sin',
    paraNumber: 22,
    label: 'Ya-Sin Opening',
  });
  assert.equal(first.added, true);
  assert.equal(first.next.length, 1);

  const second = toggleBookmark(first.next, {
    pageNumber: 441,
    surahNumber: 36,
    surahName: 'Ya-Sin',
    paraNumber: 22,
    label: 'Ya-Sin Opening',
  });
  assert.equal(second.added, false);
  assert.equal(second.next.length, 0);

  const fav1 = toggleFavorite([], {
    type: 'surah',
    surahNumber: 67,
    pageNumber: 563,
    titleArabic: 'الملك',
    titleUrdu: 'سورۃ الملک',
    subtitle: 'Para 29 · Page 563',
  });
  assert.equal(fav1.added, true);

  const notes = addStudyNote([], {
    pageNumber: 43,
    lineNumber: 8,
    surahName: 'Al-Baqarah',
    noteText: 'Revise Ayat-ul-Kursi waqf rules',
    highlightColor: 'gold',
  });
  assert.equal(notes.length, 1);

  const hl1 = toggleHighlight([], 43, 8, 'gold');
  assert.equal(hl1.length, 1);
  const hl2 = toggleHighlight(hl1, 43, 8, 'emerald');
  assert.equal(hl2[0].color, 'emerald');
  const hl3 = toggleHighlight(hl2, 43, 8, 'emerald');
  assert.equal(hl3.length, 0);
});

test('computePaperStyleFilter applies brightness and comfort sepia', () => {
  assert.equal(computePaperStyleFilter(100, false), 'brightness(1.00) sepia(0) contrast(1)');
  assert.equal(computePaperStyleFilter(75, true), 'brightness(0.75) sepia(0.24) contrast(0.96)');
});

test('resolveSectionFromPopState and getSectionHeaderInfo handle history navigation safely', () => {
  assert.equal(resolveSectionFromPopState(null), 'dashboard');
  assert.equal(resolveSectionFromPopState({}), 'dashboard');
  assert.equal(resolveSectionFromPopState({ section: 'unknown_route' }), 'dashboard');
  assert.equal(resolveSectionFromPopState({ section: 'surahs' }), 'surahs');
  assert.equal(resolveSectionFromPopState({ section: 'reader' }), 'reader');

  assert.deepEqual(getSectionHeaderInfo('surahs'), {
    titleEn: 'Surah Index',
    titleUr: 'سورتوں کی فہرست',
  });
  assert.deepEqual(getSectionHeaderInfo('sirat'), {
    titleEn: 'Sirat-ul-Jinan Tafsir',
    titleUr: 'صراط الجنان تفسیر',
  });
});

import {
  filterSiratVolumes,
  getJildForPara,
} from './quranLogic';
import { SIRAT_VOLUMES } from '../data/siratVolumes';
import { mergeSurahAyahsAndTafsir, stripTafsirHtml } from './siratApi';

test('SIRAT_VOLUMES covers all 10 Jilds, 30 Paras, 114 Surahs, and exact 6,236 Ayahs', () => {
  assert.equal(SIRAT_VOLUMES.length, 10);
  assert.equal(SIRAT_VOLUMES[0].paraStart, 1);
  assert.equal(SIRAT_VOLUMES[0].paraEnd, 3);
  assert.equal(SIRAT_VOLUMES[9].paraStart, 28);
  assert.equal(SIRAT_VOLUMES[9].paraEnd, 30);

  const ayahCountsBySurah = new Map<number, number>();
  let totalAyahsCovered = 0;

  for (const vol of SIRAT_VOLUMES) {
    assert.equal(vol.suggestedPdfFilename, `sirat-ul-jinan-jild-${vol.jildNumber}.pdf`);
    for (const span of vol.surahs) {
      assert.ok(span.startAyah >= 1);
      assert.ok(span.endAyah >= span.startAyah);
      const count = span.endAyah - span.startAyah + 1;
      totalAyahsCovered += count;
      ayahCountsBySurah.set(
        span.surahNumber,
        (ayahCountsBySurah.get(span.surahNumber) ?? 0) + count
      );
    }
  }

  assert.equal(ayahCountsBySurah.size, 114);
  assert.equal(totalAyahsCovered, 6236);

  for (const surah of ALL_SURAHS) {
    assert.equal(
      ayahCountsBySurah.get(surah.number),
      surah.versesCount,
      `Surah ${surah.number} (${surah.englishName}) ayah count mismatch`
    );
  }
});

test('getJildForPara and filterSiratVolumes work cleanly', () => {
  assert.equal(getJildForPara(1), 1);
  assert.equal(getJildForPara(3), 1);
  assert.equal(getJildForPara(4), 2);
  assert.equal(getJildForPara(22), 8);
  assert.equal(getJildForPara(30), 10);

  const mulkMatches = filterSiratVolumes(SIRAT_VOLUMES, ALL_SURAHS, 'Al-Mulk', 'all');
  assert.equal(mulkMatches.length, 1);
  assert.equal(mulkMatches[0].jildNumber, 10);

  const jild5 = filterSiratVolumes(SIRAT_VOLUMES, ALL_SURAHS, '', 5);
  assert.equal(jild5.length, 1);
  assert.equal(jild5[0].paraRangeLabelEn, 'Para 13 – Para 15');
});

test('mergeSurahAyahsAndTafsir combines Arabic, Urdu Tarjuma, and grouped Tafsir cleanly', () => {
  const merged = mergeSurahAyahsAndTafsir(
    [
      { number: 1, numberInSurah: 1, text: '\uFEFFبِسْمِ اللَّهِ', juz: 1, page: 1 },
      { number: 2, numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ', juz: 1, page: 1 },
      { number: 3, numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', juz: 1, page: 1 },
    ],
    [
      { number: 1, numberInSurah: 1, text: 'اللہ کے نام سے شروع' },
      { number: 2, numberInSurah: 2, text: 'سب خوبیاں اللہ کو' },
      { number: 3, numberInSurah: 3, text: 'بہت مہربان رحمت والا' },
    ],
    [
      { ayah: 1, text: '<p>بسم اللہ کی تفسیر</p>' },
      { ayah: 2, text: 'الحمد للہ کی تفصیلی تفسیر' },
    ]
  );

  assert.equal(merged.length, 3);
  assert.equal(merged[0].arabicText, 'بِسْمِ اللَّهِ');
  assert.equal(merged[0].urduTranslation, 'اللہ کے نام سے شروع');
  assert.equal(merged[0].urduTafsir, 'بسم اللہ کی تفسیر');
  assert.equal(merged[2].urduTafsir, 'الحمد للہ کی تفصیلی تفسیر');
  assert.ok(merged[2].tafsirNote?.includes('2'));
  assert.equal(stripTafsirHtml('<p>Hello<br/>World</p>'), 'Hello\nWorld');
});

import {
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_ADMIN_PIN,
  parseAndValidateAdminConfigJson,
  recordSecretLogoTap,
  validateNewPin,
  verifyAdminPin,
} from './adminConfig';

test('recordSecretLogoTap triggers on 5 taps within 3 seconds and ignores stale taps', () => {
  let taps: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const res = recordSecretLogoTap(taps, 1000 + i * 400, 5, 3000);
    assert.equal(res.triggered, false);
    taps = res.nextTaps;
  }
  const fifth = recordSecretLogoTap(taps, 2700, 5, 3000);
  assert.equal(fifth.triggered, true);
  assert.deepEqual(fifth.nextTaps, []);

  // Spaced-out taps (>3s gap) should prune older taps cleanly
  const slow1 = recordSecretLogoTap([1000, 1200, 1400, 1600], 5000, 5, 3000);
  assert.equal(slow1.triggered, false);
  assert.deepEqual(slow1.nextTaps, [5000]);
});

test('Admin PIN verification and change validation enforce default 7860 and rules', () => {
  assert.equal(DEFAULT_ADMIN_PIN, '7860');
  assert.equal(verifyAdminPin('7860', DEFAULT_ADMIN_CONFIG.adminPin), true);
  assert.equal(verifyAdminPin('1234', DEFAULT_ADMIN_CONFIG.adminPin), false);
  assert.equal(verifyAdminPin('', DEFAULT_ADMIN_CONFIG.adminPin), false);

  assert.equal(validateNewPin('123', '123').valid, false);
  assert.equal(validateNewPin('9988', '9987').valid, false);
  assert.equal(validateNewPin('99 88', '99 88').valid, false);
  assert.equal(validateNewPin('9988', '9988').valid, true);
});

test('parseAndValidateAdminConfigJson validates and sanitizes exported/imported JSON', () => {
  assert.equal(parseAndValidateAdminConfigJson('{bad json').valid, false);
  assert.equal(parseAndValidateAdminConfigJson('{"unrelated": true}').valid, false);

  const sampleExport = JSON.stringify({
    ...DEFAULT_ADMIN_CONFIG,
    adminPin: '4321',
    banner: {
      enabled: true,
      titleEn: 'Ramadan Update',
      messageEn: 'Daily Juz reading starts after Fajr.',
      messageUr: 'فجر کے بعد روزانہ دورِ قرآن کی تلاوت۔',
    },
    visibleHomeSections: {
      ...DEFAULT_ADMIN_CONFIG.visibleHomeSections,
      notes: false,
    },
    jildPdfUrls: {
      2: 'https://example.com/sirat-jild-2.pdf',
    },
    customMutashabihat: [
      {
        id: 'c1',
        paraNumber: 1,
        surahNumber: 2,
        surahName: 'Al-Baqarah',
        arabicPhrase: 'وَإِذْ قُلْنَا لِلْمَلَائِكَةِ',
        page: 6,
        line: 10,
        category: 'Tashabuh',
        hifzTipUrdu: 'سجدہ کا ذکر سات مقامات پر آیا ہے۔',
        similarSpots: [],
      },
    ],
  });

  const parsed = parseAndValidateAdminConfigJson(sampleExport);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.config?.adminPin, '4321');
  assert.equal(parsed.config?.banner.enabled, true);
  assert.equal(parsed.config?.visibleHomeSections.notes, false);
  assert.equal(parsed.config?.visibleHomeSections.surahs, true);
  assert.equal(parsed.config?.jildPdfUrls[2], 'https://example.com/sirat-jild-2.pdf');
  assert.equal(parsed.config?.customMutashabihat.length, 1);
});

import {
  STRICT_TAFSIR_HEADER_UR,
  STRICT_TAFSIR_SLUG,
  STRICT_TRANSLATION_ID,
  STRICT_TRANSLATION_LABEL_UR,
} from './siratApi';
import { getNaeemTafsirForSurah } from '../data/naeemTafsirNotes';

test('Strict Tarjuma & Tafsir enforces ONLY Kanz-ul-Imaan and Mufti Ahmad Yaar Khan Naeemi', () => {
  assert.equal(STRICT_TRANSLATION_ID, 'ur.kanzuliman');
  assert.equal(STRICT_TRANSLATION_LABEL_UR, 'ترجمہ: کنز الایمان (امام احمد رضا خان)');
  assert.equal(STRICT_TAFSIR_SLUG, 'ur-noor-ul-irfan-sirat-ul-jinan');
  assert.equal(
    STRICT_TAFSIR_HEADER_UR,
    'تفسیر: مفتی احمد یار خان نعیمی رحمۃ اللہ علیہ (نور العرفان) و صراط الجنان'
  );

  // Even if legacy JSON config attempts to specify removed translators/tafsirs, sanitizer locks strictly
  const legacyRes = parseAndValidateAdminConfigJson(
    JSON.stringify({
      defaultTranslationId: 'ur.qadri',
      defaultTafsirSlug: 'ur-tafseer-ibn-e-kaseer',
    })
  );
  assert.equal(legacyRes.valid, true);
  assert.equal(legacyRes.config?.defaultTranslationId, 'ur.kanzuliman');
  assert.equal(legacyRes.config?.defaultTafsirSlug, 'ur-noor-ul-irfan-sirat-ul-jinan');

  // Noor-ul-Irfan / Sirat-ul-Jinan notes resolve cleanly for every Ayah
  const fatihahNotes = getNaeemTafsirForSurah(1, [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(fatihahNotes.length, 7);
  assert.ok(fatihahNotes[0].text.includes('نور العرفان'));

  const baqarahNotes = getNaeemTafsirForSurah(2, [1, 255, 286], new Map([[1, 1], [255, 3], [286, 3]]));
  assert.equal(baqarahNotes.length, 3);
  assert.ok(baqarahNotes[1].text.includes('آیت الکرسی'));
  assert.ok(baqarahNotes[2].text.includes('نور العرفان'));
});


