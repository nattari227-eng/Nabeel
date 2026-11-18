import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { JildPdfAttachmentMeta, SiratVolume } from '../types/quran';
import { getJildPdfRecord, updateJildPdfPage } from '../utils/siratCache';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface CustomPdfDescriptor {
  titleEn: string;
  subtitleEn: string;
  url: string;
}

interface JildPdfViewerModalProps {
  volume?: SiratVolume;
  attachment?: JildPdfAttachmentMeta;
  customPdf?: CustomPdfDescriptor;
  onClose: () => void;
}

export function JildPdfViewerModal({
  volume,
  attachment,
  customPdf,
  onClose,
}: JildPdfViewerModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const initialPage = customPdf
    ? 1
    : Math.max(1, attachment?.lastPdfPage || 1);

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [zoom, setZoom] = useState(1.15);
  const [comfortSepia, setComfortSepia] = useState(false);

  // Load PDF Document from IndexedDB Blob or Custom URL
  useEffect(() => {
    let cancelled = false;
    let activeTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    setLoadingDoc(true);
    setDocError(null);

    async function loadDocument() {
      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (customPdf?.url) {
          loadingTask = pdfjsLib.getDocument({ url: customPdf.url });
        } else if (volume) {
          const record = await getJildPdfRecord(volume.jildNumber);
          if (record?.blob) {
            const buf = await record.blob.arrayBuffer();
            loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
          } else if (attachment?.customUrl) {
            loadingTask = pdfjsLib.getDocument({ url: attachment.customUrl });
          } else {
            throw new Error('Selected PDF file was not found in browser storage. Please attach the PDF file again.');
          }
        } else {
          throw new Error('No PDF source configured.');
        }

        activeTask = loadingTask;
        const doc = await loadingTask.promise;
        if (cancelled) {
          await doc.cleanup();
          return;
        }
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        const safeStart = Math.max(
          1,
          Math.min(doc.numPages, customPdf ? 1 : attachment?.lastPdfPage || 1)
        );
        setCurrentPage(safeStart);
        setPageInput(String(safeStart));
        setLoadingDoc(false);
      } catch (err) {
        if (cancelled) return;
        setLoadingDoc(false);
        setDocError(
          err instanceof Error
            ? err.message
            : 'Unable to open this PDF inside the built-in viewer.'
        );
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        pdfDocRef.current.cleanup().catch(() => {});
        pdfDocRef.current = null;
      }
      if (activeTask) {
        activeTask.destroy().catch(() => {});
      }
    };
  }, [volume?.jildNumber, attachment?.customUrl, attachment?.updatedAt, customPdf?.url]);

  // Render active PDF page onto canvas
  useEffect(() => {
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas || numPages === 0) return;

    let cancelled = false;

    async function renderCurrentPage() {
      if (!doc || !canvas) return;
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
        const page = await doc.getPage(currentPage);
        if (cancelled) return;

        const containerWidth = Math.max(300, Math.min(window.innerWidth - 24, 920));
        const unscaledViewport = page.getViewport({ scale: 1 });
        const fitScale = containerWidth / unscaledViewport.width;
        const effectiveScale = fitScale * zoom;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const viewport = page.getViewport({ scale: effectiveScale });
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const task = page.render({ canvasContext: ctx, viewport, canvas });
        renderTaskRef.current = task;
        await task.promise;
      } catch (err) {
        if (cancelled) return;
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
          return;
        }
      }
    }

    renderCurrentPage();
    if (volume && !customPdf) {
      updateJildPdfPage(volume.jildNumber, currentPage);
    }

    return () => {
      cancelled = true;
    };
  }, [currentPage, numPages, zoom, volume?.jildNumber, customPdf]);

  const goToPage = (target: number) => {
    if (numPages <= 0) return;
    const clamped = Math.max(1, Math.min(numPages, target));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(pageInput);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= numPages) {
      goToPage(parsed);
    }
  };

  const headerTitle = customPdf
    ? customPdf.titleEn
    : `${volume?.titleEn ?? 'Sirat-ul-Jinan'} · ${volume?.paraRangeLabelEn ?? ''}`;
  const headerFileName = customPdf
    ? customPdf.subtitleEn
    : attachment?.fileName ?? '';
  const fallbackUrl = customPdf?.url ?? attachment?.customUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-[#14171A] text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`${headerTitle} PDF Reader`}
      data-testid="jild-pdf-viewer-modal"
    >
      {/* Top Full-Screen Reader Bar */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1B1F24] px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PDF reader"
            data-testid="close-jild-pdf-button"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-[#D4AF37]/50 bg-[#14171A] px-3 text-xs font-semibold text-[#F3D26A] hover:bg-[#D4AF37] hover:text-[#14171A] transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{customPdf ? 'Back' : 'Back to Jilds'}</span>
          </button>

          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold text-white truncate">
              {headerTitle}
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {headerFileName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setComfortSepia((v) => !v)}
            aria-label="Toggle warm paper comfort mode"
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium cursor-pointer ${
              comfortSepia
                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F3D26A]'
                : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30'
            }`}
          >
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Comfort</span>
          </button>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            aria-label="Zoom out PDF"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 hover:border-white/30 cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" aria-hidden="true" />
          </button>

          <span className="hidden sm:inline-block min-w-[48px] text-center font-mono-code text-xs text-slate-200 tabular-nums">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.1, Number((z + 0.15).toFixed(2))))}
            aria-label="Zoom in PDF"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 hover:border-white/30 cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Scrollable PDF Canvas Surface */}
      <div className="flex-1 overflow-auto bg-[#0F1114] p-3 sm:p-6">
        {loadingDoc && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
            <p className="text-sm font-medium text-slate-200">
              Opening {headerFileName || 'PDF'}...
            </p>
          </div>
        )}

        {docError && (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-rose-500/40 bg-[#1B1F24] p-6 text-center space-y-4">
            <p className="text-sm text-rose-200">{docError}</p>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#14171A]"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                <span>Open External PDF Link</span>
              </a>
            )}
          </div>
        )}

        {!loadingDoc && !docError && (
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              data-testid="jild-pdf-canvas"
              className="rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.5)] bg-white"
              style={{
                filter: comfortSepia ? 'sepia(0.24) brightness(0.95)' : undefined,
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Page Controls */}
      {numPages > 0 && (
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#1B1F24] px-4 py-2.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            aria-label="Previous PDF page"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white hover:border-[#D4AF37] disabled:opacity-35 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>Prev</span>
          </button>

          <form onSubmit={handlePageJump} className="flex items-center gap-2">
            <label htmlFor="jild-pdf-page-input" className="text-xs text-slate-300">
              Page
            </label>
            <input
              id="jild-pdf-page-input"
              type="number"
              min={1}
              max={numPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="h-10 w-20 rounded-lg border border-white/20 bg-[#14171A] px-2 text-center font-mono-code text-xs text-white focus:border-[#D4AF37] focus:outline-none tabular-nums"
            />
            <span className="font-mono-code text-xs text-slate-300 tabular-nums">
              / {numPages}
            </span>
          </form>

          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={() => goToPage(currentPage + 1)}
            aria-label="Next PDF page"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white hover:border-[#D4AF37] disabled:opacity-35 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </footer>
      )}
    </div>
  );
}
