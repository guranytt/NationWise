/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SourceType =
  | 'government_website'
  | 'ministry_portal'
  | 'press_releases'
  | 'policy_page'
  | 'manifesto_document';

export type CrawlPriority = 'high' | 'medium' | 'low';
export type CrawlFrequency = 'hourly' | 'daily' | 'weekly' | 'manual';

export interface Source {
  id: string;
  name: string;
  baseUrl: string;
  sourceType: SourceType;
  crawlFrequency: CrawlFrequency;
  crawlPriority: CrawlPriority;
  sitemapUrl?: string;
  rssUrl?: string;
  crawlRules: {
    maxDepth: number;
    allowlist: string[];
    blocklist: string[];
    respectRobots: boolean;
    rateLimitMs: number;
  };
  isActive: boolean;
  lastCrawlTimestamp?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobType =
  | 'crawl_source'
  | 'rss_poll'
  | 'sitemap_parse'
  | 'web_crawl_url'
  | 'normalize_doc'
  | 'deduplicate_doc'
  | 'diff_doc'
  | 'extract_promises'
  | 'track_fulfillment';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueJob {
  id: string;
  type: JobType;
  sourceId: string;
  payload: {
    url?: string;
    depth?: number;
    rawContent?: string;
    contentType?: string;
    headers?: Record<string, string>;
    publishedTimestamp?: string;
    title?: string;
  };
  status: JobStatus;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CrawlLog {
  id: string;
  sourceId: string;
  jobId: string;
  url: string;
  success: boolean;
  httpStatus: number;
  responseTimeMs: number;
  errorMessage?: string;
  documentHash?: string;
  timestamp: string;
}

export type ContentType = 'html' | 'pdf' | 'scanned_pdf' | 'text';

export interface NormalizedDocument {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  url: string;
  fetchedTimestamp: string;
  publishedTimestamp?: string;
  content: string;
  contentType: ContentType;
  language: string;
  documentHash: string;
  crawlStatus: 'raw' | 'normalized' | 'indexed';
  relevanceScore: number; // For civic accountability focus
  isDuplicate: boolean;
  duplicateOfId?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  title: string;
  content: string;
  documentHash: string;
  timestamp: string;
  versionNumber: number;
}

export interface PageDiff {
  id: string;
  documentId: string;
  previousVersionId: string;
  currentVersionId: string;
  diffContent: string; // Stored as diff-match-patch visual info or JSON structures
  addedLinesCount: number;
  removedLinesCount: number;
  timestamp: string;
}

export interface DuplicateRelation {
  id: string;
  documentId: string;
  duplicateOfId: string;
  similarityScore: number;
  detectionMethod: 'exact_hash' | 'url_match' | 'text_similarity';
  timestamp: string;
}

export interface SystemMetrics {
  totalCrawls: number;
  successRate: number;
  activeJobsCount: number;
  pendingJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  sourceHealth: Record<string, 'healthy' | 'failing' | 'unknown'>;
  documentsIngested: number;
  duplicatesDetected: number;
  changesDetected: number;
}

export type PromiseCategory =
  | 'infrastructure'
  | 'education'
  | 'health'
  | 'economy'
  | 'security'
  | 'governance'
  | 'agriculture'
  | 'energy'
  | 'technology_digital'
  | 'youth_employment'
  | 'other';

export type PromiseStatus = 'pending' | 'in_progress' | 'fulfilled' | 'broken' | 'stalled';

export interface PoliticalPromise {
  id: string;
  documentId: string;
  sourceId: string;
  sourceName: string;
  title: string;
  description: string;
  category: PromiseCategory;
  attributedTo: string; // The specific person who made the promise
  promiseDate: string;
  targetDate?: string;
  budgetAmount?: string;
  status: PromiseStatus;
  confidenceScore: number;
  extractedAt: string;
  lastEvaluatedAt?: string;
}

export interface FulfillmentEvent {
  id: string;
  promiseId: string;
  documentId: string;
  previousStatus: PromiseStatus;
  newStatus: PromiseStatus;
  evidence: string;
  reasoning: string;
  confidenceScore: number;
  evaluatedAt: string;
}
