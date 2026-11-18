import { useState } from 'react';
import { FlipMode, ReaderSettings } from '../types/quran';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsAboutViewProps {
  mode: 'settings' | 'about';
  settings: ReaderSettings;
  onUpdateSettings: (patch: Partial<ReaderSettings>) => void;
  onOpenAndroidCode: () => void;
}

export function SettingsAboutView({
  mode,
  settings,
  onUpdateSettings,
  onOpenAndroidCode,
}: SettingsAboutViewProps) {
  const [emblemLoaded, setEmblemLoaded] = useState(true);

  if (mode === 'about') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 sm:p-8 space-y-5 shadow-[0_10px_30px_rgba(20,23,26,0.05)]">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#FBF9F5] p-1 ring-2 ring-[#E2E8F0]">
              {emblemLoaded ? (
                <img
                  src="/src/assets/images/royal_islamic_shamsa_1794717790674.jpg"
                  alt="Royal Shamsa Emblem"
                  referrerPolicy="no-referrer"
                  onError={() => setEmblemLoaded(false)}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="h-full w-full text-[#C59B27]">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2" />
                  <polygon
                    points="50,8 61,39 92,50 61,61 50,92 39,61 8,50 39,39"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
                Al-Mushaf — 15-Line Hafizi Quran
              </h1>
              <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
                پندرہ سطری حفاظی قرآنِ کریم · متشابہات · صراط الجنان ترجمہ و تفسیر
              </p>
            </div>
          </div>

          <p className="text-sm text-[#475569] leading-relaxed">
            Built around your authentic 619-page 15-Line Hafizi Quran PDF (Printed Mushaf Pages 2–611 plus Cover, Title Shamsa, Rumooz-e-Auqaf, and Printed Surah Index). Every Surah, Para, Mutashabihat entry, and Sirat-ul-Jinan link resolves directly to the exact page in the Mushaf.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4 border-t border-[#E2DFD7] text-xs">
            <div className="rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] p-3.5">
              <div className="font-semibold text-[#A87C14]">Offline Persistence</div>
              <div className="mt-1 text-[#575D66]">Bookmarks, Notes, Highlights &amp; Last-Read Position saved locally</div>
            </div>
            <div className="rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] p-3.5">
              <div className="font-semibold text-[#A87C14]">Exact 15-Line PDF</div>
              <div className="mt-1 text-[#575D66]">Pages 2–611 Quran + Rumooz-e-Auqaf &amp; Index (619 PDF pages)</div>
            </div>
            <div className="rounded-xl border border-[#E2DFD7] bg-[#FBF9F5] p-3.5">
              <div className="font-semibold text-[#A87C14]">Android Kotlin Blueprint</div>
              <div className="mt-1 text-[#575D66]">Full Jetpack Compose + PdfRenderer + Room SQLite source</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAndroidCode}
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#C59B27]/20 hover:brightness-105 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Inspect Android Studio Kotlin Code
          </button>
        </div>

        <PWAInstallButton variant="card" />
      </div>
    );
  }

  const flipModes: { id: FlipMode; title: string; desc: string }[] = [
    { id: 'curl3d', title: 'Realistic 3D Book Page Curl', desc: 'Physical paper fold perspective with spine shadow' },
    { id: 'swipeHorizontal', title: 'Smooth Horizontal Swipe', desc: 'PDF-style RTL horizontal page sliding' },
    { id: 'swipeVertical', title: 'Smooth Vertical Scroll', desc: 'Continuous vertical page turning' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="border-b border-[#E2DFD7] pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
          Settings &amp; Page Flip Mode
        </h1>
        <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
          ترتیبات — صفحہ پلٹنے کا انداز، روشنی اور حفظ اوورلے
        </p>
      </div>

      <div className="space-y-6">
        <PWAInstallButton variant="card" />

        {/* Page Flipping Mode */}
        <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 space-y-3 shadow-xs">
          <h2 className="text-base font-semibold text-[#14171A]">Page Flipping Mode</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {flipModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdateSettings({ flipMode: m.id })}
                className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                  settings.flipMode === m.id
                    ? 'border-[#D4AF37] bg-[#FBF6E6] text-[#14171A] shadow-xs'
                    : 'border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-[#D4AF37]/60'
                }`}
              >
                <div className={`text-sm font-semibold ${settings.flipMode === m.id ? 'text-[#9E7614]' : 'text-[#14171A]'}`}>
                  {m.title}
                </div>
                <div className="mt-1 text-xs opacity-85">{m.desc}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Brightness & Reading Comfort */}
        <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <label htmlFor="settings-brightness" className="text-sm font-semibold text-[#14171A]">
              In-App Reader Brightness
            </label>
            <span className="font-mono-code text-xs font-semibold text-[#A87C14] tabular-nums">
              {settings.brightness}%
            </span>
          </div>
          <input
            id="settings-brightness"
            type="range"
            min={40}
            max={110}
            value={settings.brightness}
            onChange={(e) => onUpdateSettings({ brightness: Number(e.target.value) })}
            className="w-full accent-[#C59B27] cursor-pointer"
          />

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#E2DFD7]">
            <div>
              <div className="text-sm font-medium text-[#14171A]">Reading Comfort Mode</div>
              <div className="text-xs text-[#575D66]">Warm ivory-parchment paper blend to reduce eye strain during long Tilawat</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.comfortMode}
              onClick={() => onUpdateSettings({ comfortMode: !settings.comfortMode })}
              className={`min-h-[38px] rounded-xl px-4 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                settings.comfortMode
                  ? 'bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] text-white shadow-xs'
                  : 'border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66]'
              }`}
            >
              {settings.comfortMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#E2DFD7]">
            <div>
              <div className="text-sm font-medium text-[#14171A]">15-Line Hifz Revision Overlay</div>
              <div className="text-xs text-[#575D66]">Tap any of the 15 lines on the PDF page to highlight and attach notes</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.showLineGuides}
              onClick={() => onUpdateSettings({ showLineGuides: !settings.showLineGuides })}
              className={`min-h-[38px] rounded-xl px-4 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                settings.showLineGuides
                  ? 'bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] text-white shadow-xs'
                  : 'border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66]'
              }`}
            >
              {settings.showLineGuides ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
