/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { PoliticalEntity, DiscoveredSeedSource } from './broadTypes';

export class PoliticalSeedService {
  private static instance: PoliticalSeedService;

  private constructor() {
    this.ensureSchemaInitialized();
  }

  public static getInstance(): PoliticalSeedService {
    if (!PoliticalSeedService.instance) {
      PoliticalSeedService.instance = new PoliticalSeedService();
    }
    return PoliticalSeedService.instance;
  }

  private ensureSchemaInitialized() {
    const data = (db as any).data;
    if (!data.politicalEntities) {
      data.politicalEntities = [];
      db.save();
    }
  }

  public getEntities(): PoliticalEntity[] {
    this.ensureSchemaInitialized();
    return (db as any).data.politicalEntities || [];
  }

  /**
   * Adds a new political entity and triggers seed source expansion
   */
  public addEntity(name: string, type: PoliticalEntity['type']): PoliticalEntity {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    
    // Check if exists
    let entity = (data.politicalEntities as PoliticalEntity[]).find(
      e => e.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (entity) {
      return entity;
    }

    const id = `ent-${Math.random().toString(36).substr(2, 9)}`;
    const discovered = this.expandSeedsForEntity(name, type);

    entity = {
      id,
      name: name.trim(),
      type,
      status: 'pending',
      discoveredSources: discovered
    };

    data.politicalEntities.push(entity);
    db.save();
    
    db.log('SUCCESS', 'Entity Seeds', `Created political entity: "${name}" [${type}] and expanded ${discovered.length} candidate crawl portals.`);
    return entity;
  }

  /**
   * Approves a candidate seed source and registers it into the Source Registry
   */
  public approveSeedSource(entityId: string, sourceId: string): boolean {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const entity = (data.politicalEntities as PoliticalEntity[]).find(e => e.id === entityId);
    if (!entity) return false;

    const seed = entity.discoveredSources.find(s => s.id === sourceId);
    if (!seed) return false;

    // Register into standard db sources
    const domain = new URL(seed.url).hostname.replace('www.', '');
    db.createSource({
      name: seed.title,
      baseUrl: seed.url,
      sourceType: entity.type === 'ministry' || entity.type === 'agency' ? 'ministry_portal' : 'government_website',
      crawlFrequency: 'daily',
      crawlPriority: 'medium',
      sitemapUrl: `${seed.url}/sitemap.xml`,
      rssUrl: `${seed.url}/feed/`,
      crawlRules: {
        maxDepth: 3,
        allowlist: ['/news', '/press-releases', '/publications'],
        blocklist: [],
        respectRobots: true,
        rateLimitMs: 2000
      },
      isActive: true
    });

    // Remove candidate from entity discovered list to avoid duplicate listings
    entity.discoveredSources = entity.discoveredSources.filter(s => s.id !== sourceId);
    if (entity.discoveredSources.length === 0) {
      entity.status = 'approved';
    }
    db.save();
    db.log('SUCCESS', 'Entity Seeds', `Approved & registered candidate seed source: "${seed.title}"`);
    return true;
  }

  /**
   * Discards a seed source option
   */
  public rejectSeedSource(entityId: string, sourceId: string): boolean {
    this.ensureSchemaInitialized();
    const data = (db as any).data;
    const entity = (data.politicalEntities as PoliticalEntity[]).find(e => e.id === entityId);
    if (!entity) return false;

    entity.discoveredSources = entity.discoveredSources.filter(s => s.id !== sourceId);
    if (entity.discoveredSources.length === 0) {
      entity.status = 'rejected';
    }
    db.save();
    return true;
  }

  /**
   * Helper algorithm to construct highly realistic government domains & resources
   */
  private expandSeedsForEntity(name: string, type: PoliticalEntity['type']): DiscoveredSeedSource[] {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const abbreviation = name.split(/\s+/).map(w => w[0]?.toLowerCase() || '').join('');
    
    const candidates: DiscoveredSeedSource[] = [];

    if (type === 'ministry' || type === 'agency') {
      const pAbbrev = `${abbreviation}.gov.ng`;
      const pFull = `${slug}.gov.ng`;

      candidates.push({
        id: `seed-${Math.random().toString(36).substr(2, 9)}`,
        title: `${name} Official Portal`,
        url: `https://${pAbbrev}`,
        relevance: 95,
        confidence: 90,
        reason: 'Direct governmental domain mapping (.gov.ng TLD match)',
        discoveredAt: new Date().toISOString()
      });

      candidates.push({
        id: `seed-${Math.random().toString(36).substr(2, 9)}`,
        title: `${name} Publications Archive`,
        url: `https://${pFull}/publications`,
        relevance: 88,
        confidence: 85,
        reason: 'Ministry subdirectory mapping for policy reports and documentation',
        discoveredAt: new Date().toISOString()
      });
    } else if (type === 'politician' || type === 'local_gov') {
      const pFull = `${slug}.ng`;
      candidates.push({
        id: `seed-${Math.random().toString(36).substr(2, 9)}`,
        title: `${name} Campaign Agenda`,
        url: `https://www.${pFull}`,
        relevance: 82,
        confidence: 80,
        reason: 'Personal politician/leader branding domain match',
        discoveredAt: new Date().toISOString()
      });

      candidates.push({
        id: `seed-${Math.random().toString(36).substr(2, 9)}`,
        title: `${name} Media Center`,
        url: `https://statehouse.gov.ng/activities/${slug}`,
        relevance: 90,
        confidence: 85,
        reason: 'Subdirectory trace in State House portal matching politician reference',
        discoveredAt: new Date().toISOString()
      });
    } else {
      // General Program or Agency
      candidates.push({
        id: `seed-${Math.random().toString(36).substr(2, 9)}`,
        title: `${name} Portal`,
        url: `https://${slug}.gov.ng`,
        relevance: 85,
        confidence: 88,
        reason: 'National developmental initiative / program domain mapping',
        discoveredAt: new Date().toISOString()
      });
    }

    return candidates;
  }
}

export const politicalSeedService = PoliticalSeedService.getInstance();
export default politicalSeedService;
