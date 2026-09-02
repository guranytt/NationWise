/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import crypto from 'crypto';
import robotsParser from 'robots-parser';

interface CrawlResult {
  success: boolean;
  status: number;
  html: string;
  contentType: string;
  headers: Record<string, string>;
  responseTimeMs: number;
  errorMessage?: string;
  hash: string;
}

interface FeedEntry {
  url: string;
  title: string;
  publishedDate: string;
}

class CrawlerEngine {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CivicDataCrawler/1.0 (Nigeria Civic Accountability Project)';
  private robotsCache: Map<string, any> = new Map();

  // Generates true SHA-256 hash for strings
  private hashCode(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  public async isUrlAllowed(urlStr: string): Promise<boolean> {
    try {
      const urlObj = new URL(urlStr);
      const domain = `${urlObj.protocol}//${urlObj.host}`;
      
      if (!this.robotsCache.has(domain)) {
        const robotsUrl = `${domain}/robots.txt`;
        const response = await fetch(robotsUrl, {
          headers: { 'User-Agent': this.userAgent },
          signal: AbortSignal.timeout(5000)
        }).catch(() => null);
        
        let robotsTxt = '';
        if (response && response.ok) {
          robotsTxt = await response.text();
        }
        this.robotsCache.set(domain, robotsParser(robotsUrl, robotsTxt));
      }
      
      const robots = this.robotsCache.get(domain);
      return robots.isAllowed(urlStr, this.userAgent) !== false;
    } catch (e) {
      return true; // Default allow on parse error
    }
  }

  public async fetchRssFeed(url: string, sourceId: string): Promise<FeedEntry[]> {
    try {
      db.log('INFO', 'Crawler Engine', `Polling RSS Feed: ${url}`);
      const startTime = Date.now();
      
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000)
      }).catch(() => null);

      let xmlText = '';
      if (response && response.ok) {
        xmlText = await response.text();
      } else {
        db.log('WARN', 'Crawler Engine', `Network error or block polling RSS at ${url}. Skipping.`);
        return [];
      }

      return this.parseRssXml(xmlText, url);
    } catch (err: any) {
      db.log('ERROR', 'Crawler Engine', `Error polling RSS: ${err.message}`);
      throw err;
    }
  }

  public async fetchSitemap(url: string, sourceId: string): Promise<string[]> {
    try {
      db.log('INFO', 'Crawler Engine', `Parsing Sitemap XML: ${url}`);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000)
      }).catch(() => null);

      let xmlText = '';
      if (response && response.ok) {
        xmlText = await response.text();
      } else {
        db.log('WARN', 'Crawler Engine', `Network error or block fetching Sitemap at ${url}. Skipping.`);
        return [];
      }

      return this.parseSitemapXml(xmlText);
    } catch (err: any) {
      db.log('ERROR', 'Crawler Engine', `Error parsing sitemap: ${err.message}`);
      throw err;
    }
  }

  public async crawlWebPage(url: string, sourceId: string, jobId: string): Promise<CrawlResult> {
    const startTime = Date.now();
    db.log('INFO', 'Crawler Engine', `Crawling target URL: ${url}`);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(15000)
      }).catch(() => null);

      if (response && response.ok) {
        const html = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((val, key) => { headers[key] = val; });
        const contentType = response.headers.get('content-type') || 'text/html';

        return {
          success: true,
          status: response.status,
          html,
          contentType: contentType.includes('pdf') ? 'pdf' : 'html',
          headers,
          responseTimeMs: Date.now() - startTime,
          hash: this.hashCode(html)
        };
      } else {
        const code = response ? response.status : 503;
        db.log('WARN', 'Crawler Engine', `Scraping failed with HTTP ${code} or network block for ${url}.`);
        
        return {
          success: false,
          status: code,
          html: '',
          contentType: 'html',
          headers: {},
          responseTimeMs: Date.now() - startTime,
          errorMessage: `HTTP ${code} or network error`,
          hash: ''
        };
      }
    } catch (err: any) {
      db.log('ERROR', 'Crawler Engine', `Crawl exception for ${url}: ${err.message}`);
      return {
        success: false,
        status: 500,
        html: '',
        contentType: 'html',
        headers: {},
        responseTimeMs: Date.now() - startTime,
        errorMessage: err.message,
        hash: ''
      };
    }
  }

  // XML Parsers using RegExp to keep file lightweight & robust without heavy XML parser libraries
  private parseRssXml(xml: string, feedUrl: string): FeedEntry[] {
    const entries: FeedEntry[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemContent);
      const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemContent);
      const pubDateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i.exec(itemContent);

      if (titleMatch && linkMatch) {
        entries.push({
          url: titleMatch[1].trim() === 'Mock Title' ? linkMatch[1].trim() : linkMatch[1].trim(),
          title: titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
          publishedDate: pubDateMatch ? new Date(pubDateMatch[1].trim()).toISOString() : new Date().toISOString()
        });
      }
    }

    // Support Atom feed entry pattern too
    if (entries.length === 0) {
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entryContent = match[1];
        const titleMatch = /<title[\s\S]*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(entryContent);
        const linkMatch = /<link[\s\S]*?href=["']([\s\S]*?)["']/i.exec(entryContent);
        const updatedMatch = /<updated>([\s\S]*?)<\/updated>/i.exec(entryContent);

        if (titleMatch && linkMatch) {
          entries.push({
            url: linkMatch[1].trim(),
            title: titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
            publishedDate: updatedMatch ? new Date(updatedMatch[1].trim()).toISOString() : new Date().toISOString()
          });
        }
      }
    }

    return entries;
  }

  private parseSitemapXml(xml: string): string[] {
    const urls: string[] = [];
    const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
    let match;

    while ((match = locRegex.exec(xml)) !== null) {
      const url = match[1].trim();
      if (!url.endsWith('.xml')) { // Filter out sitemap index sub-xmls, but return page links
        urls.push(url);
      }
    }
    return urls;
  }

  // --- Offline Fallbacks & Simulations Removed ---
}

export const crawler = new CrawlerEngine();
export default crawler;
