export interface Extension {
  id: string;
  extensionId: string;
  publisherName: string;
  extensionName: string;
  displayName: string;
  marketplaceUrl: string;
  iconUrl?: string;
  averageRating?: number;
  ratingCount?: number;
  downloadCount?: number;
  lastUpdated?: string;
  currentVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallStat {
  id: string;
  extensionId: string;
  installCount: number;
  recordedAt: string;
  createdAt: string;
}

export interface ExtensionWithStats extends Extension {
  currentInstalls: number;
  trend: number;
  stats: InstallStat[];
  ratingStats?: RatingStat[];
}

export interface RatingStat {
  id: string;
  extensionId: string;
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  recordedAt: string;
  createdAt: string;
}

export type TimeRange = 'day' | 'week' | 'month' | 'all';

export interface ChartDataPoint {
  date: string;
  installs: number;
}