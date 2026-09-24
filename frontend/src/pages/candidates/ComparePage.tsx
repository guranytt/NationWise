import { useState, useEffect } from 'react';
import { getCandidates } from '../../api/candidates';
import { fetchJson } from '../../api/client';
import GlassCard from '../../components/ui/GlassCard';
import { Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ComparePage() {
  const [candidates, setCandidates] = useState<{id: string, full_name: string}[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [question, setQuestion] = useState('Compare their education policies.');
  const [comparison, setComparison] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load simple candidate list for dropdown
    getCandidates().then(data => {
      setCandidates(data.map(c => ({ id: c.id, full_name: c.full_name })));
    });
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id && !selectedIds.includes(id) && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeCandidate = (id: string) => {
    setSelectedIds(selectedIds.filter(cId => cId !== id));
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setError('');
    setComparison('');
    try {
      const res = await fetchJson<{response: string}>('/adventure/compare', {
        method: 'POST',
        body: JSON.stringify({ candidate_ids: selectedIds, question })
      });
      setComparison(res.response);
    } catch (err) {
      setError('Failed to generate comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-nw-text-light dark:text-nw-text-dark">
          Compare Candidates
        </h1>
        <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted max-w-2xl mx-auto">
          Select up to three candidates and ask our AI to compare their policies, track record, or background based on their official documents.
        </p>
      </div>

      <GlassCard className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <label className="block text-sm font-medium mb-2 text-nw-text-light dark:text-nw-text-dark">Add Candidate</label>
            <select 
              className="input-field"
              onChange={handleSelect}
              value=""
              disabled={selectedIds.length >= 3}
            >
              <option value="" disabled>Select a candidate to compare...</option>
              {candidates.filter(c => !selectedIds.includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {selectedIds.map(id => {
              const c = candidates.find(cand => cand.id === id);
              return c ? (
                <div key={id} className="flex items-center px-4 py-2 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10">
                  <span className="text-sm font-medium">{c.full_name}</span>
                  <button onClick={() => removeCandidate(id)} className="ml-2 text-nw-text-light-muted hover:text-nw-danger transition-colors">&times;</button>
                </div>
              ) : null;
            })}
          </div>
        )}

        <div className="pt-4 border-t border-black/10 dark:border-white/10">
          <label className="block text-sm font-medium mb-2 text-nw-text-light dark:text-nw-text-dark">Comparison Topic</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              className="input-field flex-grow"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Compare their approach to national security"
            />
            <button 
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || !question.trim() || loading}
              className="btn-primary flex items-center whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Generate <Zap className="w-4 h-4 ml-2" /></>
              )}
            </button>
          </div>
        </div>
        
        {error && <p className="text-nw-danger text-sm">{error}</p>}
      </GlassCard>

      {comparison && (
        <GlassCard className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-black/10 dark:border-white/10">
            <Zap className="w-5 h-5 text-nw-primary dark:text-nw-primary-light" />
            <h2 className="font-display font-semibold text-lg">AI Comparison Analysis</h2>
          </div>
          <div className="prose dark:prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-li:my-1">
            <ReactMarkdown>{comparison}</ReactMarkdown>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
