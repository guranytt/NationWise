/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { scheduler } from './server/scheduler';
import { queueSystem } from './server/queue';
import { frontierService } from './server/broadFrontier';
import { politicalSeedService } from './server/broadSeeds';
import { broadScheduler } from './server/broadScheduler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // --- API ROUTES ---

  // Sources API
  app.get('/api/sources', (req, res) => {
    try {
      res.json(db.getSources());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sources', (req, res) => {
    try {
      const source = db.createSource(req.body);
      res.status(201).json(source);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/sources/:id', (req, res) => {
    try {
      const updated = db.updateSource(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/sources/:id', (req, res) => {
    try {
      const success = db.deleteSource(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/sources/:id/crawl', (req, res) => {
    try {
      const success = scheduler.triggerManualCrawl(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Source not found' });
      }
      res.json({ success: true, message: 'Crawl job successfully enqueued.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Jobs Queue API
  app.get('/api/jobs', (req, res) => {
    try {
      res.json(db.getJobs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/jobs/clear', (req, res) => {
    try {
      db.clearJobs();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Documents API
  app.get('/api/documents', (req, res) => {
    try {
      res.json(db.getDocuments());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/documents/:id', (req, res) => {
    try {
      const document = db.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      const versions = db.getVersions(document.id);
      const diffs = db.getDiffs(document.id);
      res.json({ document, versions, diffs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Duplicates API
  app.get('/api/duplicates', (req, res) => {
    try {
      res.json(db.getDuplicateRelations());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Metrics API
  app.get('/api/metrics', (req, res) => {
    try {
      res.json(db.getMetrics());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Audit Logs API
  app.get('/api/logs', (req, res) => {
    try {
      res.json(db.getAuditLogs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- BROAD CRAWL API ENDPOINTS ---

  // Frontier URLs
  app.get('/api/broad/frontier', (req, res) => {
    try {
      res.json(frontierService.getFrontierUrls());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/broad/frontier/add', (req, res) => {
    try {
      const { url, sourceUrl, depth } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Missing target URL parameter.' });
      }
      const added = frontierService.addUrl(url, sourceUrl || 'Manual Input', depth || 1);
      if (!added) {
        return res.status(400).json({ error: 'URL already exists or does not meet governmental relevance criteria.' });
      }
      res.status(201).json(added);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Domains Config
  app.get('/api/broad/domains', (req, res) => {
    try {
      res.json(frontierService.getDomainConfigs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/broad/domains/:domain', (req, res) => {
    try {
      const config = frontierService.getOrCreateDomainConfig(req.params.domain);
      if (req.body.dailyBudget !== undefined) config.dailyBudget = Number(req.body.dailyBudget);
      if (req.body.rateLimitMs !== undefined) config.rateLimitMs = Number(req.body.rateLimitMs);
      if (req.body.maxDepth !== undefined) config.maxDepth = Number(req.body.maxDepth);
      if (req.body.concurrencyLimit !== undefined) config.concurrencyLimit = Number(req.body.concurrencyLimit);
      db.save();
      db.log('INFO', 'Crawl Frontier', `Updated configs for domain: "${req.params.domain}"`);
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Entities & Seed Expansion
  app.get('/api/broad/entities', (req, res) => {
    try {
      res.json(politicalSeedService.getEntities());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/broad/entities', (req, res) => {
    try {
      const { name, type } = req.body;
      if (!name || !type) {
        return res.status(400).json({ error: 'Missing name or entity type parameters.' });
      }
      const entity = politicalSeedService.addEntity(name, type);
      res.status(201).json(entity);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/broad/entities/:entityId/approve/:sourceId', (req, res) => {
    try {
      const success = politicalSeedService.approveSeedSource(req.params.entityId, req.params.sourceId);
      if (!success) {
        return res.status(404).json({ error: 'Political entity or seed source not found.' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/broad/entities/:entityId/reject/:sourceId', (req, res) => {
    try {
      const success = politicalSeedService.rejectSeedSource(req.params.entityId, req.params.sourceId);
      if (!success) {
        return res.status(404).json({ error: 'Political entity or seed source not found.' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Broad Analytics
  app.get('/api/broad/analytics', (req, res) => {
    try {
      res.json(frontierService.getAnalytics());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PROMISES API ENDPOINTS ---

  app.get('/api/promises', (req, res) => {
    try {
      let promises = db.getPromises();
      
      const { status, category } = req.query;
      if (status) promises = promises.filter(p => p.status === status);
      if (category) promises = promises.filter(p => p.category === category);
      
      res.json(promises);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/promises/metrics', (req, res) => {
    try {
      res.json(db.getPromiseMetrics());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/promises/:id', (req, res) => {
    try {
      const promise = db.getPromise(req.params.id);
      if (!promise) return res.status(404).json({ error: 'Promise not found' });
      
      const events = db.getFulfillmentEvents(promise.id);
      res.json({ promise, events });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/promises/document/:docId', (req, res) => {
    try {
      const promises = db.getPromises().filter(p => p.documentId === req.params.docId);
      res.json(promises);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/promises/:id/override', (req, res) => {
    try {
      const { status, reasoning } = req.body;
      const promise = db.getPromise(req.params.id);
      if (!promise) return res.status(404).json({ error: 'Promise not found' });

      // Create a manual fulfillment event
      db.createFulfillmentEvent({
        promiseId: promise.id,
        documentId: 'manual_override',
        previousStatus: promise.status,
        newStatus: status,
        evidence: 'Manual status override by user.',
        reasoning: reasoning || 'Manual override',
        confidenceScore: 100,
        evaluatedAt: new Date().toISOString()
      });

      const updated = db.updatePromise(promise.id, { status, lastEvaluatedAt: new Date().toISOString() });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE INTERFACES SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 and port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CivicDataCrawler] Production-Ready Crawler server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
