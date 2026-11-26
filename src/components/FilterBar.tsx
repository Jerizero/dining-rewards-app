import React from 'react';
import { Search, X, Clock, ArrowDownUp, RotateCcw } from 'lucide-react';
import { CuisineType, Neighborhood, SortMode } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCuisine: CuisineType;
  onCuisineChange: (c: CuisineType) => void;
  selectedNeighborhood: Neighborhood;
  onNeighborhoodChange: (n: Neighborhood) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  platformFilter: string;
  onPlatformFilterChange: (p: string) => void;
  sortMode: SortMode;
  onSortModeChange: (m: SortMode) => void;
}

const CUISINES: CuisineType[] = [
  'All',
  'Italian',
  'Japanese',
  'Cocktails & Bar',
  'American',
  'French',
  'Mexican',
  'Mediterranean',
  'Korean',
  'Indian',
  'Thai',
  'Chinese',
  'Vietnamese',
  'Steakhouse',
  'Seafood',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Bakery & Coffee',
];

const NEIGHBORHOODS: Neighborhood[] = [
  'All',
  'West Village',
  'SoHo',
  'Lower East Side',
  'East Village',
  'Flatiron & NoMad',
  'Chelsea',
  'Midtown',
  "Hell's Kitchen",
  'Upper East Side',
  'Upper West Side',
  'Tribeca & FiDi',
  'Nolita',
  'Chinatown & Little Italy',
  'Williamsburg',
  'Greenpoint',
  'DUMBO & Heights',
  'Park Slope & Boerum Hill',
  'Bushwick',
  'Astoria',
  'Long Island City',
];

const PLATFORMS = [
  { value: 'all', label: 'All Programs' },
  { value: 'inKind', label: 'inKind' },
  { value: 'Seated', label: 'Seated' },
  { value: 'Bilt', label: 'Bilt Dining' },
  { value: 'Blackbird', label: 'Blackbird' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCuisine,
  onCuisineChange,
  selectedNeighborhood,
  onNeighborhoodChange,
  openNowOnly,
  onToggleOpenNow,
  platformFilter,
  onPlatformFilterChange,
  sortMode,
  onSortModeChange,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedCuisine !== 'All' ||
    selectedNeighborhood !== 'All' ||
    openNowOnly ||
    platformFilter !== 'all';

  const selectBase =
    'rounded-lg text-xs font-medium px-2.5 py-1.5 border transition focus:outline-none focus:ring-1 focus:ring-emerald-400/60 cursor-pointer';

  return (
    <div className="sticky top-14 z-30 px-4 py-2.5 space-y-2 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/90">
      <div className="max-w-2xl mx-auto space-y-2">
        {/* Row 1: Search + Open Now + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search spot, dish, or area..."
              className="w-full pl-8 pr-8 py-1.5 bg-[#141923] border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-400/60 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onToggleOpenNow}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition active:scale-95 ${
              openNowOnly
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                : 'bg-[#141923] border-slate-700/80 text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Open</span>
          </button>

          <button
            onClick={() => onSortModeChange(sortMode === 'top-reward' ? 'closest' : 'top-reward')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#141923] border border-slate-700/80 text-slate-200 hover:text-white shrink-0 transition active:scale-95"
            title="Toggle sort order"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-400" />
            <span>{sortMode === 'top-reward' ? 'Top %' : 'Closest'}</span>
          </button>
        </div>

        {/* Row 2: Clean Dropdowns for Area, Cuisine, Program */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <select
            aria-label="Neighborhood"
            value={selectedNeighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value as Neighborhood)}
            className={`${selectBase} ${
              selectedNeighborhood !== 'All'
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                : 'bg-[#141923] border-slate-700/80 text-slate-200'
            }`}
          >
            {NEIGHBORHOODS.map((area) => (
              <option key={area} value={area} className="bg-[#141923] text-slate-100">
                {area === 'All' ? 'All Areas' : area}
              </option>
            ))}
          </select>

          <select
            aria-label="Cuisine"
            value={selectedCuisine}
            onChange={(e) => onCuisineChange(e.target.value as CuisineType)}
            className={`${selectBase} ${
              selectedCuisine !== 'All'
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                : 'bg-[#141923] border-slate-700/80 text-slate-200'
            }`}
          >
            {CUISINES.map((c) => (
              <option key={c} value={c} className="bg-[#141923] text-slate-100">
                {c === 'All' ? 'All Cuisines' : c}
              </option>
            ))}
          </select>

          <select
            aria-label="Rewards Program"
            value={platformFilter}
            onChange={(e) => onPlatformFilterChange(e.target.value)}
            className={`${selectBase} ${
              platformFilter !== 'all'
                ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                : 'bg-[#141923] border-slate-700/80 text-slate-200'
            }`}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value} className="bg-[#141923] text-slate-100">
                {p.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                onSearchChange('');
                onCuisineChange('All');
                onNeighborhoodChange('All');
                if (openNowOnly) onToggleOpenNow();
                onPlatformFilterChange('all');
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white shrink-0 transition"
              title="Reset filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
