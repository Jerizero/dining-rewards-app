import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { VenueCard } from './components/VenueCard';
import { HiddenPlacesModal } from './components/HiddenPlacesModal';
import { WalletModal } from './components/WalletModal';
import { UndoToast } from './components/UndoToast';
import { PresenceRadar } from './components/PresenceRadar';
import { VENUES, USER_CARDS } from './data/venues';
import { CuisineType, Neighborhood, SortMode, CardProfile } from './types';
import { isOpenNow, calculateDistance, calculateBestStack } from './utils/calculator';
import { getHiddenVenueIds, hideVenue, unhideVenue, resetHiddenVenues } from './utils/storage';
import { Utensils, RotateCcw } from 'lucide-react';

const CARDS_STORAGE_KEY = 'dining_arbitrage_cards_v1';

export const App: React.FC = () => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('All');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood>('All');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('top-reward');
  
  // Rent Day calculation (1st of current month)
  const isActualRentDay = new Date().getDate() === 1;
  const [isRentDay, setIsRentDay] = useState(isActualRentDay);

  // Hidden places & Toast
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [undoToast, setUndoToast] = useState<{ id: string; name: string } | null>(null);

  // Wallet Customizer Modal
  const [cards, setCards] = useState<CardProfile[]>(() => {
    try {
      const saved = localStorage.getItem(CARDS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : USER_CARDS;
    } catch {
      return USER_CARDS;
    }
  });
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Pagination / Virtual lazy slice for 1,300+ venues
  const [visibleCount, setVisibleCount] = useState(40);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(40);
  }, [
    searchQuery,
    selectedCuisine,
    selectedNeighborhood,
    openNowOnly,
    platformFilter,
    sortMode,
    isRentDay,
  ]);

  // Load hidden IDs on mount
  useEffect(() => {
    setHiddenIds(getHiddenVenueIds());
  }, []);

  // Save cards to storage
  const handleToggleCard = (cardId: string) => {
    setCards((prev) => {
      const updated = prev.map((c) =>
        c.id === cardId ? { ...c, enabled: c.enabled === false ? true : false } : c
      );
      try {
        localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Handle GPS location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationLoading(false);
        setSortMode('closest');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Default to Soho/West Village center for NYC testing
        setUserLocation({ lat: 40.7308, lng: -74.0000 });
        setLocationLoading(false);
        setSortMode('closest');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Hide action with Undo toast
  const handleHideVenue = (id: string) => {
    const venue = VENUES.find((v) => v.id === id);
    const updated = hideVenue(id);
    setHiddenIds(updated);
    if (venue) {
      setUndoToast({ id, name: venue.name });
    }
  };

  // Undo hide action
  const handleUndoHide = () => {
    if (undoToast) {
      const updated = unhideVenue(undoToast.id);
      setHiddenIds(updated);
      setUndoToast(null);
    }
  };

  // Unhide action
  const handleUnhideVenue = (id: string) => {
    const updated = unhideVenue(id);
    setHiddenIds(updated);
  };

  // Restore all hidden action
  const handleRestoreAll = () => {
    const updated = resetHiddenVenues();
    setHiddenIds(updated);
    setIsModalOpen(false);
  };

  // Filtered & Sorted Venues
  const filteredVenues = useMemo(() => {
    const result = VENUES.filter((venue) => {
      // 1. Exclude hidden venues
      if (hiddenIds.includes(venue.id)) return false;

      // 2. Open now check
      if (openNowOnly && !isOpenNow(venue.hours)) return false;

      // 3. Cuisine filter
      if (selectedCuisine !== 'All' && venue.cuisine !== selectedCuisine) return false;

      // 4. Neighborhood filter
      if (selectedNeighborhood !== 'All' && venue.neighborhood !== selectedNeighborhood) return false;

      // 5. Platform filter
      if (platformFilter === 'inKind' && !venue.inKind?.available) return false;
      if (platformFilter === 'Seated' && !venue.seated?.available) return false;
      if (platformFilter === 'Bilt' && !venue.bilt?.available) return false;
      if (platformFilter === 'Blackbird' && !venue.blackbird?.available) return false;

      // 6. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = venue.name.toLowerCase().includes(q);
        const matchesCuisine = venue.cuisine.toLowerCase().includes(q);
        const matchesArea = venue.neighborhood.toLowerCase().includes(q);
        const matchesTags = venue.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesDesc = venue.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCuisine && !matchesArea && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).map((venue) => {
      const dist = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, venue.lat, venue.lng)
        : undefined;
      const stack = calculateBestStack(venue, cards, isRentDay);
      return { venue, distance: dist, stack };
    });

    // Sorting
    result.sort((a, b) => {
      if (sortMode === 'closest') {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
      } else if (sortMode === 'top-reward') {
        return b.stack.rawPercentValue - a.stack.rawPercentValue;
      }
      return 0;
    });

    return result;
  }, [
    hiddenIds,
    openNowOnly,
    selectedCuisine,
    selectedNeighborhood,
    platformFilter,
    searchQuery,
    userLocation,
    cards,
    isRentDay,
    sortMode,
  ]);

  const hiddenVenuesList = useMemo(() => {
    return VENUES.filter((v) => hiddenIds.includes(v.id));
  }, [hiddenIds]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        userLocation={userLocation}
        locationLoading={locationLoading}
        onLocateMe={handleLocateMe}
        isRentDay={isRentDay}
        onToggleRentDay={() => setIsRentDay(!isRentDay)}
        hiddenCount={hiddenIds.length}
        onOpenHiddenModal={() => setIsModalOpen(true)}
        onOpenWalletModal={() => setIsWalletOpen(true)}
      />

      {/* Smart Filters Sticky Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCuisine={selectedCuisine}
        onCuisineChange={setSelectedCuisine}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodChange={setSelectedNeighborhood}
        openNowOnly={openNowOnly}
        onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
        platformFilter={platformFilter}
        onPlatformFilterChange={setPlatformFilter}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      {/* Main Feed */}
      <main className="flex-1 p-4 max-w-2xl w-full mx-auto pb-24">
        {/* Presence Detection & Live Location Radar */}
        <PresenceRadar
          venues={VENUES}
          userLocation={userLocation}
          onLocationUpdate={(loc) => {
            setUserLocation(loc);
          }}
          cards={cards}
          isRentDay={isRentDay}
        />

        <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 px-1">
          <span>
            Showing <strong className="text-zinc-200">{Math.min(visibleCount, filteredVenues.length)}</strong> of{' '}
            <strong className="text-zinc-200">{filteredVenues.length}</strong> spots
            {sortMode === 'closest' ? ' sorted by proximity' : ' sorted by highest reward'}
          </span>
          {openNowOnly && (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Open Now
            </span>
          )}
        </div>

        {filteredVenues.length === 0 ? (
          <div className="text-center py-16 px-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl mt-4">
            <Utensils className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No spots match your filters</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Try toggling off "Open Now", clearing your search, or unhiding spots.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCuisine('All');
                setSelectedNeighborhood('All');
                setOpenNowOnly(false);
                setPlatformFilter('all');
                setSortMode('top-reward');
              }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 rounded-xl transition inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredVenues.slice(0, visibleCount).map(({ venue, distance }) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                userCards={cards}
                isRentDay={isRentDay}
                distance={distance}
                onHideVenue={handleHideVenue}
              />
            ))}

            {filteredVenues.length > visibleCount && (
              <div className="pt-4 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 40, filteredVenues.length))}
                  className="w-full py-3.5 bg-[#141417] hover:bg-zinc-800 border border-white/[0.08] text-xs font-semibold tracking-wide uppercase text-zinc-300 hover:text-white rounded-xl transition active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    Load 40 More Spots ({Math.min(visibleCount, filteredVenues.length)} of {filteredVenues.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Undo Toast */}
      {undoToast && (
        <UndoToast
          message={`Hidden "${undoToast.name}"`}
          onUndo={handleUndoHide}
          onDismiss={() => setUndoToast(null)}
        />
      )}

      {/* Hidden Places Management Bottom Sheet */}
      <HiddenPlacesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hiddenVenues={hiddenVenuesList}
        onUnhide={handleUnhideVenue}
        onRestoreAll={handleRestoreAll}
      />

      {/* Wallet Settings Modal */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        cards={cards}
        onToggleCard={handleToggleCard}
      />
    </div>
  );
};
