import { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'card';
}

export function PWAInstallButton({ variant = 'header' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress install prompt when already running in standalone PWA mode
  if (isInstalled) {
    return null;
  }

  const iosModal = showIOSGuide && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Install Al-Mushaf on iOS"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#D4AF37]/50 bg-white p-6 text-[#14171A] shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="Al-Mushaf App Icon"
              className="h-11 w-11 rounded-xl border border-[#D4AF37]/40 object-cover"
            />
            <div>
              <h3 className="font-display text-base font-semibold text-[#14171A]">
                Install Al-Mushaf
              </h3>
              <p className="font-urdu text-xs text-[#A87C14]" dir="rtl">
                آئی فون / آئی پیڈ پر انسٹال کریں
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIOSGuide(false)}
            aria-label="Close install instructions"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#CBD5E1] text-[#575D66] hover:border-[#D4AF37] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-4 space-y-2.5 text-sm text-[#475569]">
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBF6E6] text-xs font-bold text-[#A87C14]">
              1
            </span>
            <span>
              Tap the <strong className="inline-flex items-center gap-1 text-[#14171A]"><Share className="h-3.5 w-3.5" aria-hidden="true" /> Share</strong> button in Safari&apos;s toolbar.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBF6E6] text-xs font-bold text-[#A87C14]">
              2
            </span>
            <span>
              Scroll down and tap <strong className="text-[#14171A]">Add to Home Screen</strong>.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBF6E6] text-xs font-bold text-[#A87C14]">
              3
            </span>
            <span>
              Tap <strong className="text-[#14171A]">Add</strong> to launch Al-Mushaf full-screen offline.
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={() => setShowIOSGuide(false)}
          className="mt-5 min-h-[42px] w-full rounded-xl bg-gradient-to-r from-[#0D5735] to-[#073822] py-2 text-xs font-semibold text-[#FFF4CC] border border-[#D4AF37]/60 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );

  // Header compact action button
  if (variant === 'header') {
    if (!isInstallable && !isIOS) return null;

    return (
      <>
        <button
          type="button"
          onClick={isInstallable ? install : () => setShowIOSGuide(true)}
          data-testid="pwa-install-header-btn"
          aria-label="Install Al-Mushaf App"
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D4AF37] bg-[#073822] px-3 py-2 text-xs font-semibold text-[#FFF4CC] shadow-sm hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-[#F7DA7E]" aria-hidden="true" />
          <span className="hidden sm:inline">Install App</span>
        </button>
        {iosModal}
      </>
    );
  }

  // Drawer install button
  if (variant === 'drawer') {
    if (!isInstallable && !isIOS) return null;

    return (
      <>
        <button
          type="button"
          onClick={isInstallable ? install : () => setShowIOSGuide(true)}
          data-testid="pwa-install-drawer-btn"
          className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/70 bg-gradient-to-r from-[#073822] to-[#0D5735] px-3.5 py-2.5 text-left text-[#FFF6D6] shadow-xs hover:brightness-110 transition cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Download className="h-4 w-4 shrink-0 text-[#F7DA7E]" aria-hidden="true" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Install Al-Mushaf App</div>
              <div className="font-urdu text-xs text-[#F5D675] truncate" dir="rtl">
                موبائل ایپ انسٹال کریں
              </div>
            </div>
          </div>
          <Smartphone className="h-4 w-4 shrink-0 text-[#F7DA7E]" aria-hidden="true" />
        </button>
        {iosModal}
      </>
    );
  }

  // Card variant for Settings & About view
  return (
    <>
      <section
        data-testid="pwa-install-card"
        className="rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#08080A] via-[#0B1711] to-[#073822] p-5 text-[#FFF6D6] shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="Al-Mushaf 3D Islamic App Icon"
              className="h-14 w-14 shrink-0 rounded-2xl border border-[#D4AF37]/70 object-cover shadow-md"
            />
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-[#F7DE8C]">
                Install Mobile App (PWA)
              </h2>
              <p className="font-urdu text-xs text-[#EAD7A1] text-left" dir="rtl">
                آف لائن تلاوت اور تفسیر کے لیے ہوم اسکرین پر انسٹال کریں
              </p>
              <p className="mt-1 text-xs text-[#CBD5E1]">
                Standalone portrait mode with offline app shell, Mushaf pages &amp; cached Tafsir.
              </p>
            </div>
          </div>

          {isInstallable ? (
            <button
              type="button"
              onClick={install}
              data-testid="pwa-install-card-btn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] px-4 py-2 text-xs font-semibold text-[#08080A] shadow-sm hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Install Now</span>
            </button>
          ) : isIOS ? (
            <button
              type="button"
              onClick={() => setShowIOSGuide(true)}
              data-testid="pwa-install-ios-btn"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37] bg-[#0D5735] px-4 py-2 text-xs font-semibold text-[#FFF4CC] hover:brightness-110 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share className="h-4 w-4 text-[#F7DA7E]" aria-hidden="true" />
              <span>Install on iOS</span>
            </button>
          ) : (
            <span className="rounded-xl border border-[#D4AF37]/40 bg-black/40 px-3 py-2 text-[11px] font-medium text-[#F5D675]">
              Use Browser Menu → Add to Home Screen
            </span>
          )}
        </div>
      </section>
      {iosModal}
    </>
  );
}
