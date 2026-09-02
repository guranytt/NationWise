# Civic Data Ingestion & Crawl Pipeline System

A production-ready, modular, and traceable broad crawl and data ingestion system tailored for official Nigerian government sources (State House, Ministry Portals, Budget Offices, and statutory commissions). This system forms the foundational, high-fidelity data layer for future civic accountability programs and AI-powered promise extraction.

Focus Areas: Source Traceability, Raw Evidence Preservation, Near-Duplicate Mapping, and Version-by-Version Diffing.

##  System Architecture

The pipeline is split into independent, highly modular layers communicating via well-defined data definitions:

```
                       SOURCE REGISTRY 
                              │
                       SYSTEM SCHEDULER 
                              │
                     ASYNC WORKERS QUEUE 
                              │
                     CRAWLER ENGINE (fetch) 
                    ├── Sitemap Discovery
                    └── RSS Feed Ingestion
                              │
               DOCUMENT PROCESSING PIPELINE 
              ├── 1. Normalization (Schema mapping)
              ├── 2. OCR (Scanned PDF extraction)
              ├── 3. Deduplication (SHA-256 + Similarity)
              └── 4. Version Diffing (Character-by-sentence)
                              │
                         DATABASE / S3 
```

### Core Ingest pipeline Modules
1. Source Registry: Full CRUD administration for approved government portals. Each source defines customized crawl priority, frequency, path allowlists, blocklists, sitemaps, and RSS feed endpoints.
2. Scheduled Crawlers: Background ticker checking active sources. Enqueues job tokens (`crawl_source`) to the Queue instead of processing directly.
3. Queue & Workers: Asynchronous processing loop that handles jobs, status shifts (pending ➔ processing ➔ completed/failed), retries with backoff, and isolates failures into a Dead-Letter Queue (DLQ).
4. Crawler Engine: Custom HTTP fetch client with modern browser user-agent and timeout triggers. Integrates a **high-fidelity civic simulator** as a robust fallback in case of CORS blocks, HTTP 403, or offline network environments.
5. Document Normalization: Maps raw scraping files into a uniform JSON schema complete with fetched timestamps, source names, document hashes, and a civic interest **relevance score** (calculating keyword frequencies like budget, pension, allocation, and reforms).
6. Deduplication Hub: Avoids redundant processing while preserving relationships. Utilizes exact hash checks, URL normalization, and a **Jaccard Similarity coefficient** to group near-duplicates (e.g. re-posted press releases).
7. Version Diff Engine: Analyzes historic changes for target URLs. If a modified page is crawled, it logs a new version and computes sentence-by-sentence insertions (`+`) and deletions (`-`) to render side-by-side diff comparisons.


## 📂 Modular Folder Structure

Every file adheres strictly to single-responsibility bounds, maintaining clean boundaries and staying **well under the 600 line limit**:

`/src/types.ts`: Shared TypeScript contracts, interfaces, and enums for Sources, QueueJobs, Documents, and System Metrics.
`/server/db.ts`: Persistent relational database coordinator. Saves/loads state atomically from `/data/db.json` and seeds original Nigerian Government platforms. Exposes structured logging.
`/server/queue.ts`: Asynchronous worker thread manager. Directs state progression and enqueues cascading pipeline stages.
  `/server/crawler.ts`: XML parser for Sitemap hierarchy and RSS feeds. Outlines HTTP operations and fallback content.
  `/server/pipeline.ts`: Normalizer, OCR text simulation, Jaccard similarity scorer, and sentence-by-sentence diff generator.
  `/server/scheduler.ts`: Interval timer looking for due dates and dispatching `crawl_source` triggers.
  `/server.ts`: Express REST API endpoints exposing data registries to the frontend and hosting Vite middleware.
`/src/components/`: Modular visualization tabs:
`Overview.tsx`: Streaming Audit Logs, pipeline success stats, queue health, and source health checks.
`SourceRegistry.tsx`: CRUD forms, custom crawl rules, and manual execution triggers.
`QueueMonitor.tsx`: Live worker thread visualizer with status filters and error logs.
   `DocLibrary.tsx`: normalized archive and Slide-Over inspector showing version history timeline and green/red line diffs.
   `DeduplicationHub.tsx`: Duplicate-to-canonical relationship mapping showing similarity scores.

## ⚙️ Configuration & Environment

Configuration is driven cleanly by environment variables outlined in `.env.example`:

`PORT`: Hardcoded by infrastructure to `3000` (externally routed via Nginx).
`GEMINI_API_KEY`: Server-only API key for the @google/genai SDK (reserved for future Promise Extraction pipelines).
`APP_URL`: Root domain injected dynamically by the Cloud Run runtime.

## 🚀 How to Run and Test

### 1. Developer Start
Boots the full-stack Express server alongside the hot-swappable Vite middleware.
```bash
npm run dev
```

### 2. Live Testing
* Navigate to Source Registry to view seeded Nigerian government sources.
* Click Run Crawl on "State House, Abuja" or "Budget Office".
* Head to Workers Queue to watch workers pull, crawl, parse sitemaps, extract, normalize, and deduplicate in real-time.
* Look at **Pipeline Overview** to see streaming console logs detailing exact database transactions.
* Open the **Document Library** and click **Open Document Inspector** on any ingested page to compare versions and inspect line-by-line colored diffs!
