/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  ExternalLink, 
  Layers, 
  Calendar, 
  ShieldAlert,
  ArrowRight,
  Eye,
  X,
  FileCode,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { NormalizedDocument, ContentType, DocumentVersion, PageDiff } from '../types';

interface DocLibraryProps {
  documents: NormalizedDocument[];
  onViewDoc: (id: string) => Promise<{ document: NormalizedDocument; versions: DocumentVersion[]; diffs: PageDiff[] }>;
}

export const DocLibrary: React.FC<DocLibraryProps> = ({ documents, onViewDoc }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');
  const [showDuplicates, setShowDuplicates] = useState<boolean>(false);

  // Selected document detail view states
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [detailDoc, setDetailDoc] = useState<NormalizedDocument | null>(null);
  const [docVersions, setDocVersions] = useState<DocumentVersion[]>([]);
  const [docDiffs, setDocDiffs] = useState<PageDiff[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Compare versions state
  const [diffVersionIndex, setDiffVersionIndex] = useState<number | null>(null);

  const filteredDocs = documents.filter(d => {
    const searchMatch = !searchTerm || d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.url.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'all' || d.contentType === filterType;
    const dupMatch = showDuplicates ? d.isDuplicate : !d.isDuplicate;
    return searchMatch && typeMatch && dupMatch;
  });

  const handleOpenDoc = async (id: string) => {
    setLoadingDetails(true);
    setSelectedDocId(id);
    setDiffVersionIndex(null);
    try {
      const data = await onViewDoc(id);
      setDetailDoc(data.document);
      setDocVersions(data.versions);
      setDocDiffs(data.diffs);
    } catch (err) {
      console.error('Failed to load document details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getDocTypeBadge = (type: ContentType) => {
    switch (type) {
      case 'html':
        return <span className="bg-[#21262D] text-[#8B949E] border border-[#2D333B] px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide">HTML</span>;
      case 'pdf':
        return <span className="bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide">PDF Doc</span>;
      case 'scanned_pdf':
        return <span className="bg-[#D29922]/20 text-[#E3B341] border border-[#D29922]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide">Scanned (OCR)</span>;
      case 'text':
        return <span className="bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide">Text</span>;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 75) return 'text-[#3FB950] bg-[#238636]/20 border border-[#238636]/30';
    if (score >= 40) return 'text-[#58A6FF] bg-[#58A6FF]/20 border border-[#58A6FF]/30';
    return 'text-[#8B949E] bg-[#21262D] border border-[#2D333B]';
  };

  // Parses stored diff JSON back to chunk structures
  const renderVersionDiff = (diff: PageDiff) => {
    try {
      const chunks: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = JSON.parse(diff.diffContent);
      return (
        <div className="space-y-2 mt-4 font-mono text-xs select-text">
          <div className="flex justify-between text-[11px] text-[#8B949E] pb-2 border-b border-[#2D333B]">
            <span>Diff Log: v{docVersions.length - 1} ➔ v{docVersions.length}</span>
            <span className="text-[#3FB950]">+{diff.addedLinesCount} insertions</span>
            <span className="text-[#F85149]">-{diff.removedLinesCount} deletions</span>
          </div>
          <div className="bg-[#010409] p-4 rounded border border-[#2D333B] max-h-72 overflow-y-auto space-y-1.5 leading-relaxed">
            {chunks.map((chunk, i) => {
              if (chunk.type === 'added') {
                return (
                  <div key={i} className="bg-[#238636]/10 text-[#7EE787] px-2.5 py-1 rounded border-l-2 border-[#3FB950]">
                    + {chunk.text}
                  </div>
                );
              } else if (chunk.type === 'removed') {
                return (
                  <div key={i} className="bg-[#F85149]/10 text-[#F85149] px-2.5 py-1 rounded border-l-2 border-[#F85149]">
                    - {chunk.text}
                  </div>
                );
              } else {
                return (
                  <div key={i} className="text-[#8B949E] px-2.5 py-0.5">
                    {chunk.text}
                  </div>
                );
              }
            })}
          </div>
        </div>
      );
    } catch (err) {
      return <div className="text-xs text-[#F85149] font-mono mt-2">Error rendering stored diff block.</div>;
    }
  };

  return (
    <div className="space-y-6" id="documents-library-tab">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-md font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Civic Document Library
          </h2>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            NORMALIZED INDEX OF RAW PUBLIC RECORDS. COMPARE PAGE SNAPSHOT HISTORY AND VIEW VISUAL DIFF CHANGES.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded p-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B949E]">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search by title or original URL..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#2D333B] rounded pl-9.5 pr-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58A6FF]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0" id="library-filters-group">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as ContentType | 'all')}
            className="bg-[#0B0E14] border border-[#2D333B] rounded px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58A6FF]"
          >
            <option value="all">All content types</option>
            <option value="html">HTML documents</option>
            <option value="pdf">Digital PDFs</option>
            <option value="scanned_pdf">OCR Scans</option>
          </select>

          <button
            onClick={() => setShowDuplicates(!showDuplicates)}
            className={`px-3.5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider select-none cursor-pointer transition-colors flex items-center gap-1.5 border ${showDuplicates ? 'bg-[#D29922]/20 text-[#E3B341] border-[#D29922]/30' : 'bg-[#0B0E14] text-[#8B949E] border-[#2D333B] hover:bg-[#21262D]'}`}
          >
            <ShieldAlert className="h-4 w-4" />
            {showDuplicates ? 'Viewing Duplicates' : 'Viewing Unique Docs'}
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="documents-grid">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-[#161B22] border border-[#2D333B] hover:border-[#58A6FF]/40 rounded p-5 transition-all flex flex-col justify-between" id={`doc-card-${doc.id}`}>
            <div>
              <div className="flex justify-between items-center gap-2 mb-3">
                {getDocTypeBadge(doc.contentType)}
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-tight uppercase flex items-center gap-1 border ${getRelevanceColor(doc.relevanceScore)}`} title="Nigerian Gov Ingestion Relevance score">
                  <Sparkles className="h-3 w-3 fill-current text-current" />
                  Score: {doc.relevanceScore}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-[#58A6FF] font-mono">
                {doc.title}
              </h3>

              <div className="mt-3 text-xs text-[#8B949E] flex items-center gap-1 font-mono tracking-wide truncate">
                <span className="text-[#8B949E] bg-[#0D1117] px-1.5 py-0.5 rounded border border-[#2D333B]">
                  {doc.sourceName}
                </span>
              </div>

              <div className="mt-3.5 space-y-1.5 text-[11px] font-mono text-[#8B949E] leading-relaxed">
                <div className="flex items-center gap-1.5 truncate">
                  <ExternalLink className="h-3 w-3 text-slate-600 flex-shrink-0" />
                  <a href={doc.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-[#58A6FF] truncate">{doc.url}</a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-600 flex-shrink-0" />
                  PUBLISHED: <span className="text-[#E0E0E0]">{new Date(doc.publishedTimestamp || doc.fetchedTimestamp).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenDoc(doc.id)}
              className="mt-5 w-full bg-[#21262D] hover:bg-[#30363D] text-white border border-[#2D333B] py-2 rounded text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer"
              id={`btn-view-doc-${doc.id}`}
            >
              <Eye className="h-3.5 w-3.5" /> Open Document Inspector
            </button>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full text-center py-16 bg-[#161B22] border border-[#2D333B] rounded font-mono text-xs text-[#8B949E]">
            <FileText className="h-8 w-8 text-[#8B949E]/55 mx-auto mb-3" />
            <span>
              [ARCHIVE EMPTY] NO NORMALIZED DOCUMENTS MATCH THE SELECTED FILTERS. RUN CRAWLS TO POPULATE.
            </span>
          </div>
        )}
      </div>

      {/* Document Inspector slide-over panel */}
      {selectedDocId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex justify-end animate-fade-in" id="doc-inspector-backdrop">
          <div className="w-full max-w-4xl bg-[#161B22] h-full border-l border-[#2D333B] shadow-2xl flex flex-col justify-between" id="doc-inspector-panel">
            {/* Slide Header */}
            <div className="p-5 border-b border-[#2D333B] flex justify-between items-center bg-[#0D1117]">
              <div>
                <span className="text-[10px] font-bold text-[#58A6FF] uppercase tracking-widest font-mono">Civic Document Inspector</span>
                <h3 className="text-sm font-bold text-white mt-1 line-clamp-1 font-mono">{detailDoc?.title || 'LOADING...'}</h3>
              </div>
              <button
                onClick={() => setSelectedDocId(null)}
                className="text-[#8B949E] hover:text-white hover:bg-[#21262D] p-1.5 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#8B949E] font-mono text-xs bg-[#0D1117]/40">
                <RefreshCw className="h-5 w-5 animate-spin text-[#58A6FF]" />
                Generating version history and comparing diff changes...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0D1117]/20">
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0D1117] p-4 rounded border border-[#2D333B] text-[11px] font-mono leading-relaxed">
                  <div className="space-y-1.5">
                    <div><span className="text-[#8B949E]">Document URL:</span> <a href={detailDoc?.url} target="_blank" rel="noreferrer" className="text-[#58A6FF] hover:underline inline-flex items-center gap-1 truncate max-w-xs">{detailDoc?.url} <ExternalLink className="h-3 w-3" /></a></div>
                    <div><span className="text-[#8B949E]">Source:</span> <span className="text-white font-medium">{detailDoc?.sourceName}</span></div>
                    <div><span className="text-[#8B949E]">SHA-256 Hash:</span> <span className="text-[#8B949E] font-mono break-all">{detailDoc?.documentHash}</span></div>
                  </div>
                  <div className="space-y-1.5">
                    <div><span className="text-[#8B949E]">Classification:</span> <span className="text-white uppercase font-bold">{detailDoc?.contentType}</span></div>
                    <div><span className="text-[#8B949E]">Ingested At:</span> <span className="text-white">{new Date(detailDoc?.fetchedTimestamp || '').toLocaleString()}</span></div>
                    <div><span className="text-[#8B949E]">Relevance Score:</span> <span className="text-[#3FB950] font-bold">{detailDoc?.relevanceScore}/100</span></div>
                  </div>
                </div>

                {/* Versions selection for diff comparison */}
                {docVersions.length > 0 && (
                  <div className="space-y-3" id="version-history-panel">
                    <h4 className="text-[10px] font-bold text-[#58A6FF] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Layers className="h-4 w-4" /> Version Control History & Page Diffs ({docVersions.length})
                    </h4>
                    
                    {/* Versions Timeline list */}
                    <div className="flex flex-wrap gap-2">
                      {docVersions.map((ver, idx) => (
                        <button
                          key={ver.id}
                          onClick={() => setDiffVersionIndex(idx)}
                          className={`px-3 py-2 rounded border text-left transition-all cursor-pointer font-mono ${diffVersionIndex === idx ? 'bg-[#238636]/10 border-[#238636] text-[#3FB950]' : 'bg-[#0B0E14] border-[#2D333B] text-[#8B949E] hover:border-[#8B949E]/40'}`}
                        >
                          <div className="font-bold text-[10px] uppercase tracking-wide">Version {ver.versionNumber.toFixed(1)}</div>
                          <div className="text-[9px] text-[#8B949E] mt-0.5">{new Date(ver.timestamp).toLocaleDateString()}</div>
                        </button>
                      ))}
                    </div>

                    {/* Diff viewer */}
                    {diffVersionIndex !== null && docDiffs[diffVersionIndex] ? (
                      renderVersionDiff(docDiffs[diffVersionIndex])
                    ) : diffVersionIndex !== null && diffVersionIndex === docVersions.length - 1 ? (
                      <div className="bg-[#010409] border border-[#2D333B] p-5 rounded text-center text-xs text-[#8B949E] font-mono">
                        [INITIAL SNAPSHOT REVISION v1.0] This is the base ingestion snapshot. No previous version exists to compare diffs.
                      </div>
                    ) : (
                      <div className="bg-[#010409] border border-[#2D333B] p-3 rounded text-[11px] text-[#8B949E] font-mono">
                        ➔ Select any version above to inspect incremental line diff calculations.
                      </div>
                    )}
                  </div>
                )}

                {/* Normalized text content content display */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-[#58A6FF] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <FileCode className="h-4 w-4" /> Full Normalized text Content
                  </h4>
                  <div className="bg-[#010409] p-4 rounded border border-[#2D333B] font-mono text-xs text-[#E0E0E0] overflow-y-auto max-h-96 leading-relaxed select-text whitespace-pre-wrap">
                    {detailDoc?.content}
                  </div>
                </div>
              </div>
            )}

            {/* Slide Footer */}
            <div className="p-4 border-t border-[#2D333B] flex justify-end bg-[#0D1117]">
              <button
                onClick={() => setSelectedDocId(null)}
                className="bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white px-5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer select-none"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
