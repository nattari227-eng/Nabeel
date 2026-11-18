import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Home, Menu } from 'lucide-react';
import {
  AdminAppConfig,
  AppSection,
  Bookmark,
  FavoriteItem,
  LineHighlight,
  ReaderSettings,
  StudyNote,
} from './types/quran';
import {
  DEFAULT_READER_SETTINGS,
  addStudyNote,
  clampPageNumber,
  getSectionHeaderInfo,
  resolveSectionFromPopState,
  toggleBookmark,
  toggleFavorite,
  toggleHighlight,
} from './utils/quranLogic';
import {
  loadAdminConfig,
  recordSecretLogoTap,
  saveAdminConfig,
} from './utils/adminConfig';
import {
  MAX_MUSHAF_PAGE,
  MIN_MUSHAF_PAGE,
  getPdfPageMetadata,
} from './data/quranPages';
import { SplashScreen } from './components/SplashScreen';
import { NavigationDrawer } from './components/NavigationDrawer';
import { DashboardView } from './components/DashboardView';
import { QuranReader } from './components/QuranReader';
import { SurahIndexView } from './components/SurahIndexView';
import { ParaIndexView } from './components/ParaIndexView';
import { MutashabihatView } from './components/MutashabihatView';
import { SiratUlJinanView } from './components/SiratUlJinanView';
import { SavedItemsView } from './components/SavedItemsView';
import { AndroidSourceView } from './components/AndroidSourceView';
import { SettingsAboutView } from './components/SettingsAboutView';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminControlPanelModal } from './components/AdminControlPanelModal';
import { JildPdfViewerModal } from './components/JildPdfViewerModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEYS = {
  settings: 'almushaf_settings_v2',
  bookmarks: 'almushaf_bookmarks_v1',
  favorites: 'almushaf_favorites_v1',
  notes: 'almushaf_notes_v1',
  highlights: 'almushaf_highlights_v1',
};

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const skipSplash =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [section, setSection] = useState<AppSection>('dashboard');

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const stored = loadStored<Partial<ReaderSettings>>(STORAGE_KEYS.settings, {});
    return {
      ...DEFAULT_READER_SETTINGS,
      ...stored,
      lastReadPage: clampPageNumber(
        stored.lastReadPage ?? DEFAULT_READER_SETTINGS.lastReadPage,
        MIN_MUSHAF_PAGE,
        MAX_MUSHAF_PAGE
      ),
    };
  });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() =>
    loadStored(STORAGE_KEYS.bookmarks, [])
  );
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    loadStored(STORAGE_KEYS.favorites, [])
  );
  const [notes, setNotes] = useState<StudyNote[]>(() => loadStored(STORAGE_KEYS.notes, []));
  const [highlights, setHighlights] = useState<LineHighlight[]>(() =>
    loadStored(STORAGE_KEYS.highlights, [])
  );

  const [focusLine, setFocusLine] = useState<number | null>(null);
  const [siratParaFilter, setSiratParaFilter] = useState<number | 'all'>('all');

  // Hidden Owner Admin Panel State (no visible regular-user UI)
  const [adminConfig, setAdminConfig] = useState<AdminAppConfig>(() => loadAdminConfig());
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [pdfSyncVersion, setPdfSyncVersion] = useState(0);
  const [customQuranPdfOpen, setCustomQuranPdfOpen] = useState(false);
  const secretTapRef = useRef<number[]>([]);

  useEffect(() => {
    saveAdminConfig(adminConfig);
  }, [adminConfig]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.highlights, JSON.stringify(highlights));
  }, [highlights]);

  // Sync navigation views with browser history for mobile back gesture / hardware back button
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentStateSection = resolveSectionFromPopState(window.history.state);
    if (!window.history.state || typeof window.history.state !== 'object' || !('section' in window.history.state)) {
      window.history.replaceState({ section: currentStateSection }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const targetSection = resolveSectionFromPopState(event.state) as AppSection;
      setDrawerOpen(false);
      setSection(targetSection);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToSection = (nextSection: AppSection) => {
    if (nextSection === 'sirat') {
      setSiratParaFilter('all');
    }
    setSection((prev) => {
      if (prev === nextSection) return prev;
      if (typeof window !== 'undefined') {
        if (nextSection === 'dashboard') {
          window.history.replaceState({ section: 'dashboard' }, '');
        } else {
          window.history.pushState({ section: nextSection }, '');
        }
      }
      return nextSection;
    });
  };

  const updateSettings = (patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      next.lastReadPage = clampPageNumber(next.lastReadPage, MIN_MUSHAF_PAGE, MAX_MUSHAF_PAGE);
      return next;
    });
  };

  const openReaderAtPage = (page: number, line?: number) => {
    const safePage = clampPageNumber(page, MIN_MUSHAF_PAGE, MAX_MUSHAF_PAGE);
    const meta = getPdfPageMetadata(safePage);
    setFocusLine(line ?? null);
    setSettings((prev) => ({
      ...prev,
      lastReadPage: safePage,
      lastReadSurah: meta.isQuranTextPage
        ? meta.surahUrdu
        : meta.sectionLabel,
      lastReadPara: meta.paraNumber,
      lastReadTimestamp: new Date().toISOString(),
    }));
    navigateToSection('reader');
  };

  const handleToggleBookmark = (
    pageNumber: number,
    surahNumber: number,
    surahName: string,
    paraNumber: number
  ) => {
    setBookmarks((prev) =>
      toggleBookmark(prev, {
        pageNumber,
        surahNumber,
        surahName,
        paraNumber,
        label: pageNumber === 0 ? 'Front Cover' : `15-Line Page ${pageNumber}`,
      }).next
    );
  };

  const handleToggleFavorite = (item: Omit<FavoriteItem, 'id' | 'createdAt'>) => {
    setFavorites((prev) => toggleFavorite(prev, item).next);
  };

  const handleToggleHighlight = (
    pageNumber: number,
    lineNumber: number,
    color: 'gold' | 'emerald' | 'crimson'
  ) => {
    setHighlights((prev) => toggleHighlight(prev, pageNumber, lineNumber, color));
  };

  const handleSaveNote = (
    pageNumber: number,
    lineNumber: number,
    surahName: string,
    noteText: string,
    highlightColor: 'gold' | 'emerald' | 'crimson'
  ) => {
    setNotes((prev) =>
      addStudyNote(prev, {
        pageNumber,
        lineNumber,
        surahName,
        noteText,
        highlightColor,
      })
    );
  };

  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }

  const isReader = section === 'reader';
  const isSubScreen = section !== 'dashboard' && !isReader;
  const headerInfo = getSectionHeaderInfo(section);

  return (
    <div className={`bg-[#FBF9F5] text-[#14171A] flex flex-col ${isReader ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      {/* Clean Sticky Top Navigation Bar — Home bar on Dashboard, Back-to-Home bar on Sub-Screens */}
      {!isReader && (
        <header className="sticky top-0 z-30 border-b border-[#E2DFD7] bg-white/95 backdrop-blur-md shadow-[0_1px_12px_rgba(20,23,26,0.04)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            {/* Zone 1: Menu (on Home) or Prominent Back Arrow (←) / Home (on Sub-Screens) */}
            <div className="flex items-center gap-3 min-w-0">
              {isSubScreen ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigateToSection('dashboard')}
                    aria-label="Back to Home"
                    data-testid="subscreen-back-button"
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs font-semibold text-[#14171A] hover:border-[#D4AF37] hover:text-[#A87C14] shrink-0 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4 text-[#A87C14]" aria-hidden="true" />
                    <span>Home</span>
                  </button>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-semibold text-[#14171A] truncate">
                      {headerInfo.titleEn}
                    </div>
                    <div className="font-urdu text-xs text-[#A87C14] leading-tight truncate" dir="rtl">
                      {headerInfo.titleUr}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open navigation menu"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#A87C14] hover:border-[#D4AF37] cursor-pointer shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    data-testid="header-brand-trigger"
                    onClick={() => {
                      const res = recordSecretLogoTap(secretTapRef.current, Date.now(), 5, 3000);
                      secretTapRef.current = res.nextTaps;
                      if (res.triggered) {
                        setAdminPinModalOpen(true);
                        return;
                      }
                      navigateToSection('dashboard');
                    }}
                    className="font-display text-lg sm:text-xl font-semibold tracking-wide text-[#14171A] whitespace-nowrap shrink-0 cursor-pointer select-none"
                  >
                    Al-Mushaf
                  </button>
                </>
              )}
            </div>

            {/* Zone 2: Concise Single-Line Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#575D66]">
              {(
                [
                  ['surahs', 'Surahs', adminConfig.visibleHomeSections.surahs],
                  ['paras', 'Paras', adminConfig.visibleHomeSections.paras],
                  ['mutashabihat', 'Mutashabihat', adminConfig.visibleHomeSections.mutashabihat],
                  ['sirat', 'Sirat-ul-Jinan', adminConfig.visibleHomeSections.sirat],
                  ['android_code', 'Android Code', true],
                ] as const
              )
                .filter(([, , visible]) => visible)
                .map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateToSection(id)}
                    className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#A87C14] cursor-pointer ${
                      section === id ? 'font-semibold text-[#A87C14] underline underline-offset-8 decoration-[#D4AF37]' : ''
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </nav>

            {/* Zone 3: Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isSubScreen && (
                <button
                  type="button"
                  onClick={() => navigateToSection('dashboard')}
                  aria-label="Go to Home screen"
                  className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-[#D4AF37] hover:text-[#A87C14] cursor-pointer"
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <PWAInstallButton variant="header" />
              <button
                type="button"
                onClick={() => openReaderAtPage(settings.lastReadPage)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-105 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Read Quran</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Region */}
      <main
        className={
          isReader
            ? 'h-[100dvh] w-full overflow-hidden'
            : section === 'dashboard'
              ? 'flex-1'
              : 'flex-1 pb-10'
        }
      >
        {section === 'dashboard' && (
          <DashboardView
            settings={settings}
            bookmarks={bookmarks}
            notes={notes}
            adminConfig={adminConfig}
            onContinueReading={() => openReaderAtPage(settings.lastReadPage)}
            onJumpToPage={(page) => openReaderAtPage(page)}
            onNavigate={(nextSection) => navigateToSection(nextSection)}
            onOpenCustomQuranPdf={() => setCustomQuranPdfOpen(true)}
          />
        )}

        {section === 'reader' && (
          <QuranReader
            currentPage={settings.lastReadPage}
            settings={settings}
            bookmarks={bookmarks}
            favorites={favorites}
            highlights={highlights}
            notes={notes}
            focusLine={focusLine}
            customQuranPdfUrl={adminConfig.quranPdfUrl}
            onExit={() => navigateToSection('dashboard')}
            onPageChange={(page) => openReaderAtPage(page)}
            onUpdateSettings={updateSettings}
            onToggleBookmark={handleToggleBookmark}
            onToggleFavorite={handleToggleFavorite}
            onToggleHighlight={handleToggleHighlight}
            onSaveNote={handleSaveNote}
            onOpenSiratForPara={(para) => {
              navigateToSection('sirat');
              setSiratParaFilter(para);
            }}
            onOpenCustomQuranPdf={() => setCustomQuranPdfOpen(true)}
          />
        )}

        {section === 'surahs' && (
          <SurahIndexView
            favorites={favorites}
            onOpenSurahPage={(page) => openReaderAtPage(page)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {section === 'paras' && (
          <ParaIndexView
            onOpenParaPage={(page) => openReaderAtPage(page)}
          />
        )}

        {section === 'mutashabihat' && (
          <MutashabihatView
            customEntries={adminConfig.customMutashabihat}
            onJumpToLocation={(page, line) => openReaderAtPage(page, line)}
          />
        )}

        {section === 'sirat' && (
          <SiratUlJinanView
            initialParaFilter={siratParaFilter}
            pdfSyncVersion={pdfSyncVersion}
            onOpenInMushaf={(page) => openReaderAtPage(page)}
          />
        )}

        {(section === 'bookmarks' || section === 'favorites' || section === 'notes') && (
          <SavedItemsView
            mode={section}
            bookmarks={bookmarks}
            favorites={favorites}
            notes={notes}
            onJumpToPage={(page, line) => openReaderAtPage(page, line)}
            onRemoveBookmark={(page) =>
              setBookmarks((prev) => prev.filter((b) => b.pageNumber !== page))
            }
            onRemoveFavorite={(id) =>
              setFavorites((prev) => prev.filter((f) => f.id !== id))
            }
            onRemoveNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
          />
        )}

        {section === 'android_code' && <AndroidSourceView />}

        {(section === 'settings' || section === 'about') && (
          <SettingsAboutView
            mode={section}
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenAndroidCode={() => navigateToSection('android_code')}
          />
        )}
      </main>

      <NavigationDrawer
        open={drawerOpen}
        activeSection={section}
        bookmarksCount={bookmarks.length}
        favoritesCount={favorites.length}
        notesCount={notes.length}
        visibleHomeSections={adminConfig.visibleHomeSections}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(nextSection) => {
          if (nextSection === 'reader') {
            openReaderAtPage(settings.lastReadPage);
          } else {
            navigateToSection(nextSection);
          }
        }}
      />

      <AdminPinModal
        open={adminPinModalOpen}
        storedPin={adminConfig.adminPin}
        onSuccess={() => {
          setAdminPinModalOpen(false);
          setAdminPanelOpen(true);
        }}
        onClose={() => setAdminPinModalOpen(false)}
      />

      {adminPanelOpen && (
        <AdminControlPanelModal
          open={adminPanelOpen}
          config={adminConfig}
          onUpdateConfig={(next) => setAdminConfig(next)}
          onPdfLinksSynced={() => setPdfSyncVersion((v) => v + 1)}
          onClose={() => setAdminPanelOpen(false)}
        />
      )}

      {customQuranPdfOpen && adminConfig.quranPdfUrl && (
        <JildPdfViewerModal
          customPdf={{
            titleEn: 'Custom Quran Mushaf PDF',
            subtitleEn: adminConfig.quranPdfUrl,
            url: adminConfig.quranPdfUrl,
          }}
          onClose={() => setCustomQuranPdfOpen(false)}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
