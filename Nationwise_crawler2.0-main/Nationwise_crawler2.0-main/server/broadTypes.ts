/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FrontierUrl {
  id: string;
  url: string;
  domain: string;
  discoveryTimestamp: string;
  sourceUrl: string; // The URL where this link was discovered
  crawlDepth: number;
  priorityScore: number; // (relevanceScore * priority weight) / depth
  relevanceScore: number; // 0-100 score on civic accountability relevance
  confidenceScore: number; // 0-100 classifier confidence
  crawlStatus: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  lastCrawlTime?: string;
  errorMessage?: string;
  fetchType: 'static' | 'dynamic';
}

export interface DomainConfig {
  domain: string;
  dailyBudget: number;
  pagesCrawledToday: number;
  maxDepth: number;
  rateLimitMs: number; // Crawl delay in ms
  concurrencyLimit: number;
  activeRequests: number;
  consecutiveErrors: number;
  adaptiveDelayMs: number; // Multiplier on rateLimitMs based on error state
  lastRequestTime?: string;
}

export interface PoliticalEntity {
  id: string;
  name: string;
  type: 'politician' | 'ministry' | 'agency' | 'program' | 'local_gov';
  status: 'pending' | 'approved' | 'rejected';
  discoveredSources: DiscoveredSeedSource[];
}

export interface DiscoveredSeedSource {
  id: string;
  title: string;
  url: string;
  relevance: number;
  confidence: number;
  reason: string;
  discoveredAt: string;
}

export interface BroadCrawlAnalytics {
  totalDiscovered: number;
  pendingInFrontier: number;
  processingInFrontier: number;
  completedInFrontier: number;
  failedInFrontier: number;
  activeDomainsCount: number;
  totalThroughputPages: number;
  staticFetchCount: number;
  dynamicFetchCount: number;
  relevanceDistribution: {
    high: number;    // >= 75
    medium: number;  // 40-74
    low: number;     // < 40
  };
}
