/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Copy, 
  ArrowRight, 
  Fingerprint, 
  Link2, 
  BarChart4, 
  HelpCircle,
  FileWarning
} from 'lucide-react';
import { DuplicateRelation, NormalizedDocument } from '../types';

interface DeduplicationHubProps {
  duplicates: DuplicateRelation[];
  documents: NormalizedDocument[];
}

export const DeduplicationHub: React.FC<DeduplicationHubProps> = ({ duplicates, documents }) => {
  const getDocTitle = (id: string) => {
    return documents.find(d => d.id === id)?.title || 'Deleted Document';
  };

  const getDocSourceName = (id: string) => {
    return documents.find(d => d.id === id)?.sourceName || 'Unknown';
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'exact_hash':
        return (
          <span className="inline-flex items-center gap-1 bg-[#21262D] text-[#8B949E] border border-[#2D333B] px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
            <Fingerprint className="h-3 w-3" /> Exact SHA-256 Hash
          </span>
        );
      case 'url_match':
        return (
          <span className="inline-flex items-center gap-1 bg-[#D29922]/15 text-[#E3B341] border border-[#D29922]/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
            <Link2 className="h-3 w-3" /> Mirror URL Match
          </span>
        );
      case 'text_similarity':
        return (
          <span className="inline-flex items-center gap-1 bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono">
            <BarChart4 className="h-3 w-3" /> Jaccard Similarity
          </span>
        );
      default:
        return <span className="bg-[#0B0E14] text-[#8B949E] px-2 py-0.5 rounded text-[9px] font-mono">{method}</span>;
    }
  };

  return (
    <div className="space-y-6" id="deduplication-hub-tab">
      <div>
        <h2 className="text-md font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          Similarity Deduplication Registry
        </h2>
        <p className="text-xs text-[#8B949E] font-mono mt-1">
          DEDUPLICATION ALGORITHMS MAPPING IDENTICAL RELEASES, CLONED PAGES, AND RE-POSTED ANNOUNCEMENTS.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex items-center gap-4">
          <span className="bg-[#0D1117] text-[#F85149] p-3 rounded border border-[#2D333B]">
            <Fingerprint className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[10px] text-[#8B949E] font-mono uppercase tracking-wider">Exact SHA-256 Dupes</div>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {duplicates.filter(d => d.detectionMethod === 'exact_hash').length}
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex items-center gap-4">
          <span className="bg-[#0D1117] text-[#E3B341] p-3 rounded border border-[#2D333B]">
            <Link2 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[10px] text-[#8B949E] font-mono uppercase tracking-wider">URL Cloned Pages</div>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {duplicates.filter(d => d.detectionMethod === 'url_match').length}
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex items-center gap-4">
          <span className="bg-[#0D1117] text-[#58A6FF] p-3 rounded border border-[#2D333B]">
            <BarChart4 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[10px] text-[#8B949E] font-mono uppercase tracking-wider">Near-Similarity Matches</div>
            <div className="text-xl font-bold text-white mt-1 font-mono">
              {duplicates.filter(d => d.detectionMethod === 'text_similarity').length}
            </div>
          </div>
        </div>
      </div>

      {/* Duplicates Mapping Grid */}
      <div className="space-y-4" id="duplicates-registry-list">
        <h3 className="text-xs font-mono font-bold text-[#58A6FF] uppercase tracking-wider flex items-center gap-1.5">
          <Copy className="h-4.5 w-4.5" /> Duplicate-To-Original Relationship Maps ({duplicates.length})
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {duplicates.map(rel => {
            const dupTitle = getDocTitle(rel.documentId);
            const dupSource = getDocSourceName(rel.documentId);
            const origTitle = getDocTitle(rel.duplicateOfId);
            const origSource = getDocSourceName(rel.duplicateOfId);

            return (
              <div key={rel.id} className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 hover:border-[#58A6FF]/40 transition-all" id={`rel-row-${rel.id}`}>
                {/* Left Side: Duplicate item */}
                <div className="flex-1 space-y-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[#F85149] uppercase tracking-wider bg-[#F85149]/10 px-1.5 py-0.5 rounded border border-[#F85149]/20">Cloned Ingestion</span>
                    <span className="text-[10px] text-[#8B949E]">#{rel.documentId.replace('doc-', '')}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs line-clamp-1">{dupTitle}</h4>
                  <p className="text-[10px] text-[#8B949E]">Source: <span className="text-[#E0E0E0]">{dupSource}</span></p>
                </div>

                {/* Center Transition: Similarity Score */}
                <div className="flex flex-col items-center justify-center bg-[#0D1117] px-4 py-2 rounded border border-[#2D333B] min-w-[150px] text-center shrink-0 self-center lg:self-auto">
                  <div className="text-[9px] font-bold text-[#3FB950] uppercase tracking-wider font-mono">Similarity</div>
                  <div className="text-base font-bold text-white mt-0.5 font-mono">{(rel.similarityScore * 100).toFixed(0)}% Match</div>
                  <div className="mt-1">{getMethodBadge(rel.detectionMethod)}</div>
                </div>

                {/* Right Side: Original parent document */}
                <div className="flex-1 space-y-1 lg:text-right w-full font-mono">
                  <div className="flex items-center lg:justify-end gap-2">
                    <span className="text-[9px] font-bold text-[#3FB950] uppercase tracking-wider bg-[#238636]/10 px-1.5 py-0.5 rounded border border-[#238636]/20">Canonical Parent</span>
                    <span className="text-[10px] text-[#8B949E]">#{rel.duplicateOfId.replace('doc-', '')}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs line-clamp-1">{origTitle}</h4>
                  <p className="text-[10px] text-[#8B949E]">Source: <span className="text-[#E0E0E0]">{origSource}</span></p>
                </div>
              </div>
            );
          })}

          {duplicates.length === 0 && (
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-12 text-center text-[#8B949E] font-mono text-xs">
              <FileWarning className="h-8 w-8 text-[#8B949E]/50 mx-auto mb-3" />
              [RELATIONS REGISTRY EMPTY] NO REDUNDANT DUPLICATE DOCUMENT PAIRS DETECTED YET.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
