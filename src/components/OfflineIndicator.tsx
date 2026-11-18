import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-mode-indicator"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-[#D4AF37]/70 bg-[#08080A]/95 px-3.5 py-2 text-xs font-medium text-[#F7DE8C] shadow-lg backdrop-blur-sm"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
      <span>Offline Mode — Cached Mushaf &amp; Tafsir active</span>
    </div>
  );
}
