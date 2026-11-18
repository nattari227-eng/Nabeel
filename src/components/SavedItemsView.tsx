import { BookMarked, FileText, Heart, Trash2 } from 'lucide-react';
import { Bookmark, FavoriteItem, StudyNote } from '../types/quran';

interface SavedItemsViewProps {
  mode: 'bookmarks' | 'favorites' | 'notes';
  bookmarks: Bookmark[];
  favorites: FavoriteItem[];
  notes: StudyNote[];
  onJumpToPage: (page: number, line?: number) => void;
  onRemoveBookmark: (page: number) => void;
  onRemoveFavorite: (id: string) => void;
  onRemoveNote: (id: string) => void;
}

export function SavedItemsView({
  mode,
  bookmarks,
  favorites,
  notes,
  onJumpToPage,
  onRemoveBookmark,
  onRemoveFavorite,
  onRemoveNote,
}: SavedItemsViewProps) {
  if (mode === 'bookmarks') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="border-b border-[#E2DFD7] pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
            Saved Bookmarks
          </h1>
          <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
            محفوظ صفحات — کسی بھی محفوظ صفحہ پر فوری جائیں
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center space-y-2 shadow-xs">
            <BookMarked className="mx-auto h-7 w-7 text-[#B58918]" aria-hidden="true" />
            <p className="text-sm font-medium text-[#14171A]">No saved bookmarks yet.</p>
            <p className="text-xs text-[#575D66]">
              Tap the Bookmark button inside the 15-Line Quran Reader to save any page offline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-xs hover:border-[#D4AF37] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onJumpToPage(bm.pageNumber)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <div className="text-base font-semibold text-[#14171A]">{bm.surahName}</div>
                  <div className="mt-0.5 text-xs text-[#575D66]">
                    <span>Para {bm.paraNumber}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-code font-semibold text-[#A87C14] tabular-nums">
                      Page {bm.pageNumber}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{bm.label}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveBookmark(bm.pageNumber)}
                  aria-label={`Delete bookmark for page ${bm.pageNumber}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'favorites') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="border-b border-[#E2DFD7] pb-4">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
            Favorites
          </h1>
          <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
            پسندیدہ سورتیں اور صفحات
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center space-y-2 shadow-xs">
            <Heart className="mx-auto h-7 w-7 text-[#B58918]" aria-hidden="true" />
            <p className="text-sm font-medium text-[#14171A]">No favorite Surahs or pages yet.</p>
            <p className="text-xs text-[#575D66]">
              Tap the heart icon in the Surah Index or Quran Reader to add favorites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-xs hover:border-[#D4AF37] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onJumpToPage(fav.pageNumber)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <div className="font-quran text-xl text-[#A87C14]" dir="rtl">
                    {fav.titleArabic}
                  </div>
                  <div className="font-urdu text-sm font-medium text-[#14171A]" dir="rtl">
                    {fav.titleUrdu}
                  </div>
                  <div className="mt-1 text-xs text-[#575D66]">{fav.subtitle}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveFavorite(fav.id)}
                  aria-label={`Remove ${fav.titleUrdu} from favorites`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="border-b border-[#E2DFD7] pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
          Personal Study Notes &amp; Hifz Highlights
        </h1>
        <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
          ذاتی نوٹس اور حفظِ قرآن کی نشاندہی
        </p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-10 text-center space-y-2 shadow-xs">
          <FileText className="mx-auto h-7 w-7 text-[#B58918]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#14171A]">No study notes added yet.</p>
          <p className="text-xs text-[#575D66]">
            Tap any of the 15 lines in the Quran Reader to highlight it and attach a personal revision note.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-xs hover:border-[#D4AF37] transition-colors"
            >
              <button
                type="button"
                onClick={() => onJumpToPage(note.pageNumber, note.lineNumber)}
                className="flex-1 text-left cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#A87C14]">
                  <span>{note.surahName}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono-code tabular-nums">
                    Page {note.pageNumber}, Line {note.lineNumber}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className="capitalize">{note.highlightColor} Highlight</span>
                </div>
                <p className="mt-1.5 text-sm text-[#14171A] leading-relaxed">{note.noteText}</p>
              </button>
              <button
                type="button"
                onClick={() => onRemoveNote(note.id)}
                aria-label={`Delete study note on page ${note.pageNumber} line ${note.lineNumber}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#CBD5E1] bg-[#FBF9F5] text-[#575D66] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
