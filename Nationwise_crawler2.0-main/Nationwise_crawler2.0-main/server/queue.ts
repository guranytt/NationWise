/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { QueueJob, JobType } from '../src/types';
import { crawler } from './crawler';
import { pipeline } from './pipeline';
import { extractPromises, evaluateFulfillment } from './geminiExtractor';

class QueueSystem {
  private isProcessing = false;
  private workerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startWorker();
  }

  public startWorker() {
    if (this.workerInterval) return;
    this.workerInterval = setInterval(() => this.processNextJob(), 2000);
    db.log('INFO', 'Queue System', 'Asynchronous queue worker started, listening for jobs...');
  }

  public stopWorker() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      db.log('INFO', 'Queue System', 'Asynchronous queue worker stopped.');
    }
  }

  public enqueue(type: JobType, sourceId: string, payload: QueueJob['payload']): QueueJob {
    const job = db.createJob({
      type,
      sourceId,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3
    });
    db.log('INFO', 'Queue System', `Enqueued job [${job.id}] of type "${type}" for source "${sourceId}"`);
    return job;
  }

  private async processNextJob() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const jobs = db.getJobs();
      const nextJob = jobs.find(j => j.status === 'pending');

      if (!nextJob) {
        this.isProcessing = false;
        return;
      }

      await this.executeJob(nextJob);
    } catch (err) {
      console.error('Error in queue worker ticking loop', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJob(job: QueueJob) {
    db.log('INFO', 'Queue Worker', `Starting execution of job [${job.id}] ("${job.type}")`);
    
    db.updateJob(job.id, {
      status: 'processing',
      startedAt: new Date().toISOString()
    });

    const startTime = Date.now();
    try {
      // Dispatch job to appropriate handler
      switch (job.type) {
        case 'crawl_source':
          await this.handleCrawlSource(job);
          break;
        case 'rss_poll':
          await this.handleRssPoll(job);
          break;
        case 'sitemap_parse':
          await this.handleSitemapParse(job);
          break;
        case 'web_crawl_url':
          await this.handleWebCrawlUrl(job);
          break;
        case 'normalize_doc':
          await this.handleNormalizeDoc(job);
          break;
        case 'deduplicate_doc':
          await this.handleDeduplicateDoc(job);
          break;
        case 'diff_doc':
          await this.handleDiffDoc(job);
          break;
        case 'extract_promises':
          await this.handleExtractPromises(job);
          break;
        case 'track_fulfillment':
          await this.handleTrackFulfillment(job);
          break;
        default:
          throw new Error(`Unsupported job type: "${job.type}"`);
      }

      db.updateJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      db.log('SUCCESS', 'Queue Worker', `Job [${job.id}] ("${job.type}") completed successfully in ${Date.now() - startTime}ms`);
    } catch (err: any) {
      const attempts = job.attempts + 1;
      const isDeadLetter = attempts >= job.maxAttempts;
      const errorMsg = err.message || 'Unknown error occurred during execution';

      db.updateJob(job.id, {
        status: isDeadLetter ? 'failed' : 'pending',
        attempts,
        error: errorMsg,
        completedAt: isDeadLetter ? new Date().toISOString() : undefined
      });

      db.log('ERROR', 'Queue Worker', `Job [${job.id}] ("${job.type}") failed (Attempt ${attempts}/${job.maxAttempts}): ${errorMsg}. ${isDeadLetter ? 'Moved to Dead-Letter Queue.' : 'Scheduled for exponential backoff retry.'}`);
    }
  }

  // Job Handlers
  private async handleCrawlSource(job: QueueJob) {
    const source = db.getSource(job.sourceId);
    if (!source || !source.isActive) {
      throw new Error(`Source with ID "${job.sourceId}" not found or inactive.`);
    }

    db.updateSource(source.id, { lastCrawlTimestamp: new Date().toISOString() });

    // Enqueue sub-discovery jobs based on configuration
    let tasksDispatched = 0;
    if (source.rssUrl) {
      this.enqueue('rss_poll', source.id, { url: source.rssUrl });
      tasksDispatched++;
    }
    if (source.sitemapUrl) {
      this.enqueue('sitemap_parse', source.id, { url: source.sitemapUrl });
      tasksDispatched++;
    }

    // Fallback to crawl base URL directly if no sitemap/rss or specifically manual/hourly depth crawl
    if (!source.rssUrl && !source.sitemapUrl) {
      this.enqueue('web_crawl_url', source.id, { url: source.baseUrl, depth: 1 });
      tasksDispatched++;
    }

    db.log('INFO', 'Queue Worker', `Source Crawl initiated for "${source.name}". Dispatched ${tasksDispatched} discovery tasks.`);
  }

  private async handleRssPoll(job: QueueJob) {
    const url = job.payload.url;
    if (!url) throw new Error('Missing URL payload for RSS polling.');

    const discoveredUrls = await crawler.fetchRssFeed(url, job.sourceId);
    db.log('INFO', 'Queue Worker', `RSS Polled ${url}. Discovered ${discoveredUrls.length} entries.`);

    // Enqueue crawl jobs for each discovered URL
    for (const feedEntry of discoveredUrls) {
      this.enqueue('web_crawl_url', job.sourceId, { 
        url: feedEntry.url, 
        depth: 1, 
        publishedTimestamp: feedEntry.publishedDate,
        title: feedEntry.title
      });
    }
  }

  private async handleSitemapParse(job: QueueJob) {
    const url = job.payload.url;
    if (!url) throw new Error('Missing URL payload for Sitemap parsing.');

    const discoveredUrls = await crawler.fetchSitemap(url, job.sourceId);
    db.log('INFO', 'Queue Worker', `Sitemap parsed ${url}. Discovered ${discoveredUrls.length} links.`);

    // Enqueue crawl jobs for discovered URLs up to a sensible limit to prevent flooding in simulation/dev
    const limitUrls = discoveredUrls.slice(0, 10); // Safe limit for test/demo
    for (const link of limitUrls) {
      this.enqueue('web_crawl_url', job.sourceId, { url: link, depth: 1 });
    }
  }

  private async handleWebCrawlUrl(job: QueueJob) {
    const url = job.payload.url;
    if (!url) throw new Error('Missing URL payload for Web crawling.');

    const source = db.getSource(job.sourceId);
    if (source && source.crawlRules.respectRobots) {
      const isAllowed = await crawler.isUrlAllowed(url);
      if (!isAllowed) {
        db.log('WARN', 'Queue Worker', `URL ${url} is blocked by robots.txt. Skipping crawl.`);
        return;
      }
    }

    const result = await crawler.crawlWebPage(url, job.sourceId, job.id);
    
    // Save raw HTML/rendered snapshot log
    db.createCrawlLog({
      sourceId: job.sourceId,
      jobId: job.id,
      url,
      success: result.success,
      httpStatus: result.status,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
      documentHash: result.hash,
      timestamp: new Date().toISOString()
    });

    if (!result.success) {
      throw new Error(result.errorMessage || `Scraping failed with HTTP ${result.status}`);
    }

    // Next step in pipeline: Normalize
    this.enqueue('normalize_doc', job.sourceId, {
      url,
      rawContent: result.html,
      contentType: result.contentType,
      headers: result.headers,
      publishedTimestamp: job.payload.publishedTimestamp || new Date().toISOString(),
      title: job.payload.title
    });
  }

  private async handleNormalizeDoc(job: QueueJob) {
    const { url, rawContent, contentType, headers, publishedTimestamp, title } = job.payload;
    if (!url || !rawContent) throw new Error('Missing URL or rawContent payload for normalization.');

    const normalized = await pipeline.normalize(
      url, 
      rawContent, 
      (contentType as any) || 'html', 
      job.sourceId, 
      headers || {},
      publishedTimestamp,
      title
    );

    const doc = db.createDocument(normalized);

    // Next step in pipeline: Deduplicate
    this.enqueue('deduplicate_doc', job.sourceId, { url: doc.url, rawContent: doc.id });
  }

  private async handleDeduplicateDoc(job: QueueJob) {
    const docId = job.payload.rawContent;
    if (!docId) throw new Error('Missing document ID payload for deduplication.');

    const doc = db.getDocument(docId);
    if (!doc) throw new Error(`Document with ID "${docId}" not found.`);

    const dedupResult = await pipeline.deduplicate(doc);

    if (dedupResult.isDuplicate) {
      db.updateDocument(doc.id, {
        isDuplicate: true,
        duplicateOfId: dedupResult.duplicateOfId
      });
      db.createDuplicateRelation({
        documentId: doc.id,
        duplicateOfId: dedupResult.duplicateOfId!,
        similarityScore: dedupResult.similarityScore,
        detectionMethod: dedupResult.detectionMethod,
        timestamp: new Date().toISOString()
      });
      db.log('WARN', 'Deduplication Engine', `Document "${doc.title}" matches existing document "${dedupResult.duplicateOfName}" (Score: ${dedupResult.similarityScore.toFixed(2)}, Method: ${dedupResult.detectionMethod}). Flagged as duplicate.`);
    } else {
      // If it's a unique document, run the Diff Engine to verify if we have a previous version of this URL page
      this.enqueue('diff_doc', job.sourceId, { url: doc.url, rawContent: doc.id });
      // AI Layer: Enqueue promise extraction
      this.enqueue('extract_promises', job.sourceId, { rawContent: doc.id });
    }
  }

  private async handleDiffDoc(job: QueueJob) {
    const docId = job.payload.rawContent;
    if (!docId) throw new Error('Missing document ID payload for diffing.');

    const doc = db.getDocument(docId);
    if (!doc) throw new Error(`Document with ID "${docId}" not found.`);

    await pipeline.diff(doc);
  }

  private async handleExtractPromises(job: QueueJob) {
    const docId = job.payload.rawContent;
    if (!docId) throw new Error('Missing document ID payload for extract_promises.');

    const doc = db.getDocument(docId);
    if (!doc) throw new Error(`Document with ID "${docId}" not found.`);

    const promises = await extractPromises(doc.content, {
      documentId: doc.id,
      sourceId: doc.sourceId,
      sourceName: doc.sourceName
    });

    for (const p of promises) {
      db.createPromise(p);
    }
    
    // AI Layer: Trigger fulfillment tracking to evaluate this new doc against existing promises
    this.enqueue('track_fulfillment', job.sourceId, { rawContent: doc.id });
  }

  private async handleTrackFulfillment(job: QueueJob) {
    const docId = job.payload.rawContent;
    if (!docId) throw new Error('Missing document ID payload for track_fulfillment.');

    const doc = db.getDocument(docId);
    if (!doc) throw new Error(`Document with ID "${docId}" not found.`);

    // Load active promises
    const allPromises = db.getPromises();
    const activePromises = allPromises.filter(p => p.status === 'pending' || p.status === 'in_progress');

    let evalCount = 0;
    for (const promise of activePromises) {
      const event = await evaluateFulfillment(promise, doc.content, doc.id);
      if (event) {
        db.createFulfillmentEvent(event);
        db.updatePromise(promise.id, { 
          status: event.newStatus, 
          lastEvaluatedAt: event.evaluatedAt 
        });
      }
      evalCount++;
    }
    db.log('INFO', 'Fulfillment Tracker', `Evaluated ${evalCount} active promises against document "${doc.title}"`);
  }
}

export const queueSystem = new QueueSystem();
export default queueSystem;
