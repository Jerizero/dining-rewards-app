import React, { useEffect } from 'react';
import { EyeOff, RotateCcw } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-750 text-white shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs truncate mr-2">
          <EyeOff className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="truncate">{message}</span>
        </div>
        <button
          onClick={onUndo}
          className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/80 hover:bg-amber-900/80 px-2.5 py-1 rounded-lg border border-amber-500/40 shrink-0 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>
      </div>
    </div>
  );
};
