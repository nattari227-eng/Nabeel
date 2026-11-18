import { useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  KeyRound,
  Link2,
  Megaphone,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Shield,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AdminAppConfig,
  FeaturedDailyAyah,
  MutashabihEntry,
} from '../types/quran';
import { ALL_SURAHS } from '../data/quranMetadata';
import { SIRAT_VOLUMES } from '../data/siratVolumes';
import {
  STRICT_TAFSIR_HEADER_UR,
  STRICT_TRANSLATION_LABEL_UR,
} from '../utils/siratApi';
import {
  DEFAULT_ADMIN_CONFIG,
  HOME_SECTION_LABELS,
  parseAndValidateAdminConfigJson,
  syncJildPdfUrlsWithCache,
  validateNewPin,
  verifyAdminPin,
} from '../utils/adminConfig';

interface AdminControlPanelModalProps {
  open: boolean;
  config: AdminAppConfig;
  onUpdateConfig: (next: AdminAppConfig) => void;
  onPdfLinksSynced: () => void;
  onClose: () => void;
}

type AdminTab = 'banner' | 'links' | 'content' | 'security';

export function AdminControlPanelModal({
  open,
  config,
  onUpdateConfig,
  onPdfLinksSynced,
  onClose,
}: AdminControlPanelModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('banner');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Banner draft
  const [bannerTitleEn, setBannerTitleEn] = useState(config.banner.titleEn);
  const [bannerMsgEn, setBannerMsgEn] = useState(config.banner.messageEn);
  const [bannerMsgUr, setBannerMsgUr] = useState(config.banner.messageUr);

  // PDF URLs draft
  const [quranUrlDraft, setQuranUrlDraft] = useState(config.quranPdfUrl);
  const [jildUrlDrafts, setJildUrlDrafts] = useState<Record<number, string>>(
    () => ({ ...config.jildPdfUrls })
  );

  // Custom Mutashabihat draft
  const [mutPara, setMutPara] = useState(1);
  const [mutSurahNo, setMutSurahNo] = useState(2);
  const [mutPage, setMutPage] = useState(6);
  const [mutLine, setMutLine] = useState(10);
  const [mutCategory, setMutCategory] =
    useState<MutashabihEntry['category']>('Tashabuh');
  const [mutArabic, setMutArabic] = useState('');
  const [mutTipUr, setMutTipUr] = useState('');
  const [pairSurahNo, setPairSurahNo] = useState(7);
  const [pairAyahNo, setPairAyahNo] = useState(11);
  const [pairPage, setPairPage] = useState(151);
  const [pairLine, setPairLine] = useState(9);
  const [pairDiffUr, setPairDiffUr] = useState('');

  // Featured Daily Ayah draft
  const [ayahSurahName, setAyahSurahName] = useState('Al-Inshirah');
  const [ayahRef, setAyahRef] = useState('94:5-6');
  const [ayahArabic, setAyahArabic] = useState('');
  const [ayahUrdu, setAyahUrdu] = useState('');
  const [ayahNoteEn, setAyahNoteEn] = useState('');

  // PIN change draft
  const [currentPinDraft, setCurrentPinDraft] = useState('');
  const [newPinDraft, setNewPinDraft] = useState('');
  const [confirmPinDraft, setConfirmPinDraft] = useState('');

  // Reset confirmation inline
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const importInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const commitConfig = (partial: Partial<AdminAppConfig>, msg?: string) => {
    const next: AdminAppConfig = {
      ...config,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    onUpdateConfig(next);
    if (msg) {
      setStatusMessage({ type: 'success', text: msg });
    }
  };

  const handleToggleBanner = () => {
    commitConfig(
      {
        banner: {
          enabled: !config.banner.enabled,
          titleEn: bannerTitleEn.trim() || config.banner.titleEn,
          messageEn: bannerMsgEn.trim() || config.banner.messageEn,
          messageUr: bannerMsgUr.trim() || config.banner.messageUr,
        },
      },
      !config.banner.enabled
        ? 'Home announcement banner enabled.'
        : 'Home announcement banner turned off.'
    );
  };

  const handleSaveBannerText = (e: React.FormEvent) => {
    e.preventDefault();
    commitConfig(
      {
        banner: {
          enabled: config.banner.enabled,
          titleEn: bannerTitleEn.trim(),
          messageEn: bannerMsgEn.trim(),
          messageUr: bannerMsgUr.trim(),
        },
      },
      'Home announcement banner content saved.'
    );
  };

  const handleToggleSection = (key: keyof AdminAppConfig['visibleHomeSections']) => {
    commitConfig(
      {
        visibleHomeSections: {
          ...config.visibleHomeSections,
          [key]: !config.visibleHomeSections[key],
        },
      },
      `Updated visibility for "${HOME_SECTION_LABELS.find((s) => s.key === key)?.labelEn ?? key}".`
    );
  };

  const handleSaveLinksAndDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedJildUrls: Record<number, string> = {};
    for (let j = 1; j <= 10; j += 1) {
      const val = (jildUrlDrafts[j] ?? '').trim();
      if (val) cleanedJildUrls[j] = val;
    }

    await syncJildPdfUrlsWithCache(cleanedJildUrls, config.jildPdfUrls);
    onPdfLinksSynced();

    commitConfig(
      {
        quranPdfUrl: quranUrlDraft.trim(),
        jildPdfUrls: cleanedJildUrls,
      },
      'Quran & Sirat-ul-Jinan PDF links updated.'
    );
  };

  const handleAddCustomMutashabih = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutArabic.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter the Arabic phrase for Mutashabihat.' });
      return;
    }
    const primarySurah = ALL_SURAHS[mutSurahNo - 1] ?? ALL_SURAHS[1];
    const pairedSurah = ALL_SURAHS[pairSurahNo - 1] ?? ALL_SURAHS[6];

    const newEntry: MutashabihEntry = {
      id: `custom-mut-${Date.now()}`,
      paraNumber: mutPara,
      surahNumber: primarySurah.number,
      surahName: primarySurah.englishName,
      arabicPhrase: mutArabic.trim(),
      page: mutPage,
      line: mutLine,
      category: mutCategory,
      hifzTipUrdu: mutTipUr.trim() || 'ایڈمن کی طرف سے شامل کردہ متشابہ آیت',
      similarSpots: pairDiffUr.trim()
        ? [
            {
              surahName: pairedSurah.englishName,
              surahNumber: pairedSurah.number,
              ayahNumber: pairAyahNo,
              paraNumber: pairedSurah.paraNumber,
              page: pairPage,
              line: pairLine,
              differenceNoteUrdu: pairDiffUr.trim(),
            },
          ]
        : [],
    };

    commitConfig(
      {
        customMutashabihat: [newEntry, ...config.customMutashabihat],
      },
      `Added custom Mutashabih entry for ${primarySurah.englishName}.`
    );
    setMutArabic('');
    setMutTipUr('');
    setPairDiffUr('');
  };

  const handleRemoveCustomMutashabih = (id: string) => {
    commitConfig(
      {
        customMutashabihat: config.customMutashabihat.filter((m) => m.id !== id),
      },
      'Removed custom Mutashabih entry.'
    );
  };

  const handleAddFeaturedAyah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ayahArabic.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter Arabic verse text for the Featured Ayah.' });
      return;
    }
    const item: FeaturedDailyAyah = {
      id: `ayah-${Date.now()}`,
      surahName: ayahSurahName.trim() || 'Al-Quran',
      ayahRef: ayahRef.trim() || '1:1',
      arabicText: ayahArabic.trim(),
      urduTranslation: ayahUrdu.trim(),
      englishNote: ayahNoteEn.trim(),
      createdAt: new Date().toISOString(),
    };

    commitConfig(
      {
        featuredAyahs: [item, ...config.featuredAyahs],
      },
      `Published Featured Daily Ayah (${item.surahName} ${item.ayahRef}).`
    );
    setAyahArabic('');
    setAyahUrdu('');
    setAyahNoteEn('');
  };

  const handleRemoveFeaturedAyah = (id: string) => {
    commitConfig(
      {
        featuredAyahs: config.featuredAyahs.filter((a) => a.id !== id),
      },
      'Removed Featured Daily Ayah.'
    );
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPin(currentPinDraft, config.adminPin)) {
      setStatusMessage({ type: 'error', text: 'Current Admin PIN is incorrect.' });
      return;
    }
    const check = validateNewPin(newPinDraft, confirmPinDraft);
    if (!check.valid) {
      setStatusMessage({ type: 'error', text: check.error ?? 'Invalid new PIN.' });
      return;
    }

    commitConfig({ adminPin: newPinDraft.trim() }, 'Admin PIN updated successfully.');
    setCurrentPinDraft('');
    setNewPinDraft('');
    setConfirmPinDraft('');
  };

  const handleExportJson = () => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `almushaf-admin-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Exported app configuration JSON file.' });
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const res = parseAndValidateAdminConfigJson(text);
      if (!res.valid || !res.config) {
        setStatusMessage({ type: 'error', text: res.error ?? 'Invalid config JSON.' });
        return;
      }
      await syncJildPdfUrlsWithCache(res.config.jildPdfUrls, config.jildPdfUrls);
      onPdfLinksSynced();
      onUpdateConfig(res.config);
      setBannerTitleEn(res.config.banner.titleEn);
      setBannerMsgEn(res.config.banner.messageEn);
      setBannerMsgUr(res.config.banner.messageUr);
      setQuranUrlDraft(res.config.quranPdfUrl);
      setJildUrlDrafts({ ...res.config.jildPdfUrls });
      setStatusMessage({ type: 'success', text: 'Imported configuration JSON cleanly.' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to read selected JSON file.' });
    }
  };

  const handleResetToDefault = async () => {
    await syncJildPdfUrlsWithCache({}, config.jildPdfUrls);
    onPdfLinksSynced();
    const fresh: AdminAppConfig = {
      ...DEFAULT_ADMIN_CONFIG,
      banner: { ...DEFAULT_ADMIN_CONFIG.banner },
      visibleHomeSections: { ...DEFAULT_ADMIN_CONFIG.visibleHomeSections },
      jildPdfUrls: {},
      customMutashabihat: [],
      featuredAyahs: [],
      updatedAt: new Date().toISOString(),
    };
    onUpdateConfig(fresh);
    setBannerTitleEn(fresh.banner.titleEn);
    setBannerMsgEn(fresh.banner.messageEn);
    setBannerMsgUr(fresh.banner.messageUr);
    setQuranUrlDraft('');
    setJildUrlDrafts({});
    setConfirmResetOpen(false);
    setStatusMessage({
      type: 'success',
      text: 'Reset all settings, sections, custom entries, and PIN to default.',
    });
  };

  const tabs: { id: AdminTab; label: string; icon: typeof Megaphone }[] = [
    { id: 'banner', label: 'Banner & Home', icon: Megaphone },
    { id: 'links', label: 'PDF & Tafsir', icon: Link2 },
    { id: 'content', label: 'Mutashabihat & Ayahs', icon: Sparkles },
    { id: 'security', label: 'PIN & Backup', icon: Shield },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#FBF9F5] text-[#14171A] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Owner Admin Control Panel"
      data-testid="admin-control-panel"
    >
      {/* Top Sticky Admin Bar */}
      <header className="shrink-0 border-b border-[#D4AF37]/40 bg-[#14171A] text-white px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              data-testid="exit-admin-button"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D4AF37]/60 bg-white/5 px-3 text-xs font-semibold text-[#F6DF90] hover:bg-[#D4AF37] hover:text-[#14171A] transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Exit Admin</span>
            </button>

            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-semibold text-[#F6DF90] truncate">
                Al-Mushaf Owner Control Panel
              </h1>
              <p className="text-[11px] text-slate-300 truncate">
                Live Home Banner · Section Toggles · PDF Links · Content · JSON Backup
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B6891B] px-3.5 text-xs font-bold text-[#14171A] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export JSON</span>
          </button>
        </div>
      </header>

      {/* Admin Tab Switcher */}
      <div className="shrink-0 border-b border-[#E2DFD7] bg-white px-4 py-2.5">
        <div
          className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto"
          role="tablist"
          aria-label="Admin control sections"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`admin-tab-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatusMessage(null);
                }}
                className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'border-[#C59B27] bg-gradient-to-r from-[#C89D28] to-[#B6891B] text-white shadow-xs'
                    : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-[#D4AF37] hover:text-[#14171A]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Admin Workspace */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {statusMessage && (
            <div
              role="status"
              data-testid="admin-status-banner"
              className={`rounded-xl border px-4 py-3 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* TAB 1: Live Home Notice Banner & Section Visibility Toggles */}
          {activeTab === 'banner' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Announcement Banner Card */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-[#E2DFD7] pb-3.5">
                  <div>
                    <h2 className="text-sm font-semibold text-[#14171A]">
                      Live Home Announcement Banner
                    </h2>
                    <p className="text-xs text-[#575D66]">
                      Royal gold notice displayed at the top of the Home Screen
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={config.banner.enabled}
                    aria-label="Toggle Home Announcement Banner"
                    data-testid="admin-banner-toggle"
                    onClick={handleToggleBanner}
                    className={`min-h-[38px] rounded-xl px-4 text-xs font-semibold cursor-pointer transition-colors ${
                      config.banner.enabled
                        ? 'bg-[#D4AF37] text-white'
                        : 'border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66]'
                    }`}
                  >
                    {config.banner.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <form onSubmit={handleSaveBannerText} className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="admin-banner-title"
                      className="mb-1 block text-xs font-medium text-[#575D66]"
                    >
                      Banner Title (English)
                    </label>
                    <input
                      id="admin-banner-title"
                      type="text"
                      value={bannerTitleEn}
                      onChange={(e) => setBannerTitleEn(e.target.value)}
                      placeholder="e.g. Jumma Mubarak Reminder"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-sm text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-banner-ur"
                      className="mb-1 block text-xs font-medium text-[#575D66]"
                    >
                      Urdu Nastaliq Notice (اردو پیغام)
                    </label>
                    <textarea
                      id="admin-banner-ur"
                      rows={2}
                      dir="rtl"
                      value={bannerMsgUr}
                      onChange={(e) => setBannerMsgUr(e.target.value)}
                      placeholder="جمعۃ المبارک کے دن سورۃ الکہف کی تلاوت..."
                      className="font-urdu w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] p-3 text-base text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-banner-en"
                      className="mb-1 block text-xs font-medium text-[#575D66]"
                    >
                      English Message
                    </label>
                    <textarea
                      id="admin-banner-en"
                      rows={2}
                      value={bannerMsgEn}
                      onChange={(e) => setBannerMsgEn(e.target.value)}
                      placeholder="Remember to recite Surah Al-Kahf today..."
                      className="w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] p-3 text-sm text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="admin-save-banner"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save Banner Copy</span>
                  </button>
                </form>

                {/* Live Preview */}
                <div className="rounded-xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#FBF6E6] via-[#FFFDF7] to-[#FBF6E6] p-3.5 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E7614]">
                    Preview: {bannerTitleEn || 'Announcement'}
                  </div>
                  {bannerMsgUr && (
                    <p className="font-urdu text-sm text-[#14171A]" dir="rtl">
                      {bannerMsgUr}
                    </p>
                  )}
                  {bannerMsgEn && (
                    <p className="text-xs text-[#575D66]">{bannerMsgEn}</p>
                  )}
                </div>
              </section>

              {/* Section Visibility Toggles */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-[#E2DFD7] pb-3.5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14171A]">
                    <Eye className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                    <span>Home Menu Section Visibility</span>
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Show or hide any row on the main Home Screen immediately
                  </p>
                </div>

                <div className="divide-y divide-[#E2DFD7]">
                  {HOME_SECTION_LABELS.map((item) => {
                    const visible = config.visibleHomeSections[item.key];
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#14171A]">
                            {item.labelEn}
                          </div>
                          <div className="font-urdu text-xs text-[#A87C14]" dir="rtl">
                            {item.labelUr}
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={visible}
                          aria-label={`Toggle ${item.labelEn}`}
                          data-testid={`admin-toggle-section-${item.key}`}
                          onClick={() => handleToggleSection(item.key)}
                          className={`min-h-[36px] min-w-[78px] rounded-xl px-3 text-xs font-semibold cursor-pointer transition-colors ${
                            visible
                              ? 'bg-[#D4AF37] text-white'
                              : 'border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66]'
                          }`}
                        >
                          {visible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: PDF & Tafsir Link Manager */}
          {activeTab === 'links' && (
            <form onSubmit={handleSaveLinksAndDefaults} className="space-y-6">
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-[#E2DFD7] pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14171A]">
                    <BookOpen className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                    <span>Quran PDF Override &amp; Default Tafsir Editions</span>
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Leave Custom Quran PDF URL blank to keep the built-in 15-line offline Mushaf pages active, or attach a custom Quran PDF URL for direct full-screen PDF viewing.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="admin-quran-pdf-url"
                      className="mb-1 block text-xs font-semibold text-[#14171A]"
                    >
                      Custom Quran Mushaf PDF URL (Optional)
                    </label>
                    <input
                      id="admin-quran-pdf-url"
                      type="url"
                      value={quranUrlDraft}
                      onChange={(e) => setQuranUrlDraft(e.target.value)}
                      placeholder="https://example.com/15-line-hafizi-quran.pdf"
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-sm text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 rounded-xl border border-[#D4AF37]/45 bg-[#FBF6E6] px-4 py-3 space-y-1" dir="rtl">
                    <div className="font-urdu text-sm font-semibold text-[#9E7614]">
                      {STRICT_TRANSLATION_LABEL_UR}
                    </div>
                    <div className="font-urdu text-sm font-semibold text-[#14171A]">
                      {STRICT_TAFSIR_HEADER_UR}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2DFD7] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#14171A]">
                      Sirat-ul-Jinan 10 Jild PDF URLs
                    </h2>
                    <p className="text-xs text-[#575D66]">
                      Links saved here automatically appear on Jild 1–10 cards in Sirat-ul-Jinan.
                    </p>
                  </div>

                  <button
                    type="submit"
                    data-testid="admin-save-pdf-links"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save All PDF Links</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {SIRAT_VOLUMES.map((vol) => (
                    <div key={vol.jildNumber} className="space-y-1">
                      <label
                        htmlFor={`admin-jild-url-${vol.jildNumber}`}
                        className="flex items-center justify-between text-xs font-medium text-[#14171A]"
                      >
                        <span>
                          {vol.titleEn} ({vol.paraRangeLabelEn})
                        </span>
                        <span className="font-urdu text-xs text-[#A87C14]" dir="rtl">
                          {vol.titleUr}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={`admin-jild-url-${vol.jildNumber}`}
                          data-testid={`admin-jild-url-${vol.jildNumber}`}
                          type="url"
                          value={jildUrlDrafts[vol.jildNumber] ?? ''}
                          onChange={(e) =>
                            setJildUrlDrafts((prev) => ({
                              ...prev,
                              [vol.jildNumber]: e.target.value,
                            }))
                          }
                          placeholder={`https://.../sirat-ul-jinan-jild-${vol.jildNumber}.pdf`}
                          className="h-10 flex-1 rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs text-[#14171A] focus:border-[#D4AF37] focus:bg-white focus:outline-none"
                        />
                        {jildUrlDrafts[vol.jildNumber] && (
                          <button
                            type="button"
                            onClick={() =>
                              setJildUrlDrafts((prev) => ({
                                ...prev,
                                [vol.jildNumber]: '',
                              }))
                            }
                            aria-label={`Clear Jild ${vol.jildNumber} URL`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-[#575D66] hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </form>
          )}

          {/* TAB 3: Custom Mutashabihat & Featured Daily Ayahs */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Custom Mutashabihat Manager */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-[#E2DFD7] pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14171A]">
                    <Scale className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                    <span>Add Custom Mutashabihat Verse</span>
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Entries added here appear directly inside the Mutashabihat Index.
                  </p>
                </div>

                <form onSubmit={handleAddCustomMutashabih} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    <div>
                      <label htmlFor="mut-para" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Para (1–30)
                      </label>
                      <input
                        id="mut-para"
                        type="number"
                        min={1}
                        max={30}
                        value={mutPara}
                        onChange={(e) => setMutPara(Number(e.target.value) || 1)}
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="mut-surah" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Surah
                      </label>
                      <select
                        id="mut-surah"
                        value={mutSurahNo}
                        onChange={(e) => setMutSurahNo(Number(e.target.value))}
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-2 text-xs cursor-pointer"
                      >
                        {ALL_SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.englishName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="mut-page" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Page (2–611)
                      </label>
                      <input
                        id="mut-page"
                        type="number"
                        min={2}
                        max={611}
                        value={mutPage}
                        onChange={(e) => setMutPage(Number(e.target.value) || 2)}
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="mut-line" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Line (1–15)
                      </label>
                      <input
                        id="mut-line"
                        type="number"
                        min={1}
                        max={15}
                        value={mutLine}
                        onChange={(e) => setMutLine(Number(e.target.value) || 1)}
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mut-category" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      Category
                    </label>
                    <select
                      id="mut-category"
                      value={mutCategory}
                      onChange={(e) => setMutCategory(e.target.value as MutashabihEntry['category'])}
                      className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs cursor-pointer"
                    >
                      <option value="Tashabuh">Tashabuh</option>
                      <option value="Opening">Opening</option>
                      <option value="Ending">Ending</option>
                      <option value="Word Difference">Word Difference</option>
                      <option value="Waw/Fa">Waw/Fa</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mut-arabic" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      Arabic Phrase
                    </label>
                    <input
                      id="mut-arabic"
                      data-testid="admin-mut-arabic"
                      type="text"
                      dir="rtl"
                      value={mutArabic}
                      onChange={(e) => setMutArabic(e.target.value)}
                      placeholder="وَإِذْ قُلْنَا لِلْمَلَائِكَةِ اسْجُدُوا لِآدَمَ"
                      className="font-quran h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-lg text-[#14171A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="mut-tip-ur" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      Urdu Hifz Comparison Tip
                    </label>
                    <input
                      id="mut-tip-ur"
                      data-testid="admin-mut-tip"
                      type="text"
                      dir="rtl"
                      value={mutTipUr}
                      onChange={(e) => setMutTipUr(e.target.value)}
                      placeholder="حفظِ قرآن میں فرق کی وضاحت..."
                      className="font-urdu h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>

                  {/* Optional Paired Comparison Spot */}
                  <div className="rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] p-3 space-y-2">
                    <div className="text-[11px] font-semibold text-[#575D66]">
                      Optional Paired Verse Spot
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <select
                        aria-label="Paired Surah"
                        value={pairSurahNo}
                        onChange={(e) => setPairSurahNo(Number(e.target.value))}
                        className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs"
                      >
                        {ALL_SURAHS.map((s) => (
                          <option key={s.number} value={s.number}>
                            {s.number}. {s.englishName}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        aria-label="Paired Ayah number"
                        value={pairAyahNo}
                        onChange={(e) => setPairAyahNo(Number(e.target.value) || 1)}
                        placeholder="Ayah"
                        className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs"
                      />
                      <input
                        type="number"
                        min={2}
                        max={611}
                        aria-label="Paired Mushaf page"
                        value={pairPage}
                        onChange={(e) => setPairPage(Number(e.target.value) || 2)}
                        placeholder="Pg"
                        className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs"
                      />
                      <input
                        type="number"
                        min={1}
                        max={15}
                        aria-label="Paired line"
                        value={pairLine}
                        onChange={(e) => setPairLine(Number(e.target.value) || 1)}
                        placeholder="Line"
                        className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      dir="rtl"
                      value={pairDiffUr}
                      onChange={(e) => setPairDiffUr(e.target.value)}
                      placeholder="مشابہ مقام کا فرق (اختیاری)..."
                      className="font-urdu h-9 w-full rounded-lg border border-[#CBD5E1] bg-white px-2.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="admin-add-mutashabih"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Mutashabih Entry</span>
                  </button>
                </form>

                {config.customMutashabihat.length > 0 && (
                  <div className="space-y-2 border-t border-[#E2DFD7] pt-3">
                    <div className="text-xs font-semibold text-[#575D66]">
                      Custom Entries ({config.customMutashabihat.length})
                    </div>
                    <ul className="space-y-2">
                      {config.customMutashabihat.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#14171A] truncate">
                              {item.surahName} · Pg {item.page}/L{item.line}
                            </div>
                            <div className="font-quran text-base text-[#A87C14] truncate" dir="rtl">
                              {item.arabicPhrase}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomMutashabih(item.id)}
                            aria-label={`Delete custom Mutashabih ${item.surahName}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#575D66] hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              {/* Featured Daily Ayah & Admin Notes Manager */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-[#E2DFD7] pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14171A]">
                    <Sparkles className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                    <span>Featured Daily Ayah &amp; Notes</span>
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Highlight a daily Ayah or Islamic reminder directly on the Home Screen.
                  </p>
                </div>

                <form onSubmit={handleAddFeaturedAyah} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="ayah-surah" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Surah Name
                      </label>
                      <input
                        id="ayah-surah"
                        type="text"
                        value={ayahSurahName}
                        onChange={(e) => setAyahSurahName(e.target.value)}
                        placeholder="Al-Inshirah"
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor="ayah-ref" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                        Ayah Ref
                      </label>
                      <input
                        id="ayah-ref"
                        type="text"
                        value={ayahRef}
                        onChange={(e) => setAyahRef(e.target.value)}
                        placeholder="94:5-6"
                        className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ayah-arabic" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      Arabic Ayah
                    </label>
                    <input
                      id="ayah-arabic"
                      data-testid="admin-ayah-arabic"
                      type="text"
                      dir="rtl"
                      value={ayahArabic}
                      onChange={(e) => setAyahArabic(e.target.value)}
                      placeholder="فَإِنَّ مَعَ الْعُسْرِ يُسْرًا"
                      className="font-quran h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="ayah-urdu" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      Urdu Translation
                    </label>
                    <input
                      id="ayah-urdu"
                      type="text"
                      dir="rtl"
                      value={ayahUrdu}
                      onChange={(e) => setAyahUrdu(e.target.value)}
                      placeholder="بیشک دشواری کے ساتھ آسانی ہے۔"
                      className="font-urdu h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="ayah-note-en" className="mb-1 block text-[11px] font-medium text-[#575D66]">
                      English Reflection / Note (Optional)
                    </label>
                    <input
                      id="ayah-note-en"
                      type="text"
                      value={ayahNoteEn}
                      onChange={(e) => setAyahNoteEn(e.target.value)}
                      placeholder="Verily, with every hardship comes ease."
                      className="h-10 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="admin-add-featured-ayah"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Publish Featured Ayah</span>
                  </button>
                </form>

                {config.featuredAyahs.length > 0 && (
                  <div className="space-y-2 border-t border-[#E2DFD7] pt-3">
                    <div className="text-xs font-semibold text-[#575D66]">
                      Published Featured Ayahs ({config.featuredAyahs.length})
                    </div>
                    <ul className="space-y-2">
                      {config.featuredAyahs.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#14171A]">
                              {item.surahName} ({item.ayahRef})
                            </div>
                            <div className="font-quran text-base text-[#A87C14] truncate" dir="rtl">
                              {item.arabicText}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeaturedAyah(item.id)}
                            aria-label={`Remove Featured Ayah ${item.ayahRef}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#CBD5E1] bg-white text-[#575D66] hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 4: PIN Security & Backup / Restore */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Change PIN */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-4">
                <div className="border-b border-[#E2DFD7] pb-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-[#14171A]">
                    <KeyRound className="h-4 w-4 text-[#B58918]" aria-hidden="true" />
                    <span>Change Admin PIN</span>
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Update your secret console PIN anytime (4–12 characters, no spaces).
                  </p>
                </div>

                <form onSubmit={handleChangePin} className="space-y-3">
                  <div>
                    <label htmlFor="admin-old-pin" className="mb-1 block text-xs font-medium text-[#575D66]">
                      Current PIN
                    </label>
                    <input
                      id="admin-old-pin"
                      data-testid="admin-old-pin"
                      type="password"
                      inputMode="numeric"
                      value={currentPinDraft}
                      onChange={(e) => setCurrentPinDraft(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 font-mono-code text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-new-pin" className="mb-1 block text-xs font-medium text-[#575D66]">
                      New PIN
                    </label>
                    <input
                      id="admin-new-pin"
                      data-testid="admin-new-pin"
                      type="password"
                      inputMode="numeric"
                      value={newPinDraft}
                      onChange={(e) => setNewPinDraft(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 font-mono-code text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-confirm-pin" className="mb-1 block text-xs font-medium text-[#575D66]">
                      Confirm New PIN
                    </label>
                    <input
                      id="admin-confirm-pin"
                      data-testid="admin-confirm-pin"
                      type="password"
                      inputMode="numeric"
                      value={confirmPinDraft}
                      onChange={(e) => setConfirmPinDraft(e.target.value)}
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] px-3 font-mono-code text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="admin-change-pin-submit"
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#14171A] px-4 text-xs font-semibold text-[#F6DF90] cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Update Admin PIN</span>
                  </button>
                </form>
              </section>

              {/* Export / Import / Reset Safety */}
              <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-xs space-y-5">
                <div className="border-b border-[#E2DFD7] pb-3">
                  <h2 className="text-sm font-semibold text-[#14171A]">
                    Backup, Restore &amp; Safety Reset
                  </h2>
                  <p className="text-xs text-[#575D66]">
                    Export your app configuration as JSON, restore from a saved file, or safely revert to defaults.
                  </p>
                </div>

                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json,application/json"
                  aria-label="Import App Config JSON file"
                  data-testid="admin-import-input"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleImportFile(file);
                    e.target.value = '';
                  }}
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    data-testid="admin-export-json"
                    onClick={handleExportJson}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89D28] to-[#B6891B] px-4 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Export App Config (JSON)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="admin-import-json"
                    onClick={() => importInputRef.current?.click()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37] bg-[#FBF6E6] px-4 text-xs font-semibold text-[#9E7614] hover:bg-[#D4AF37] hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>Import App Config</span>
                  </button>
                </div>

                {/* Two-Step Inline Reset Safety */}
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
                  <div className="text-xs font-semibold text-rose-900">
                    Reset All Admin Customizations
                  </div>
                  <p className="text-xs text-rose-800">
                    Restores the default PIN, clears custom PDF links, clears custom Mutashabihat/Featured Ayahs, and shows all Home sections.
                  </p>

                  {!confirmResetOpen ? (
                    <button
                      type="button"
                      data-testid="admin-reset-trigger"
                      onClick={() => setConfirmResetOpen(true)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3.5 text-xs font-semibold text-rose-700 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Reset to Default</span>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid="admin-reset-confirm"
                        onClick={handleResetToDefault}
                        className="min-h-[40px] rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white cursor-pointer"
                      >
                        Yes, Reset Everything
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="min-h-[40px] rounded-xl border border-[#CBD5E1] bg-white px-4 text-xs font-medium text-[#575D66] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
