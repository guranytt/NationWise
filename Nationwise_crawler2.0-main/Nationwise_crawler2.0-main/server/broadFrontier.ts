/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { FrontierUrl, DomainConfig } from './broadTypes';
import { GovernmentRelevanceClassifier } from './broadClassifier';

export class CrawlFrontierService {
  private static instance: CrawlFrontierService;

  private constructor() {
    this.ensureSchemaInitialized();
  }

  public static getInstance(): CrawlFrontierService {
    if (!CrawlFrontierService.instance) {
      CrawlFrontierService.instance = new CrawlFrontierService();
    }
    return CrawlFrontierService.instance;
  }

  /**
   * Safe initialization of data tables in JSON database if missing
   */
  private ensureSchemaInitialized() {
    const data = (db as any).data;
    if (!data.frontierUrls) {
      data.frontierUrls = [];
      db.save();
    }
    if (!data.domainConfigs) {
      data.domainConfigs = [];
      db.save();
    }
  }

  public getFrontierUrls(): FrontierUrl[] {
    this.ensureSchemaInitialized();
    return (db as any).data.frontierUrls || [];
  }

  public getDomainConfigs(): DomainConfig[] {
    this.ensureSchemaInitialized();
    return (db as any).data.domainConfigs || [];
  }

  /**
   * Helper to parse host domain from any standard web URL
   */
  public getDomainFromUrl(urlString: string): string {
    try {
      const parsed = new URL(urlString);
      return parsed.hostname.toLowerCase().replace('www.', '');
    } catch {
      return 'unknown_domain';
    }
  }

  /**
   * Adds a newly discovered URL to the Crawl Frontier
   */
  public addUrl(url: string, sourceUrl: string, crawlDepth: number = 1): FrontierUrl | null {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const cleanUrl = url.trim().replace(/\/$/, ''); // normalise trailing slash
    
    // 1. Duplicate URL prevention: check if URL exists in crawl log or frontier
    const alreadyExists = data.frontierUrls.some((u: FrontierUrl) => u.url.toLowerCase().replace(/\/$/, '') === cleanUrl.toLowerCase());
    const alreadyCrawled = db.getCrawlLogs().some(log => log.url.toLowerCase().replace(/\/$/, '') === cleanUrl.toLowerCase());
    
    if (alreadyExists || alreadyCrawled) {
      return null; // Suppress duplicate
    }

    const domain = this.getDomainFromUrl(cleanUrl);

    // 2. Governmental Relevance Classifier
    const { relevanceScore, confidenceScore } = GovernmentRelevanceClassifier.scoreUrlAndTitle(cleanUrl);
    
    // Set config-driven threshold (40 is ideal to avoid noise like advertisements/external widgets)
    if (relevanceScore < 40) {
      return null; // Filter non-relevant urls immediately
    }

    // 3. Dynamic Priority Calculation
    // Priority score penalises depth and rewards civic relevance
    const depthPenalty = Math.max(1, crawlDepth);
    const priorityScore = Math.round((relevanceScore * 10) / depthPenalty);

    // 4. Static vs Dynamic Routing Heuristics
    // PDFs and pages that look static are routed to 'static' fetch (standard fetch), while others are labeled
    const isStatic = cleanUrl.endsWith('.pdf') || 
                     cleanUrl.includes('/press-release') || 
                     cleanUrl.includes('/news/') ||
                     cleanUrl.endsWith('.txt');
    const fetchType = isStatic ? 'static' : 'dynamic';

    const newFrontierUrl: FrontierUrl = {
      id: `fr-${Math.random().toString(36).substr(2, 9)}`,
      url: cleanUrl,
      domain,
      discoveryTimestamp: new Date().toISOString(),
      sourceUrl,
      crawlDepth,
      priorityScore,
      relevanceScore,
      confidenceScore,
      crawlStatus: 'pending',
      retryCount: 0,
      fetchType
    };

    data.frontierUrls.push(newFrontierUrl);
    db.save();
    
    db.log('INFO', 'Crawl Frontier', `Discovered & queued URL [${newFrontierUrl.id}] (${cleanUrl}) | Priority: ${priorityScore} | Fetch: ${fetchType}`);
    
    // Ensure domain budget is configured
    this.getOrCreateDomainConfig(domain);

    return newFrontierUrl;
  }

  /**
   * Updates priority score of a queued URL dynamically
   */
  public updatePriority(id: string, newPriority: number) {
    this.ensureSchemaInitialized();
    const urls = this.getFrontierUrls();
    const index = urls.findIndex(u => u.id === id);
    if (index !== -1) {
      urls[index].priorityScore = newPriority;
      db.save();
    }
  }

  /**
   * Returns and blocks the next high-priority eligible URL for crawling
   * Respects politeness delays, budget caps, and domain balance rules
   */
  public dequeueUrl(): FrontierUrl | null {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const now = Date.now();

    // Filter for pending/queued jobs
    const candidates = (data.frontierUrls as FrontierUrl[])
      .filter(u => u.crawlStatus === 'pending')
      .sort((a, b) => b.priorityScore - a.priorityScore); // Highest priority first

    for (const urlItem of candidates) {
      const domain = urlItem.domain;
      const config = this.getOrCreateDomainConfig(domain);

      // Check daily budget
      if (config.pagesCrawledToday >= config.dailyBudget) {
        continue; // Exceeded daily budget for this domain
      }

      // Check depth limits
      if (urlItem.crawlDepth > config.maxDepth) {
        urlItem.crawlStatus = 'failed';
        urlItem.errorMessage = 'Exceeded domain maximum crawl depth limit';
        db.save();
        continue;
      }

      // Check politeness throttle (Crawl Delay + Concurrency limit)
      if (config.activeRequests >= config.concurrencyLimit) {
        continue; // Too many concurrent requests right now
      }

      const lastRequest = config.lastRequestTime ? new Date(config.lastRequestTime).getTime() : 0;
      const currentDelay = config.rateLimitMs + config.adaptiveDelayMs;
      
      if (now - lastRequest < currentDelay) {
        continue; // polite wait period has not expired yet
      }

      // URL approved for dispatching!
      urlItem.crawlStatus = 'processing';
      config.activeRequests++;
      config.lastRequestTime = new Date().toISOString();
      db.save();
      
      db.log('INFO', 'Crawl Frontier', `Dequeued URL [${urlItem.id}] for execution on domain "${domain}" (active: ${config.activeRequests})`);
      return urlItem;
    }

    return null;
  }

  /**
   * Marks a frontier URL as completed successfully
   */
  public markCrawled(id: string, responseSize: number = 0) {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const urlItem = (data.frontierUrls as FrontierUrl[]).find(u => u.id === id);
    
    if (urlItem) {
      urlItem.crawlStatus = 'completed';
      urlItem.lastCrawlTime = new Date().toISOString();
      
      // Update domain stats
      const config = this.getOrCreateDomainConfig(urlItem.domain);
      config.activeRequests = Math.max(0, config.activeRequests - 1);
      config.pagesCrawledToday++;
      
      // Politeness: adaptively decrease wait delays if healthy responses
      if (config.consecutiveErrors > 0) {
        config.consecutiveErrors = 0;
        config.adaptiveDelayMs = 0; // Reset backoff
      }
      
      db.save();
      db.log('SUCCESS', 'Crawl Frontier', `URL [${id}] marked completed successfully.`);
    }
  }

  /**
   * Marks a frontier URL as failed and schedules retries with adaptive backoff
   */
  public markFailed(id: string, errorMessage: string) {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const urlItem = (data.frontierUrls as FrontierUrl[]).find(u => u.id === id);

    if (urlItem) {
      // Update domain politeness
      const config = this.getOrCreateDomainConfig(urlItem.domain);
      config.activeRequests = Math.max(0, config.activeRequests - 1);
      config.consecutiveErrors++;
      
      // Adaptive backoff throttling: Double crawl delay for consecutive errors (cap at 60s)
      config.adaptiveDelayMs = Math.min(config.consecutiveErrors * 4000, 60000);

      urlItem.retryCount++;
      urlItem.errorMessage = errorMessage;
      urlItem.lastCrawlTime = new Date().toISOString();

      if (urlItem.retryCount >= 3) {
        urlItem.crawlStatus = 'failed';
        db.log('ERROR', 'Crawl Frontier', `URL [${id}] failed 3 attempts and moved to DLQ: ${errorMessage}`);
      } else {
        urlItem.crawlStatus = 'pending'; // Re-enqueue
        urlItem.priorityScore = Math.max(1, Math.round(urlItem.priorityScore * 0.7)); // Penalize priority
        db.log('WARN', 'Crawl Frontier', `URL [${id}] failed (attempt ${urlItem.retryCount}/3). Re-queued with priority penalty. Backoff active.`);
      }

      db.save();
    }
  }

  /**
   * Registers a domain with standard default configurations or gets existing config
   */
  public getOrCreateDomainConfig(domain: string): DomainConfig {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    let config = (data.domainConfigs as DomainConfig[]).find(c => c.domain === domain);

    if (!config) {
      config = {
        domain,
        dailyBudget: 250, // default page limit per domain daily
        pagesCrawledToday: 0,
        maxDepth: 3,
        rateLimitMs: 2000, // default 2s polite interval
        concurrencyLimit: 2,
        activeRequests: 0,
        consecutiveErrors: 0,
        adaptiveDelayMs: 0
      };
      data.domainConfigs.push(config);
      db.save();
      db.log('INFO', 'Crawl Frontier', `Configured default budget/rate limits for new domain: "${domain}"`);
    }

    return config;
  }

  /**
   * Resets daily crawlers budgets (usually executed by scheduler chronometer)
   */
  public resetDailyBudgets() {
    this.ensureSchemaInitialized();
    const configs = this.getDomainConfigs();
    configs.forEach(c => {
      c.pagesCrawledToday = 0;
    });
    db.save();
    db.log('INFO', 'Crawl Frontier', 'Reset daily crawl page budgets for all domains.');
  }

  /**
   * Aggregates live analytics for Dashboard
   */
  public getAnalytics() {
    this.ensureSchemaInitialized();
    const urls = this.getFrontierUrls();
    const domains = this.getDomainConfigs();

    const lowCount = urls.filter(u => u.relevanceScore < 40).length;
    const medCount = urls.filter(u => u.relevanceScore >= 40 && u.relevanceScore < 75).length;
    const highCount = urls.filter(u => u.relevanceScore >= 75).length;

    return {
      totalDiscovered: urls.length,
      pendingInFrontier: urls.filter(u => u.crawlStatus === 'pending').length,
      processingInFrontier: urls.filter(u => u.crawlStatus === 'processing').length,
      completedInFrontier: urls.filter(u => u.crawlStatus === 'completed').length,
      failedInFrontier: urls.filter(u => u.crawlStatus === 'failed').length,
      activeDomainsCount: domains.length,
      totalThroughputPages: domains.reduce((sum, d) => sum + d.pagesCrawledToday, 0),
      staticFetchCount: urls.filter(u => u.fetchType === 'static').length,
      dynamicFetchCount: urls.filter(u => u.fetchType === 'dynamic').length,
      relevanceDistribution: {
        high: highCount,
        medium: medCount,
        low: lowCount
      }
    };
  }
}

export const frontierService = CrawlFrontierService.getInstance();
export default frontierService;
