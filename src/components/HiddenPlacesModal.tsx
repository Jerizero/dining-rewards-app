import React from 'react';
import { X, Eye, RotateCcw, MapPin } from 'lucide-react';
import { Venue } from '../types';

interface HiddenPlacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenVenues: Venue[];
  onUnhide: (id: string) => void;
  onRestoreAll: () => void;
}

export const HiddenPlacesModal: React.FC<HiddenPlacesModalProps> = ({
  isOpen,
  onClose,
  hiddenVenues,
  onUnhide,
  onRestoreAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Hidden Places</h3>
            <p className="text-xs text-zinc-400">
              {hiddenVenues.length} {hiddenVenues.length === 1 ? 'place' : 'places'} hidden from your feed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {hiddenVenues.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No hidden places right now.
            </div>
          ) : (
            hiddenVenues.map((venue) => (
              <div
                key={venue.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80"
              >
                <div>
                  <h4 className="text-sm font-semibold text-white">{venue.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span>{venue.neighborhood}</span>
                    <span>•</span>
                    <span>{venue.cuisine}</span>
                  </div>
                </div>

                <button
                  onClick={() => onUnhide(venue.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Unhide</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {hiddenVenues.length > 0 && (
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <button
              onClick={onRestoreAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Unhide All Places</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
