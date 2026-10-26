import React from 'react';
import { Search, X, Clock, MapPin, ArrowDownUp } from 'lucide-react';
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
  'Williamsburg',
  'Greenpoint',
  'DUMBO & Heights',
  'Park Slope & Boerum Hill',
  'Bushwick',
  'Astoria',
  'Long Island City',
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
  return (
    <div className="px-4 py-3 space-y-2.5 bg-[#0c0c0e]/80 border-b border-white/[0.08]">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search restaurant, dish, or neighborhood..."
          className="w-full pl-10 pr-9 py-2.5 bg-[#141417] border border-white/[0.08] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/[0.25] transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row 1: Open Now + Sort + Platforms */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={onToggleOpenNow}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition active:scale-95 ${
            openNowOnly
              ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
              : 'bg-[#141417] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${openNowOnly ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <Clock className="w-3.5 h-3.5" />
          <span>Open Now</span>
        </button>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 bg-[#141417] border border-white/[0.08] rounded-lg p-0.5 shrink-0">
          <ArrowDownUp className="w-3 h-3 text-zinc-500 ml-1.5" />
          <button
            onClick={() => onSortModeChange('top-reward')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              sortMode === 'top-reward' ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Top Rewards
          </button>
          <button
            onClick={() => onSortModeChange('closest')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              sortMode === 'closest' ? 'bg-white/[0.1] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Closest
          </button>
        </div>

        <div className="h-4 w-px bg-white/[0.08] shrink-0" />

        {['all', 'inKind', 'Seated', 'Bilt', 'Blackbird'].map((platform) => {
          const isActive = platformFilter === platform;
          return (
            <button
              key={platform}
              onClick={() => onPlatformFilterChange(platform)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition active:scale-95 ${
                isActive
                  ? 'bg-zinc-100 text-zinc-950 border-white font-semibold'
                  : 'bg-[#141417] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {platform === 'all' ? 'All' : platform}
            </button>
          );
        })}
      </div>

      {/* Row 2: Cuisine Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 mr-1">
          Cuisine:
        </span>
        {CUISINES.map((cuisine) => {
          const isActive = selectedCuisine === cuisine;
          return (
            <button
              key={cuisine}
              onClick={() => onCuisineChange(cuisine)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-white/[0.12] text-white border border-white/[0.2] font-semibold'
                  : 'bg-[#141417] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
              }`}
            >
              {cuisine}
            </button>
          );
        })}
      </div>

      {/* Row 3: Neighborhood Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 mr-1 flex items-center gap-0.5">
          <MapPin className="w-2.5 h-2.5 text-zinc-500" /> Area:
        </span>
        {NEIGHBORHOODS.map((area) => {
          const isActive = selectedNeighborhood === area;
          return (
            <button
              key={area}
              onClick={() => onNeighborhoodChange(area)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-white/[0.12] text-white border border-white/[0.2] font-semibold'
                  : 'bg-[#141417] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
              }`}
            >
              {area}
            </button>
          );
        })}
      </div>
    </div>
  );
};
