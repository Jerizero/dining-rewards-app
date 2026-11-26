import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, Copy, ExternalLink, Flag, Loader2, MessageSquarePlus, X } from 'lucide-react';
import {
  FEEDBACK_APP_ID,
  FeedbackPayload,
  FeedbackSurface,
  MAX_TEXT_LENGTH,
  QUICK_CHIPS_BY_SURFACE,
  buildFeedbackPayload,
  buildFeedbackText,
  formatReportForCopy,
} from '../utils/feedback';

export interface ImproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  app?: string;
  surface: FeedbackSurface;
  itemId: string;
  itemLabel?: string;
  itemMeta?: string;
  quickChips?: readonly string[];
  endpoint?: string;
}

interface SubmittedIssue {
  identifier: string;
  url?: string;
  title?: string;
}

export const ImproveModal: React.FC<ImproveModalProps> = ({
  isOpen,
  onClose,
  app = FEEDBACK_APP_ID,
  surface,
  itemId,
  itemLabel,
  itemMeta,
  quickChips,
  endpoint = '/api/feedback',
}) => {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState<SubmittedIssue | null>(null);
  const [failedState, setFailedState] = useState<{ reason: string; report: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chips = quickChips ?? QUICK_CHIPS_BY_SURFACE[surface];

  // Reset modal form state whenever opened for a new target.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedChips([]);
    setNote('');
    setSubmitting(false);
    setSubmittedIssue(null);
    setFailedState(null);
    setCopied(false);
    setCopyFailed(false);

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 40);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, surface, itemId, onClose]);

  if (!isOpen) return null;

  const combinedText = buildFeedbackText(selectedChips, note);
  const canSubmit = !submitting && combinedText.length >= 2 && combinedText.length <= MAX_TEXT_LENGTH;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
    setCopied(false);
  };

  const makeCurrentPayload = (): FeedbackPayload =>
    buildFeedbackPayload({
      app,
      surface,
      itemId,
      itemName: itemLabel,
      selectedChips,
      note,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      viewport:
        typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
    });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    const payload = makeCurrentPayload();
    setSubmitting(true);
    setFailedState(null);
    setSubmittedIssue(null);
    setCopied(false);
    setCopyFailed(false);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json')
        ? ((await res.json().catch(() => null)) as {
            ok?: boolean;
            error?: string;
            issue?: SubmittedIssue;
          } | null)
        : null;

      if (!res.ok || !json || json.ok !== true || !json.issue?.identifier) {
        const reason =
          json?.error ||
          (res.status === 404 || !contentType.includes('application/json')
            ? 'Feedback API is unavailable in this environment.'
            : `Server returned HTTP ${res.status}.`);
        setFailedState({
          reason,
          report: formatReportForCopy(payload),
        });
        return;
      }

      setSubmittedIssue(json.issue);
    } catch {
      setFailedState({
        reason: 'Network error while sending report.',
        report: formatReportForCopy(payload),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyReport = async () => {
    if (!failedState) return;
    setCopyFailed(false);

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(failedState.report);
        setCopied(true);
        return;
      }
    } catch {
      // Fall through to execCommand fallback below.
    }

    try {
      const el = document.createElement('textarea');
      el.value = failedState.report;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      if (ok) {
        setCopied(true);
        return;
      }
    } catch {
      // Fall through to honest inline notice.
    }

    setCopyFailed(true);
  };

  const isVenueSurface = surface === 'venue-card';
  const titleText = isVenueSurface ? `Flag ${itemLabel || itemId}` : 'Improve Dining Arbitrage';
  const subtitleText = isVenueSurface
    ? itemMeta || `Venue ID: ${itemId}`
    : 'Report a bug, missing spot, or feature idea';

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="improve-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#06080C]/85 backdrop-blur-sm"
    >
      <div className="w-full sm:max-w-md bg-[#141923] border border-slate-700/80 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#10141D] border-b border-slate-800/90 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id="improve-modal-title"
              className="font-display text-xl tracking-wide text-slate-50 leading-tight flex items-center gap-2 truncate"
            >
              {isVenueSurface ? (
                <Flag className="w-4 h-4 text-amber-300 shrink-0" />
              ) : (
                <MessageSquarePlus className="w-4 h-4 text-emerald-300 shrink-0" />
              )}
              <span className="truncate">{titleText}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitleText}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback modal"
            className="p-2 -mr-1 -mt-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {submittedIssue ? (
          <div className="p-4 space-y-4">
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <Check className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  Submitted as{' '}
                  {submittedIssue.url ? (
                    <a
                      href={submittedIssue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-emerald-400/60 underline-offset-2 hover:text-white inline-flex items-center gap-1"
                    >
                      {submittedIssue.identifier}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    submittedIssue.identifier
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Captured for <span className="font-mono text-slate-200">{itemId}</span> ({surface}).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 space-y-3.5 overflow-y-auto">
              {/* 1-tap Quick Chips */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Quick options
                </p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => {
                    const active = selectedChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleChip(chip)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition active:scale-95 min-h-[34px] inline-flex items-center gap-1.5 ${
                          active
                            ? 'bg-amber-500/20 border-amber-400/70 text-amber-200'
                            : 'bg-[#0B0E14] border-slate-700/80 text-slate-300 hover:text-slate-100 hover:border-slate-600'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-amber-300 shrink-0" />}
                        <span>{chip}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Free-text note */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="improve-note-input"
                    className="text-[11px] font-medium uppercase tracking-wider text-slate-400"
                  >
                    Note {selectedChips.length > 0 ? '(optional)' : ''}
                  </label>
                  {note.length > MAX_TEXT_LENGTH - 300 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {combinedText.length}/{MAX_TEXT_LENGTH}
                    </span>
                  )}
                </div>
                <textarea
                  id="improve-note-input"
                  ref={textareaRef}
                  rows={3}
                  maxLength={MAX_TEXT_LENGTH}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={
                    isVenueSurface
                      ? 'Add details (e.g. actually Thai, moved to SoHo, Bilt dropped to 3x)...'
                      : 'What is broken, missing, or annoying?'
                  }
                  className="w-full rounded-xl bg-[#0B0E14] border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-400/70 focus:ring-1 focus:ring-emerald-400/40 resize-none"
                />
              </div>

              {/* Metadata line */}
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                <span className="truncate">
                  {app} · {surface} · {itemId}
                </span>
              </div>

              {/* Honest fallback notice when direct submit fails */}
              {failedState && (
                <div
                  role="alert"
                  className="rounded-xl bg-amber-950/50 border border-amber-500/50 p-3 space-y-2.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-200">
                        Could not submit directly - copy report below
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">{failedState.reason}</p>
                    </div>
                  </div>

                  <pre className="text-[11px] font-mono text-slate-200 bg-[#0B0E14] border border-slate-700/80 rounded-lg p-2.5 whitespace-pre-wrap break-words max-h-32 overflow-y-auto select-all">
                    {failedState.report}
                  </pre>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 ${
                        copied
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied report' : 'Copy report'}</span>
                    </button>

                    {copyFailed && (
                      <span className="text-[11px] text-amber-300">
                        Select text above and press Cmd/Ctrl+C
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#10141D] border-t border-slate-800/90 flex items-center justify-between gap-2">
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Cmd/Ctrl+Enter to send
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-semibold text-xs transition active:scale-95"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {submitting ? 'Sending...' : failedState ? 'Retry submit' : 'Submit'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : null;
};
