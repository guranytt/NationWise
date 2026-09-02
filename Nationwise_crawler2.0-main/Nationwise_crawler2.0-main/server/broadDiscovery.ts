/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { frontierService } from './broadFrontier';

export class LinkDiscoveryEngine {
  /**
   * Extracts and normalizes links from HTML content, then registers valid candidates to Crawl Frontier
   */
  public static discoverAndFeed(parentUrl: string, htmlContent: string, currentDepth: number = 1) {
    db.log('INFO', 'Link Discovery', `Analyzing page links on [${parentUrl}] (Current depth: ${currentDepth})`);
    
    let baseUri: URL;
    try {
      baseUri = new URL(parentUrl);
    } catch {
      db.log('ERROR', 'Link Discovery', `Invalid parent URL failed to initialize base URI: ${parentUrl}`);
      return;
    }

    // Extract all link matches using a robust href parser RegExp
    const hrefRegex = /href=["']([^"'\s>]+)/gi;
    const matches: string[] = [];
    let match;
    
    while ((match = hrefRegex.exec(htmlContent)) !== null) {
      matches.push(match[1]);
    }

    let discoveryCount = 0;
    const uniqueDiscovered = new Set<string>();

    for (const rawUrl of matches) {
      const normalized = this.normalizeUrl(baseUri, rawUrl);
      if (!normalized) continue;

      // Filter out anchors, query strings that are same path, or common asset files
      if (normalized.toLowerCase() === parentUrl.toLowerCase().replace(/\/$/, '')) {
        continue;
      }

      uniqueDiscovered.add(normalized);
    }

    // Send verified urls to frontier
    for (const candidateUrl of uniqueDiscovered) {
      const enrolled = frontierService.addUrl(candidateUrl, parentUrl, currentDepth + 1);
      if (enrolled) {
        discoveryCount++;
      }
    }

    db.log('SUCCESS', 'Link Discovery', `Link analysis completed for [${parentUrl}]. Discovered ${uniqueDiscovered.size} unique URLs. Enrolled ${discoveryCount} high-relevance targets into frontier.`);
  }

  /**
   * Normalizes URLs, handling relative links, query paths, and excluding media/junk assets.
   */
  public static normalizeUrl(baseUri: URL, rawUrl: string): string | null {
    // 1. Skip mailto, tel, javascript, anchors, etc.
    const junkProtocols = ['mailto:', 'tel:', 'javascript:', '#', 'sms:', 'data:', 'ftp:'];
    if (junkProtocols.some(p => rawUrl.toLowerCase().startsWith(p))) {
      return null;
    }

    // 2. Ignore typical media/asset extensions to protect crawlers budget
    const assetExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
      '.css', '.js', '.woff', '.woff2', '.ttf', '.eot',
      '.zip', '.tar', '.gz', '.mp4', '.mp3', '.avi', '.mov',
      '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.xml'
    ];
    if (assetExtensions.some(ext => rawUrl.toLowerCase().endsWith(ext))) {
      return null;
    }

    try {
      // 3. Resolve relative URLs using standard URL constructor
      const resolved = new URL(rawUrl, baseUri.toString());
      
      // Ensure we keep HTTP / HTTPS
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        return null;
      }

      // Remove fragment/hash anchors
      resolved.hash = '';

      const cleaned = resolved.toString().trim().replace(/\/$/, '');
      return cleaned;
    } catch {
      return null;
    }
  }
}
