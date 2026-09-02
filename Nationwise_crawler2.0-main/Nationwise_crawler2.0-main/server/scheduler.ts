/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { queueSystem } from './queue';
import { Source } from '../src/types';

class SchedulerSystem {
  private tickInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.start();
  }

  public start() {
    if (this.tickInterval) return;
    this.tickInterval = setInterval(() => this.checkSchedules(), 10000); // Check every 10 seconds in background
    db.log('INFO', 'Scheduler', 'System scheduler initialized. Checking active sources for crawl times.');
  }

  public stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
      db.log('INFO', 'Scheduler', 'System scheduler stopped.');
    }
  }

  private checkSchedules() {
    const sources = db.getSources().filter(s => s.isActive);
    const now = new Date();

    sources.forEach(src => {
      if (this.isCrawlDue(src, now)) {
        db.log('INFO', 'Scheduler', `Source "${src.name}" is due for a crawl. Dispatching queue job.`);
        queueSystem.enqueue('crawl_source', src.id, {});
      }
    });
  }

  private isCrawlDue(source: Source, now: Date): boolean {
    if (!source.lastCrawlTimestamp) {
      return true; // Never crawled, crawl immediately
    }

    const lastCrawl = new Date(source.lastCrawlTimestamp);
    const msSinceLastCrawl = now.getTime() - lastCrawl.getTime();

    switch (source.crawlFrequency) {
      case 'hourly':
        return msSinceLastCrawl >= 60 * 60 * 1000; // 1 hour
      case 'daily':
        return msSinceLastCrawl >= 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return msSinceLastCrawl >= 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'manual':
      default:
        return false; // Only triggered manually in UI
    }
  }

  // Support manual trigger immediately
  public triggerManualCrawl(sourceId: string): boolean {
    const source = db.getSource(sourceId);
    if (!source) {
      db.log('ERROR', 'Scheduler', `Failed to manually trigger crawl: Source [${sourceId}] not found.`);
      return false;
    }

    db.log('INFO', 'Scheduler', `Manually triggered crawl job for source: "${source.name}"`);
    queueSystem.enqueue('crawl_source', source.id, {});
    return true;
  }
}

export const scheduler = new SchedulerSystem();
export default scheduler;
