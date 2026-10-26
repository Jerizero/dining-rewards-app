export type CuisineType = 
  | 'All'
  | 'Italian'
  | 'Japanese'
  | 'American'
  | 'French'
  | 'Mexican'
  | 'Mediterranean'
  | 'Korean'
  | 'Cocktails & Bar'
  | 'Bakery & Coffee';

export type Neighborhood =
  | 'All'
  | 'West Village'
  | 'SoHo'
  | 'East Village'
  | 'Lower East Side'
  | 'Williamsburg'
  | 'Flatiron'
  | 'Flatiron & NoMad'
  | 'Nolita'
  | 'Chelsea'
  | 'Greenpoint'
  | 'Midtown'
  | "Hell's Kitchen"
  | 'Upper East Side'
  | 'Upper West Side'
  | 'Tribeca & FiDi'
  | 'DUMBO & Heights'
  | 'Park Slope & Boerum Hill'
  | 'Bushwick'
  | 'Astoria'
  | 'Long Island City'
  | 'Harlem'
  | 'Brooklyn'
  | 'Queens'
  | 'The Bronx'
  | 'Staten Island'
  | (string & {});

export type SortMode = 'top-reward' | 'closest' | 'price-asc' | 'name';

export interface OperatingHours {
  days: number[];
  openHour: number;
  closeHour: number;
}

export interface InKindReward {
  available: boolean;
  bonusPercentage: number;
  tierNote?: string;
}

export interface SeatedReward {
  available: boolean;
  rewardPercentage: number;
  bookingRequired: boolean;
  notes?: string;
}

export interface BiltReward {
  available: boolean;
  baseMultiplier: number;
  isNeighborhoodPartner: boolean;
}

export interface BlackbirdReward {
  available: boolean;
  flyEarn: number;
  perkTitle?: string;
  hasResyHook?: boolean;
  hasOpenTableHook?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  neighborhood: Neighborhood;
  address: string;
  lat: number;
  lng: number;
  cuisine: CuisineType;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  description: string;
  hours: OperatingHours[];
  inKind?: InKindReward;
  seated?: SeatedReward;
  bilt?: BiltReward;
  blackbird?: BlackbirdReward;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  bookingUrl?: string;
}

export interface CardProfile {
  id: string;
  name: string;
  diningMultiplier: number;
  rentDayMultiplier?: number;
  pointType: 'Amex MR' | 'Chase UR' | 'Bilt Points' | 'Cash Back' | 'CapOne Miles';
  enabled?: boolean;
}

export interface Recommendation {
  primaryPlatform: 'inKind' | 'Seated' | 'Bilt' | 'Blackbird' | 'Direct Card';
  headline: string;
  effectiveValue: string;
  rawPercentValue: number; // For sorting by highest yield
  recommendedCard: string;
  details: string[];
}
