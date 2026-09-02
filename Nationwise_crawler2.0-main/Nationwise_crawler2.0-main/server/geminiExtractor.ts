/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { PoliticalPromise, FulfillmentEvent, PromiseCategory, PromiseStatus } from '../src/types';
import db from './db';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';
const MAX_TEXT_LENGTH = 30000;

function truncateText(text: string): string {
  if (!text) return '';
  return text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) + '... [TRUNCATED]' : text;
}

export async function extractPromises(documentText: string, metadata: { documentId: string, sourceId: string, sourceName: string }): Promise<PoliticalPromise[]> {
  if (!process.env.GEMINI_API_KEY) {
    db.log('WARN', 'Gemini Extractor', 'GEMINI_API_KEY not set. Skipping promise extraction.');
    return [];
  }

  const prompt = `
You are an expert civic intelligence AI. Your task is to extract political promises, pledges, policy commitments, and announcements from government documents.
Read the following text and extract all promises. 

Important rules:
- Focus on extracting WHO made the promise (the specific PERSON, official, or leader) in the 'attributedTo' field, rather than just the institution.
- 'category' must be one of: 'infrastructure', 'education', 'health', 'economy', 'security', 'governance', 'agriculture', 'energy', 'technology_digital', 'youth_employment', 'other'.
- Return your answer as a JSON array of objects. Do not include markdown code blocks like \`\`\`json. Just raw JSON.

Schema per object:
{
  "title": "Short descriptive title of the promise",
  "description": "Full details of what was promised",
  "category": "category string",
  "attributedTo": "Specific person or official who made the promise",
  "promiseDate": "ISO date string when it was made, or null",
  "targetDate": "ISO date string for deadline, or null",
  "budgetAmount": "Financial figure mentioned, or null",
  "confidenceScore": number between 0 and 100 representing your confidence this is a real promise
}

Document Text (truncated):
${truncateText(documentText)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text || '[]';
    let extracted: any[] = [];
    try {
      extracted = JSON.parse(jsonText);
    } catch (e) {
      console.error('Failed to parse Gemini output as JSON:', jsonText);
      return [];
    }

    if (!Array.isArray(extracted)) {
      extracted = [extracted];
    }

    const promises: PoliticalPromise[] = extracted.map((p: any) => ({
      id: '', // Will be set by db
      documentId: metadata.documentId,
      sourceId: metadata.sourceId,
      sourceName: metadata.sourceName,
      title: p.title || 'Unknown Promise',
      description: p.description || '',
      category: p.category as PromiseCategory || 'other',
      attributedTo: p.attributedTo || metadata.sourceName,
      promiseDate: p.promiseDate || new Date().toISOString(),
      targetDate: p.targetDate,
      budgetAmount: p.budgetAmount,
      status: 'pending',
      confidenceScore: p.confidenceScore || 50,
      extractedAt: new Date().toISOString(),
      lastEvaluatedAt: new Date().toISOString()
    }));

    return promises;
  } catch (error: any) {
    db.log('ERROR', 'Gemini Extractor', `Failed to extract promises: ${error.message}`);
    return [];
  }
}

export async function evaluateFulfillment(promise: PoliticalPromise, newDocumentText: string, newDocumentId: string): Promise<FulfillmentEvent | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `
You are an expert civic intelligence AI.
Your task is to evaluate if a new government document provides evidence that an existing political promise has been fulfilled, progressed, broken, or stalled.

Existing Promise:
Title: ${promise.title}
Description: ${promise.description}
Category: ${promise.category}
Attributed To: ${promise.attributedTo}
Current Status: ${promise.status}

New Document Text (truncated):
${truncateText(newDocumentText)}

Analyze the new document and determine the new status of the promise.
Valid statuses: 'pending', 'in_progress', 'fulfilled', 'broken', 'stalled'.

Return a JSON object with this schema:
{
  "hasUpdate": boolean, // true ONLY if the document explicitly mentions progress, completion, failure, or updates related to this specific promise
  "newStatus": "status string", // The updated status
  "evidence": "Direct quote or strong summary from the document proving the status change",
  "reasoning": "Brief explanation of why the status changed based on the evidence",
  "confidenceScore": number between 0 and 100
}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const jsonText = response.text || '{}';
    let result: any = {};
    try {
      result = JSON.parse(jsonText);
    } catch (e) {
      return null;
    }

    if (result.hasUpdate && result.newStatus && result.newStatus !== promise.status) {
      const event: Omit<FulfillmentEvent, 'id'> = {
        promiseId: promise.id,
        documentId: newDocumentId,
        previousStatus: promise.status,
        newStatus: result.newStatus as PromiseStatus,
        evidence: result.evidence || '',
        reasoning: result.reasoning || '',
        confidenceScore: result.confidenceScore || 50,
        evaluatedAt: new Date().toISOString()
      };
      return event as FulfillmentEvent;
    }

    return null;
  } catch (error: any) {
    db.log('ERROR', 'Gemini Extractor', `Failed to evaluate fulfillment for promise ${promise.id}: ${error.message}`);
    return null;
  }
}
