import { useState } from 'react';
import { Check, Copy, FileCode2 } from 'lucide-react';
import { ANDROID_KOTLIN_FILES } from '../data/androidKotlinCode';

export function AndroidSourceView() {
  const [selectedId, setSelectedId] = useState(ANDROID_KOTLIN_FILES[0].id);
  const [copied, setCopied] = useState(false);

  const activeFile =
    ANDROID_KOTLIN_FILES.find((f) => f.id === selectedId) ?? ANDROID_KOTLIN_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="border-b border-[#E2DFD7] pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#14171A]">
          Android Studio Kotlin &amp; Jetpack Compose Source Code
        </h1>
        <p className="mt-1 text-sm text-[#575D66]">
          Complete 100% offline Android implementation: Project structure, <span className="font-mono-code text-[#14171A]">build.gradle.kts</span>, Room Entities &amp; DAOs, 3D Page Curl + <span className="font-mono-code text-[#14171A]">PdfRenderer</span> engine, Splash Screen, Reader Activity, and Navigation Drawer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[310px_1fr] items-start">
        {/* File List Sidebar */}
        <div className="rounded-2xl border border-[#CBD5E1] bg-white p-3 space-y-1.5 shadow-xs">
          {ANDROID_KOTLIN_FILES.map((file) => {
            const isSelected = file.id === activeFile.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  setSelectedId(file.id);
                  setCopied(false);
                }}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3.5 py-3 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FBF6E6] border border-[#D4AF37] text-[#9E7614]'
                    : 'border border-transparent text-[#14171A] hover:bg-[#FBF9F5]'
                }`}
              >
                <FileCode2
                  className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? 'text-[#A87C14]' : 'text-[#B58918]'}`}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-snug">{file.title}</div>
                  <div className="mt-0.5 font-mono-code text-[11px] text-[#575D66] truncate">
                    {file.filePath}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Inspector Panel */}
        <div className="rounded-2xl border border-[#CBD5E1] bg-white overflow-hidden shadow-[0_8px_24px_rgba(20,23,26,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2DFD7] bg-[#FBF9F5] px-5 py-3.5">
            <div className="flex-1 min-w-[240px]">
              <div className="text-sm font-semibold text-[#14171A]">{activeFile.title}</div>
              <div className="text-xs text-[#575D66] mt-0.5">{activeFile.summary}</div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C89D28] via-[#D4AF37] to-[#B6891B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-105 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="max-h-[680px] overflow-auto bg-[#181B20] p-5 font-mono-code text-xs leading-relaxed text-[#F1EDE4]">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
