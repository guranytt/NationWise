/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Source, QueueJob, CrawlLog, NormalizedDocument, DocumentVersion, PageDiff, DuplicateRelation, SystemMetrics, PoliticalPromise, FulfillmentEvent } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'civic.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const OLD_DB_FILE = path.join(DATA_DIR, 'db.json');
if (fs.existsSync(OLD_DB_FILE)) {
  try { fs.unlinkSync(OLD_DB_FILE); } catch(e) {}
}

const DEFAULT_SOURCES: Source[] = [
  {
    id: 'src-statehouse',
    name: 'State House, Abuja',
    baseUrl: 'https://statehouse.gov.ng',
    sourceType: 'government_website',
    crawlFrequency: 'hourly',
    crawlPriority: 'high',
    sitemapUrl: 'https://statehouse.gov.ng/sitemap_index.xml',
    rssUrl: 'https://statehouse.gov.ng/feed/',
    crawlRules: {
      maxDepth: 3,
      allowlist: ['/news', '/speeches', '/press-releases', '/statements'],
      blocklist: ['/wp-content', '/category', '/tag'],
      respectRobots: true,
      rateLimitMs: 1500
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'src-budget',
    name: 'Budget Office of the Federation',
    baseUrl: 'https://www.budgetoffice.gov.ng',
    sourceType: 'policy_page',
    crawlFrequency: 'daily',
    crawlPriority: 'high',
    sitemapUrl: 'https://www.budgetoffice.gov.ng/sitemap.xml',
    crawlRules: {
      maxDepth: 2,
      allowlist: ['/index.php/resources', '/index.php/documents', '/index.php/reports'],
      blocklist: [],
      respectRobots: true,
      rateLimitMs: 2000
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'src-finance',
    name: 'Federal Ministry of Finance',
    baseUrl: 'https://www.finance.gov.ng',
    sourceType: 'ministry_portal',
    crawlFrequency: 'daily',
    crawlPriority: 'medium',
    sitemapUrl: 'https://www.finance.gov.ng/sitemap.xml',
    crawlRules: {
      maxDepth: 2,
      allowlist: ['/news', '/publications', '/speeches'],
      blocklist: [],
      respectRobots: true,
      rateLimitMs: 2000
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'src-inec',
    name: 'INEC Nigeria',
    baseUrl: 'https://www.inecnigeria.org',
    sourceType: 'manifesto_document',
    crawlFrequency: 'weekly',
    crawlPriority: 'medium',
    sitemapUrl: 'https://www.inecnigeria.org/sitemap.xml',
    crawlRules: {
      maxDepth: 2,
      allowlist: ['/resources', '/news', '/elections'],
      blocklist: [],
      respectRobots: true,
      rateLimitMs: 3000
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class CivicDatabase {
  private db: Database.Database;
  private broadCrawlDataFile = path.join(DATA_DIR, 'broad_crawl.json');
  public data: any = {};

  constructor() {
    this.db = new Database(DB_FILE);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
    this.seedDefaults();
    this.loadBroadCrawlData();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS queueJobs (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS crawlLogs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS documentVersions (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL,
        versionNumber INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pageDiffs (
        id TEXT PRIMARY KEY,
        documentId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS duplicateRelations (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS auditLogs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS promises (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS fulfillmentEvents (
        id TEXT PRIMARY KEY,
        promiseId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL
      );
    `);
  }

  private seedDefaults() {
    const count = this.db.prepare('SELECT count(*) as c FROM sources').get() as { c: number };
    if (count.c === 0) {
      const insert = this.db.prepare('INSERT INTO sources (id, data) VALUES (?, ?)');
      const tx = this.db.transaction(() => {
        for (const src of DEFAULT_SOURCES) {
          insert.run(src.id, JSON.stringify(src));
        }
      });
      tx();
      this.log('SUCCESS', 'Database', 'Initialized default database with seeded government sources.');
    }
  }

  private loadBroadCrawlData() {
    if (fs.existsSync(this.broadCrawlDataFile)) {
      try {
        this.data = JSON.parse(fs.readFileSync(this.broadCrawlDataFile, 'utf8'));
      } catch (e) {
        this.data = {};
      }
    } else {
      this.data = {};
    }
  }

  // Save method handles saving broad crawl data to JSON file
  public save() {
    try {
      fs.writeFileSync(this.broadCrawlDataFile, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      this.log('ERROR', 'Database', 'Failed to save broad crawl JSON data.');
    }
  }

  // Audit Logs
  public log(level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR', module: string, message: string) {
    const id = `log-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const newLog = { id, timestamp, level, module, message };
    
    this.db.prepare('INSERT INTO auditLogs (id, timestamp, data) VALUES (?, ?, ?)').run(id, timestamp, JSON.stringify(newLog));
    
    // Prune logs keeping last 1000
    this.db.prepare('DELETE FROM auditLogs WHERE id NOT IN (SELECT id FROM auditLogs ORDER BY timestamp DESC LIMIT 1000)').run();
    console.log(`[${timestamp}] [${level}] [${module}] ${message}`);
  }

  public getAuditLogs(): any[] {
    const rows = this.db.prepare('SELECT data FROM auditLogs ORDER BY timestamp DESC').all();
    return rows.map((r: any) => JSON.parse(r.data));
  }

  // Sources CRUD
  public getSources(): Source[] {
    return this.db.prepare('SELECT data FROM sources').all().map((r: any) => JSON.parse(r.data));
  }

  public getSource(id: string): Source | undefined {
    const row = this.db.prepare('SELECT data FROM sources WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  public createSource(source: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>): Source {
    const newSource: Source = {
      ...source,
      id: `src-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.db.prepare('INSERT INTO sources (id, data) VALUES (?, ?)').run(newSource.id, JSON.stringify(newSource));
    this.log('SUCCESS', 'Source Registry', `Registered new approved source: "${newSource.name}" (${newSource.baseUrl})`);
    return newSource;
  }

  public updateSource(id: string, updates: Partial<Omit<Source, 'id' | 'createdAt' | 'updatedAt'>>): Source | undefined {
    const source = this.getSource(id);
    if (!source) return undefined;

    const updatedSource = {
      ...source,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.db.prepare('UPDATE sources SET data = ? WHERE id = ?').run(JSON.stringify(updatedSource), id);
    this.log('INFO', 'Source Registry', `Updated source configuration for: "${updatedSource.name}"`);
    return updatedSource;
  }

  public deleteSource(id: string): boolean {
    const result = this.db.prepare('DELETE FROM sources WHERE id = ?').run(id);
    const deleted = result.changes > 0;
    if (deleted) {
      this.log('WARN', 'Source Registry', `Deleted source with ID: ${id}`);
    }
    return deleted;
  }

  // Queue Jobs
  public getJobs(): QueueJob[] {
    return this.db.prepare('SELECT data FROM queueJobs').all().map((r: any) => JSON.parse(r.data));
  }

  public getJob(id: string): QueueJob | undefined {
    const row = this.db.prepare('SELECT data FROM queueJobs WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  public createJob(job: Omit<QueueJob, 'id' | 'createdAt'>): QueueJob {
    const newJob: QueueJob = {
      ...job,
      id: `job-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    this.db.prepare('INSERT INTO queueJobs (id, data) VALUES (?, ?)').run(newJob.id, JSON.stringify(newJob));
    return newJob;
  }

  public updateJob(id: string, updates: Partial<Omit<QueueJob, 'id' | 'createdAt'>>): QueueJob | undefined {
    const job = this.getJob(id);
    if (!job) return undefined;
    const updatedJob = { ...job, ...updates };
    this.db.prepare('UPDATE queueJobs SET data = ? WHERE id = ?').run(JSON.stringify(updatedJob), id);
    return updatedJob;
  }

  public clearJobs() {
    const jobs = this.getJobs();
    const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
    this.db.prepare('DELETE FROM queueJobs').run();
    const insert = this.db.prepare('INSERT INTO queueJobs (id, data) VALUES (?, ?)');
    const tx = this.db.transaction(() => {
      for (const job of activeJobs) {
        insert.run(job.id, JSON.stringify(job));
      }
    });
    tx();
    this.log('INFO', 'Queue System', 'Cleared historical completed/failed jobs from queue registry.');
  }

  // Crawl Logs
  public getCrawlLogs(): CrawlLog[] {
    return this.db.prepare('SELECT data FROM crawlLogs ORDER BY timestamp DESC').all().map((r: any) => JSON.parse(r.data));
  }

  public createCrawlLog(log: Omit<CrawlLog, 'id'>): CrawlLog {
    const newLog: CrawlLog = {
      ...log,
      id: `clog-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO crawlLogs (id, timestamp, data) VALUES (?, ?, ?)').run(newLog.id, newLog.timestamp, JSON.stringify(newLog));
    
    // Maintain max 500 logs
    this.db.prepare('DELETE FROM crawlLogs WHERE id NOT IN (SELECT id FROM crawlLogs ORDER BY timestamp DESC LIMIT 500)').run();
    return newLog;
  }

  // Documents CRUD
  public getDocuments(): NormalizedDocument[] {
    return this.db.prepare('SELECT data FROM documents').all().map((r: any) => JSON.parse(r.data));
  }

  public getDocument(id: string): NormalizedDocument | undefined {
    const row = this.db.prepare('SELECT data FROM documents WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  public createDocument(doc: Omit<NormalizedDocument, 'id'>): NormalizedDocument {
    const newDoc: NormalizedDocument = {
      ...doc,
      id: `doc-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO documents (id, data) VALUES (?, ?)').run(newDoc.id, JSON.stringify(newDoc));
    this.log('SUCCESS', 'Document Processing', `Ingested & Normalized document: "${newDoc.title}" from ${newDoc.url}`);
    return newDoc;
  }

  public updateDocument(id: string, updates: Partial<Omit<NormalizedDocument, 'id'>>): NormalizedDocument | undefined {
    const doc = this.getDocument(id);
    if (!doc) return undefined;
    const updatedDoc = { ...doc, ...updates };
    this.db.prepare('UPDATE documents SET data = ? WHERE id = ?').run(JSON.stringify(updatedDoc), id);
    return updatedDoc;
  }

  // Document Versions
  public getVersions(documentId: string): DocumentVersion[] {
    return this.db.prepare('SELECT data FROM documentVersions WHERE documentId = ? ORDER BY versionNumber DESC').all(documentId).map((r: any) => JSON.parse(r.data));
  }

  public createVersion(version: Omit<DocumentVersion, 'id'>): DocumentVersion {
    const newVersion: DocumentVersion = {
      ...version,
      id: `ver-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO documentVersions (id, documentId, versionNumber, data) VALUES (?, ?, ?, ?)').run(newVersion.id, newVersion.documentId, newVersion.versionNumber, JSON.stringify(newVersion));
    return newVersion;
  }

  // Diffs
  public getDiffs(documentId: string): PageDiff[] {
    return this.db.prepare('SELECT data FROM pageDiffs WHERE documentId = ? ORDER BY timestamp DESC').all(documentId).map((r: any) => JSON.parse(r.data));
  }

  public createDiff(diff: Omit<PageDiff, 'id'>): PageDiff {
    const newDiff: PageDiff = {
      ...diff,
      id: `diff-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO pageDiffs (id, documentId, timestamp, data) VALUES (?, ?, ?, ?)').run(newDiff.id, newDiff.documentId, newDiff.timestamp, JSON.stringify(newDiff));
    return newDiff;
  }

  // Duplicate Relations
  public getDuplicateRelations(): DuplicateRelation[] {
    return this.db.prepare('SELECT data FROM duplicateRelations').all().map((r: any) => JSON.parse(r.data));
  }

  public createDuplicateRelation(relation: Omit<DuplicateRelation, 'id'>): DuplicateRelation {
    const newRel: DuplicateRelation = {
      ...relation,
      id: `dup-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO duplicateRelations (id, data) VALUES (?, ?)').run(newRel.id, JSON.stringify(newRel));
    return newRel;
  }

  // --- PROMISES AND FULFILLMENT ---
  
  public getPromises(): PoliticalPromise[] {
    return this.db.prepare('SELECT data FROM promises').all().map((r: any) => JSON.parse(r.data));
  }

  public getPromise(id: string): PoliticalPromise | undefined {
    const row = this.db.prepare('SELECT data FROM promises WHERE id = ?').get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  }

  public createPromise(promise: Omit<PoliticalPromise, 'id'>): PoliticalPromise {
    const newPromise: PoliticalPromise = {
      ...promise,
      id: `prom-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO promises (id, status, data) VALUES (?, ?, ?)').run(newPromise.id, newPromise.status, JSON.stringify(newPromise));
    this.log('SUCCESS', 'Promise Extraction', `Extracted new promise: "${newPromise.title}" attributed to ${newPromise.attributedTo}`);
    return newPromise;
  }

  public updatePromise(id: string, updates: Partial<PoliticalPromise>): PoliticalPromise | undefined {
    const promise = this.getPromise(id);
    if (!promise) return undefined;
    const updatedPromise = { ...promise, ...updates };
    this.db.prepare('UPDATE promises SET status = ?, data = ? WHERE id = ?').run(updatedPromise.status, JSON.stringify(updatedPromise), id);
    return updatedPromise;
  }

  public getFulfillmentEvents(promiseId?: string): FulfillmentEvent[] {
    if (promiseId) {
      return this.db.prepare('SELECT data FROM fulfillmentEvents WHERE promiseId = ? ORDER BY timestamp DESC').all(promiseId).map((r: any) => JSON.parse(r.data));
    }
    return this.db.prepare('SELECT data FROM fulfillmentEvents ORDER BY timestamp DESC').all().map((r: any) => JSON.parse(r.data));
  }

  public createFulfillmentEvent(event: Omit<FulfillmentEvent, 'id'>): FulfillmentEvent {
    const newEvent: FulfillmentEvent = {
      ...event,
      id: `fevent-${Math.random().toString(36).substr(2, 9)}`
    };
    this.db.prepare('INSERT INTO fulfillmentEvents (id, promiseId, timestamp, data) VALUES (?, ?, ?, ?)').run(newEvent.id, newEvent.promiseId, newEvent.evaluatedAt, JSON.stringify(newEvent));
    this.log('INFO', 'Fulfillment Tracker', `Logged fulfillment event for promise ${newEvent.promiseId}. Status: ${newEvent.newStatus}`);
    return newEvent;
  }

  public getPromiseMetrics() {
    const promises = this.getPromises();
    const metrics = {
      total: promises.length,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    promises.forEach(p => {
      metrics.byStatus[p.status] = (metrics.byStatus[p.status] || 0) + 1;
      metrics.byCategory[p.category] = (metrics.byCategory[p.category] || 0) + 1;
    });

    return metrics;
  }


  // Metrics
  public getMetrics(): SystemMetrics {
    const logs = this.getCrawlLogs();
    const totalCrawls = logs.length;
    const successes = logs.filter(l => l.success).length;
    const successRate = totalCrawls > 0 ? (successes / totalCrawls) * 100 : 100;

    const jobs = this.getJobs();
    const activeJobsCount = jobs.filter(j => j.status === 'processing').length;
    const pendingJobsCount = jobs.filter(j => j.status === 'pending').length;
    const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
    const failedJobsCount = jobs.filter(j => j.status === 'failed').length;

    // Calc health of sources
    const sourceHealth: Record<string, 'healthy' | 'failing' | 'unknown'> = {};
    for (const src of this.getSources()) {
      const srcLogs = logs.filter(l => l.sourceId === src.id).slice(0, 5);
      if (srcLogs.length === 0) {
        sourceHealth[src.id] = 'unknown';
      } else {
        const failures = srcLogs.filter(l => !l.success).length;
        sourceHealth[src.id] = failures >= 3 ? 'failing' : 'healthy';
      }
    }

    const documentsIngested = this.db.prepare('SELECT count(*) as c FROM documents').get() as any;
    const duplicatesDetected = this.db.prepare('SELECT count(*) as c FROM duplicateRelations').get() as any;
    const changesDetected = this.db.prepare('SELECT count(*) as c FROM pageDiffs').get() as any;

    return {
      totalCrawls,
      successRate,
      activeJobsCount,
      pendingJobsCount,
      completedJobsCount,
      failedJobsCount,
      sourceHealth,
      documentsIngested: documentsIngested.c,
      duplicatesDetected: duplicatesDetected.c,
      changesDetected: changesDetected.c
    };
  }
}

export const db = new CivicDatabase();
export default db;
