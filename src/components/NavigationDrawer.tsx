import {
  BookMarked,
  BookOpen,
  Code2,
  FileText,
  Heart,
  Home,
  Info,
  Layers,
  Scale,
  Settings,
  X,
} from 'lucide-react';
import { AppSection, HomeMenuSectionKey } from '../types/quran';
import { PWAInstallButton } from './PWAInstallButton';

interface NavigationDrawerProps {
  open: boolean;
  activeSection: AppSection;
  bookmarksCount: number;
  favoritesCount: number;
  notesCount: number;
  visibleHomeSections?: Record<HomeMenuSectionKey, boolean>;
  onClose: () => void;
  onNavigate: (section: AppSection) => void;
}

const DRAWER_ITEMS: {
  id: AppSection;
  label: string;
  urdu: string;
  icon: typeof Home;
}[] = [
  { id: 'dashboard', label: 'Home / Continue Reading', urdu: 'جہاں سے ختم کیا', icon: Home },
  { id: 'reader', label: '15-Line Quran Reader', urdu: 'تلاوتِ قرآن', icon: BookOpen },
  { id: 'bookmarks', label: 'Saved Bookmarks', urdu: 'محفوظ صفحات', icon: BookMarked },
  { id: 'favorites', label: 'Favorites', urdu: 'پسندیدہ', icon: Heart },
  { id: 'notes', label: 'Personal Notes & Highlights', urdu: 'ذاتی نوٹس', icon: FileText },
  { id: 'mutashabihat', label: 'Mutashabihat List', urdu: 'متشابہاتِ قرآن', icon: Scale },
  { id: 'sirat', label: 'Sirat-ul-Jinan Folder', urdu: 'صراط الجنان تفسیر', icon: Layers },
  { id: 'settings', label: 'Settings & Page Flip Mode', urdu: 'ترتیبات', icon: Settings },
  { id: 'android_code', label: 'Android Kotlin Source Code', urdu: 'اینڈرائیڈ کوٹلن کوڈ', icon: Code2 },
  { id: 'about', label: 'About App', urdu: 'ہمارے بارے میں', icon: Info },
];

export function NavigationDrawer({
  open,
  activeSection,
  bookmarksCount,
  favoritesCount,
  notesCount,
  visibleHomeSections,
  onClose,
  onNavigate,
}: NavigationDrawerProps) {
  if (!open) return null;

  const isDrawerItemVisible = (id: AppSection) => {
    if (!visibleHomeSections) return true;
    if (id === 'bookmarks') return visibleHomeSections.bookmarks;
    if (id === 'notes') return visibleHomeSections.notes;
    if (id === 'mutashabihat') return visibleHomeSections.mutashabihat;
    if (id === 'sirat') return visibleHomeSections.sirat;
    return true;
  };

  const getCount = (id: AppSection) => {
    if (id === 'bookmarks') return bookmarksCount;
    if (id === 'favorites') return favoritesCount;
    if (id === 'notes') return notesCount;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Main Navigation Menu">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="fixed inset-0 bg-[#14171A]/40 backdrop-blur-sm cursor-pointer"
      />

      {/* Drawer Panel: Crisp White, Royal Gold & Silver */}
      <aside className="relative z-10 flex h-full w-[320px] max-w-[86vw] flex-col border-r border-[#D4AF37]/40 bg-white text-[#14171A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2DFD7] bg-[#FBF9F5] px-5 py-5">
          <div>
            <p className="font-quran text-2xl text-[#A87C14]" dir="rtl">
              اَلْمُصْحَفُ التَّجْوِيْدِيْ
            </p>
            <p className="text-xs text-[#575D66] mt-0.5">15-Line Hafizi White &amp; Gold</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white text-[#14171A] hover:border-[#D4AF37] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <PWAInstallButton variant="drawer" />
          {DRAWER_ITEMS.filter((item) => isDrawerItemVisible(item.id)).map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            const count = getCount(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex min-h-[46px] w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F8F2DF] text-[#9E7614] border border-[#D4AF37]/60'
                    : 'text-[#14171A] hover:bg-[#F5F3EE] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#B58918]' : 'text-[#64748B]'}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    <div className="font-urdu text-xs text-[#575D66] truncate" dir="rtl">
                      {item.urdu}
                    </div>
                  </div>
                </div>
                {count !== null && (
                  <span className="text-xs font-mono-code font-semibold text-[#A87C14] tabular-nums shrink-0">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#E2DFD7] bg-[#FBF9F5] px-5 py-3.5 text-xs text-[#575D66]">
          100% Offline Storage · Room SQLite Blueprint Ready
        </div>
      </aside>
    </div>
  );
}
