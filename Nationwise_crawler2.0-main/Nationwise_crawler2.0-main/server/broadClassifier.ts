/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './db';

export class GovernmentRelevanceClassifier {
  private static GOVERNMENT_TLDS = ['.gov.ng', '.gov', '.mil.ng', '.edu.ng', '.org.ng'];
  
  private static BUDGET_KEYWORDS = [
    'budget', 'allocation', 'capital expenditure', 'fiscal', 'appropriation', 
    'spending', 'audit', 'revenue', 'treasury', 'disbursed', 'procurement',
    'fgn', 'financial', 'pension', 'salary', 'allowance'
  ];

  private static POLICY_KEYWORDS = [
    'policy', 'directive', 'executive order', 'regulation', 'gazette', 
    'decree', 'reform', 'legislation', 'bill', 'act', 'constitution',
    'treaty', 'charter', 'guideline', 'circular'
  ];

  private static MINISTRY_KEYWORDS = [
    'ministry', 'department', 'agency', 'commission', 'authority', 
    'bureau', 'board', 'federation', 'federal', 'parastatal', 'secretariat',
    'tribunal', 'council', 'house of assembly', 'national assembly', 'senate'
  ];

  private static POLITICIAN_KEYWORDS = [
    'bola tinubu', 'tinubu', 'shettima', 'akpabio', 'godswill akpabio', 
    'tajudeen abbas', 'wike', 'fashola', 'dangote', 'obasanjo', 'buhari',
    'jonathan', 'yaradua', 'peter obi', 'atiku', 'soludo', 'sanwo-olu'
  ];

  private static OFFICE_HOLDER_KEYWORDS = [
    'president', 'vice president', 'minister', 'governor', 'senator', 
    'representative', 'chairman', 'commissioner', 'director general', 
    'permanent secretary', 'speaker', 'justice', 'chief judge'
  ];

  private static PRESS_KEYWORDS = [
    'press release', 'statement', 'briefing', 'news', 'communique', 
    'circular', 'announcement', 'address', 'speech', 'remarks'
  ];

  /**
   * Evaluates a URL and its title to estimate initial relevance and confidence
   */
  public static scoreUrlAndTitle(url: string, title?: string): { relevanceScore: number; confidenceScore: number } {
    const urlLower = url.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const combined = `${urlLower} ${titleLower}`;

    let score = 0;
    let confidence = 50; // default baseline

    // Rule 1: Government TLD multiplier
    const isGovTLD = this.GOVERNMENT_TLDS.some(tld => urlLower.includes(tld));
    if (isGovTLD) {
      score += 35;
      confidence += 15;
    }

    // Rule 2: Keyword scanning with weights
    let matchesCount = 0;

    this.BUDGET_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 12; matchesCount++; }
    });

    this.POLICY_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 10; matchesCount++; }
    });

    this.MINISTRY_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 8; matchesCount++; }
    });

    this.POLITICIAN_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 15; matchesCount++; }
    });

    this.OFFICE_HOLDER_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 10; matchesCount++; }
    });

    this.PRESS_KEYWORDS.forEach(kw => {
      if (combined.includes(kw)) { score += 6; matchesCount++; }
    });

    // Score adjustments
    if (matchesCount > 0) {
      confidence += Math.min(matchesCount * 5, 25);
    } else if (!isGovTLD) {
      // If not a gov TLD and no keywords found, it is likely low relevance
      score = Math.max(score - 15, 0);
      confidence -= 10;
    }

    // Penalize commercial, social or non-civic typical patterns in broad crawls
    const noiseKeywords = ['facebook.com', 'twitter.com', 'youtube.com', 'instagram.com', 'linkedin.com', 'wp-content', 'wp-uploads', 'category', 'tag', 'login', 'signup', 'checkout'];
    const hasNoise = noiseKeywords.some(noise => urlLower.includes(noise));
    if (hasNoise) {
      score = Math.max(score - 40, 5);
      confidence = Math.max(confidence - 25, 20);
    }

    // Cap values strictly between 0 and 100
    const finalRelevance = Math.min(Math.max(Math.round(score), 5), 100);
    const finalConfidence = Math.min(Math.max(Math.round(confidence), 10), 100);

    return {
      relevanceScore: finalRelevance,
      confidenceScore: finalConfidence
    };
  }

  /**
   * Performs high-fidelity scoring using crawled body content text
   */
  public static scoreContent(text: string): { relevanceScore: number; confidenceScore: number } {
    const textLower = text.toLowerCase();
    let score = 5; // base
    let matchesCount = 0;

    // We scan text block for exact keyword densities
    const countOccurrences = (str: string, word: string) => {
      let count = 0;
      let pos = str.indexOf(word);
      while (pos !== -1) {
        count++;
        pos = str.indexOf(word, pos + word.length);
      }
      return count;
    };

    // Category multipliers
    let budgetOccurrences = 0;
    this.BUDGET_KEYWORDS.forEach(kw => {
      const occurrences = countOccurrences(textLower, kw);
      if (occurrences > 0) {
        budgetOccurrences += occurrences;
        matchesCount++;
      }
    });
    score += Math.min(budgetOccurrences * 4, 30); // max 30 points for budget density

    let policyOccurrences = 0;
    this.POLICY_KEYWORDS.forEach(kw => {
      const occurrences = countOccurrences(textLower, kw);
      if (occurrences > 0) {
        policyOccurrences += occurrences;
        matchesCount++;
      }
    });
    score += Math.min(policyOccurrences * 3, 25);

    let ministryOccurrences = 0;
    this.MINISTRY_KEYWORDS.forEach(kw => {
      const occurrences = countOccurrences(textLower, kw);
      if (occurrences > 0) {
        ministryOccurrences += occurrences;
        matchesCount++;
      }
    });
    score += Math.min(ministryOccurrences * 2.5, 20);

    let entityOccurrences = 0;
    this.POLITICIAN_KEYWORDS.forEach(kw => {
      const occurrences = countOccurrences(textLower, kw);
      if (occurrences > 0) {
        entityOccurrences += occurrences;
        matchesCount++;
      }
    });
    score += Math.min(entityOccurrences * 5, 25);

    let officeOccurrences = 0;
    this.OFFICE_HOLDER_KEYWORDS.forEach(kw => {
      const occurrences = countOccurrences(textLower, kw);
      if (occurrences > 0) {
        officeOccurrences += occurrences;
        matchesCount++;
      }
    });
    score += Math.min(officeOccurrences * 3, 20);

    // Limit extreme score
    const finalRelevance = Math.min(Math.max(Math.round(score), 5), 100);
    const confidence = Math.min(Math.max(50 + (matchesCount * 4), 30), 100);

    return {
      relevanceScore: finalRelevance,
      confidenceScore: confidence
    };
  }
}
