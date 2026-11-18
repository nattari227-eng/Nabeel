import { ALL_PARAS } from '../data/quranMetadata';

interface ParaIndexViewProps {
  onOpenParaPage: (page: number) => void;
}

export function ParaIndexView({ onOpenParaPage }: ParaIndexViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2DFD7] pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
            Para / Juz Index (30 Paras)
          </h1>
          <p className="font-urdu text-base text-[#A87C14]" dir="rtl">
            تیس پاروں کی مکمل فہرست · عربی و اردو نام اور مصحف کا عین صفحہ نمبر
          </p>
        </div>
        <div className="text-xs font-medium text-[#575D66]">
          15-Line Hafizi Mushaf PDF (Pages 2 – 611)
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_PARAS.map((para) => {
          const page = para.startPage;
          return (
            <button
              key={para.number}
              type="button"
              onClick={() => onOpenParaPage(page)}
              className="flex min-h-[76px] items-center justify-between gap-3 rounded-2xl border border-[#CBD5E1] bg-white p-4 text-left shadow-xs hover:border-[#D4AF37] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/45 bg-[#FBF6E6] font-mono-code text-xs font-semibold text-[#9E7614] tabular-nums">
                  {para.number}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#14171A] truncate">
                    {para.englishName}
                  </div>
                  <div className="mt-0.5 text-xs text-[#575D66] truncate">
                    <span>{para.startSurah}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-code font-semibold text-[#A87C14] tabular-nums">Page {page}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0" dir="rtl">
                <div className="font-quran text-xl text-[#A87C14]">{para.arabicName}</div>
                <div className="font-urdu text-xs text-[#575D66]">{para.urduName}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
