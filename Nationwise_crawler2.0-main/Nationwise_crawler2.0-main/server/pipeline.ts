/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';
import { NormalizedDocument, ContentType } from '../src/types';
import crypto from 'crypto';

class PipelineEngine {
  // True SHA-256 hashing
  private getSha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  // Parses HTML tag removal, extracts title and clean content text
  private parseHtmlContent(html: string): { title: string; textContent: string; publishedDate?: string } {
    // Extract title
    const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(html);
    const title = titleMatch ? titleMatch[1].replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, ' ').trim() : 'Untitled Document';

    // Extract meta published date
    let publishedDate: string | undefined = undefined;
    const metaDateMatch = /<meta[^>]+(?:name|property)=["'](?:published-date|article:published_time|date)["'][^>]+content=["']([^"']+)["']/i.exec(html) ||
                          /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:published-date|article:published_time|date)["']/i.exec(html);
    if (metaDateMatch) {
      publishedDate = new Date(metaDateMatch[1]).toISOString();
    }

    // Strips tags, scripts, and styles
    let cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If title was pulled from some long text, clean it
    let cleanTitle = title.split('|')[0].trim();
    if (cleanTitle.length > 100) {
      cleanTitle = cleanTitle.substring(0, 97) + '...';
    }

    return {
      title: cleanTitle || 'Untitled Civic Record',
      textContent: cleaned,
      publishedDate
    };
  }

  // Calculates a relevance score focused on Nigerian civic accountability
  private calculateRelevance(text: string): number {
    const civicKeywords = [
      'budget', 'pension', 'promise', 'electoral', 'policy', 'allocation', 'education', 
      'health', 'disbursed', 'infrastructure', 'nigeria', 'abuja', 'statutory', 'governance',
      'commission', 'capital', 'fgn', 'investment', 'ministry', 'pensioners', 'reforms'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (civicKeywords.includes(cleanWord)) {
        count++;
      }
    });

    const frequencyRatio = count / Math.max(words.length, 1);
    // Base scale from 0 to 100
    const rawScore = (frequencyRatio * 2000) + (count * 2.5);
    return Math.min(Math.max(Math.round(rawScore), 5), 100);
  }

  // Jaccard similarity score for text comparison
  private getJaccardSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, '')).filter(w => w.length > 2));
    const set2 = new Set(text2.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, '')).filter(w => w.length > 2));

    if (set1.size === 0 || set2.size === 0) return 0;

    let intersectionSize = 0;
    set1.forEach(word => {
      if (set2.has(word)) intersectionSize++;
    });

    const unionSize = set1.size + set2.size - intersectionSize;
    return intersectionSize / unionSize;
  }

  public async normalize(
    url: string,
    rawContent: string,
    contentType: 'html' | 'pdf' | 'scanned_pdf' | 'text',
    sourceId: string,
    headers: Record<string, string>,
    defaultPublishDate?: string,
    defaultTitle?: string
  ): Promise<Omit<NormalizedDocument, 'id'>> {
    db.log('INFO', 'Pipeline Engine', `Normalizing content for ${url}`);

    const source = db.getSource(sourceId);
    const sourceName = source ? source.name : 'Unknown Source';

    let title = defaultTitle || 'Untitled Record';
    let textContent = rawContent;
    let publishedTimestamp = defaultPublishDate || new Date().toISOString();

    if (contentType === 'html') {
      const parsed = this.parseHtmlContent(rawContent);
      title = defaultTitle || parsed.title;
      textContent = parsed.textContent;
      if (parsed.publishedDate) {
        publishedTimestamp = parsed.publishedDate;
      }
    } else if (contentType === 'pdf') {
      // Simulate PDF parsing (with high-fidelity parsing lines)
      db.log('INFO', 'Pipeline Engine', `Extracting digital text from PDF publication: ${url}`);
      const textLines = rawContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      title = defaultTitle || (textLines.find(l => l.startsWith('TITLE:'))?.replace('TITLE:', '')?.trim()) || 'FGN PDF Publication';
      textContent = rawContent;
    } else if (contentType === 'scanned_pdf') {
      // OCR processing simulation placeholder
      db.log('INFO', 'Pipeline Engine', `PDF is scanned. Placeholder for OCR extraction: ${url}`);
      textContent = rawContent;
      title = defaultTitle || 'OCR Scanned Document';
    }

    const docHash = this.getSha256(textContent);
    const relevanceScore = this.calculateRelevance(textContent);

    return {
      title,
      sourceId,
      sourceName,
      url,
      fetchedTimestamp: new Date().toISOString(),
      publishedTimestamp,
      content: textContent,
      contentType,
      language: 'en', // Nigeria's official administrative language is English
      documentHash: docHash,
      crawlStatus: 'normalized',
      relevanceScore,
      isDuplicate: false
    };
  }

  public async deduplicate(doc: NormalizedDocument): Promise<{
    isDuplicate: boolean;
    duplicateOfId?: string;
    duplicateOfName?: string;
    similarityScore: number;
    detectionMethod: 'exact_hash' | 'url_match' | 'text_similarity';
  }> {
    db.log('INFO', 'Deduplication Engine', `Analyzing document [${doc.id}] for duplicate entities.`);
    const existingDocs = db.getDocuments().filter(d => d.id !== doc.id && !d.isDuplicate);

    // 1. Exact Hash Match
    const hashMatch = existingDocs.find(d => d.documentHash === doc.documentHash);
    if (hashMatch) {
      return {
        isDuplicate: true,
        duplicateOfId: hashMatch.id,
        duplicateOfName: hashMatch.title,
        similarityScore: 1.0,
        detectionMethod: 'exact_hash'
      };
    }

    // 2. Exact URL Match (Older fetched page has higher precedence)
    const urlMatch = existingDocs.find(d => d.url.toLowerCase().replace(/\/$/, '') === doc.url.toLowerCase().replace(/\/$/, ''));
    if (urlMatch) {
      return {
        isDuplicate: true,
        duplicateOfId: urlMatch.id,
        duplicateOfName: urlMatch.title,
        similarityScore: 1.0,
        detectionMethod: 'url_match'
      };
    }

    // 3. Text Similarity Comparison (Near-duplicates)
    let bestMatch: NormalizedDocument | null = null;
    let highestSim = 0;

    for (const otherDoc of existingDocs) {
      const sim = this.getJaccardSimilarity(doc.content, otherDoc.content);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatch = otherDoc;
      }
    }

    // Threshold of 85% similarity matches re-posted releases
    if (highestSim >= 0.82 && bestMatch) {
      return {
        isDuplicate: true,
        duplicateOfId: bestMatch.id,
        duplicateOfName: bestMatch.title,
        similarityScore: highestSim,
        detectionMethod: 'text_similarity'
      };
    }

    return {
      isDuplicate: false,
      similarityScore: highestSim,
      detectionMethod: 'text_similarity'
    };
  }

  public async diff(doc: NormalizedDocument) {
    db.log('INFO', 'Diff Engine', `Checking version history and generating page diffs for URL: ${doc.url}`);
    
    const previousVersions = db.getVersions(doc.id);
    const currentVerNum = previousVersions.length + 1;

    // Create current version node
    const currentVersion = db.createVersion({
      documentId: doc.id,
      title: doc.title,
      content: doc.content,
      documentHash: doc.documentHash,
      timestamp: doc.fetchedTimestamp,
      versionNumber: currentVerNum
    });

    // If there is an active previous version, calculate diffs
    if (previousVersions.length > 0) {
      const previousVersion = previousVersions[0];
      
      if (previousVersion.documentHash === doc.documentHash) {
        db.log('INFO', 'Diff Engine', `Document content is identical to version ${previousVersion.versionNumber}. No diff logged.`);
        return;
      }

      db.log('SUCCESS', 'Diff Engine', `Content change detected! Version ${previousVersion.versionNumber} -> ${currentVersion.versionNumber}`);
      
      const diffResults = this.generateTextDiff(previousVersion.content, currentVersion.content);

      db.createDiff({
        documentId: doc.id,
        previousVersionId: previousVersion.id,
        currentVersionId: currentVersion.id,
        diffContent: JSON.stringify(diffResults.chunks),
        addedLinesCount: diffResults.addedCount,
        removedLinesCount: diffResults.removedCount,
        timestamp: new Date().toISOString()
      });
    } else {
      db.log('INFO', 'Diff Engine', `Initialized version 1.0 for document "${doc.title}".`);
    }
  }

  // Dynamic sentence-by-sentence diffing engine (Pure TypeScript)
  private generateTextDiff(oldText: string, newText: string) {
    const oldSentences = oldText.split(/[.!?]+\s+/).map(s => s.trim()).filter(s => s.length > 0);
    const newSentences = newText.split(/[.!?]+\s+/).map(s => s.trim()).filter(s => s.length > 0);

    const oldSet = new Set(oldSentences);
    const newSet = new Set(newSentences);

    const chunks: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = [];
    let addedCount = 0;
    let removedCount = 0;

    // Direct match analysis
    oldSentences.forEach(s => {
      if (!newSet.has(s)) {
        chunks.push({ type: 'removed', text: s });
        removedCount++;
      } else {
        chunks.push({ type: 'unchanged', text: s });
      }
    });

    newSentences.forEach(s => {
      if (!oldSet.has(s)) {
        chunks.push({ type: 'added', text: s });
        addedCount++;
      }
    });

    return { chunks, addedCount, removedCount };
  }
}

export const pipeline = new PipelineEngine();
export default pipeline;
