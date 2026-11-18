import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { verifyAdminPin } from '../utils/adminConfig';

interface AdminPinModalProps {
  open: boolean;
  storedPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function AdminPinModal({
  open,
  storedPin,
  onSuccess,
  onClose,
}: AdminPinModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPinInput('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPin(pinInput, storedPin)) {
      setError('Incorrect Admin PIN. Please try again.');
      return;
    }
    setError(null);
    setPinInput('');
    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C0F]/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Admin Access Verification"
      data-testid="admin-pin-modal"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-[#D4AF37]/55 bg-[#121419] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.65)] space-y-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#D4AF37]/25 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#F3D26A]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F6DF90]">
                Owner Console
              </h2>
              <p className="font-urdu text-sm text-[#D4AF37]/85" dir="rtl">
                ایڈمن پینل تک رسائی کے لیے پن درج کریں
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close PIN modal"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-300 hover:border-[#D4AF37]/60 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="admin-pin-input"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300"
          >
            <KeyRound className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>Enter Owner PIN</span>
          </label>
          <input
            id="admin-pin-input"
            data-testid="admin-pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              setError(null);
            }}
            placeholder="••••"
            autoFocus
            className="h-12 w-full rounded-xl border border-[#D4AF37]/40 bg-[#0A0B0E] px-4 text-center font-mono-code text-lg tracking-[0.35em] text-[#F6DF90] placeholder:text-slate-600 focus:border-[#D4AF37] focus:outline-none"
          />
          {error && (
            <p
              role="alert"
              data-testid="admin-pin-error"
              className="text-xs font-medium text-rose-400"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="admin-pin-submit"
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E6C45A] to-[#B6891B] px-5 text-xs font-bold text-[#111317] shadow-sm hover:brightness-105 cursor-pointer"
          >
            Unlock Console
          </button>
        </div>
      </form>
    </div>
  );
}
