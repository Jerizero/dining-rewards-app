import React from 'react';
import { X, CreditCard, Check, Sparkles } from 'lucide-react';
import { CardProfile } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardProfile[];
  onToggleCard: (id: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  cards,
  onToggleCard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              My Card Wallet
            </h3>
            <p className="text-xs text-zinc-400">
              Select the cards you carry to optimize dining multipliers
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 overflow-y-auto">
          {cards.map((card) => {
            const isEnabled = card.enabled !== false;
            return (
              <button
                key={card.id}
                onClick={() => onToggleCard(card.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                  isEnabled
                    ? 'bg-zinc-950 border-blue-500/50 shadow-sm'
                    : 'bg-zinc-900/60 border-zinc-800/80 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">{card.name}</span>
                    {card.rentDayMultiplier && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {card.rentDayMultiplier}x Rent Day
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {card.diningMultiplier}x on dining ({card.pointType})
                  </p>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                    isEnabled
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-white text-xs transition"
          >
            Save Wallet Setup
          </button>
        </div>
      </div>
    </div>
  );
};
