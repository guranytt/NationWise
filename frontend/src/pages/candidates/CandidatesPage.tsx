import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCandidates, type Candidate } from '../../api/candidates';
import GlassCard from '../../components/ui/GlassCard';
import Badge from '../../components/ui/Badge';
import { Search, User, Filter } from 'lucide-react';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterParty, setFilterParty] = useState('');

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const data = await getCandidates();
      setCandidates(data);
    } catch (error) {
      console.error("Failed to load candidates", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          c.state.toLowerCase().includes(search.toLowerCase());
    const matchesParty = filterParty ? c.party === filterParty : true;
    return matchesSearch && matchesParty;
  });

  const uniqueParties = Array.from(new Set(candidates.map(c => c.party)));

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-3">
            Candidate Directory
          </h1>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted max-w-2xl">
            Explore AI-generated interactive profiles of political candidates based on their official documents.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
            <input 
              type="text" 
              placeholder="Search by name or state..." 
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
            <select 
              className="input-field pl-9 appearance-none"
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
            >
              <option value="">All Parties</option>
              {uniqueParties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-nw-primary/30 border-t-nw-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCandidates.map(candidate => (
            <Link key={candidate.id} to={`/candidates/${candidate.id}`}>
              <GlassCard hoverEffect className="h-full flex flex-col p-5">
                <div className="flex items-start justify-between mb-4">
                  {candidate.photo_url ? (
                    <img 
                      src={candidate.photo_url} 
                      alt={candidate.full_name} 
                      className="w-16 h-16 rounded-full object-cover border border-black/10 dark:border-white/10"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center">
                      <User className="w-8 h-8 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
                    </div>
                  )}
                  <Badge variant="primary">{candidate.party}</Badge>
                </div>
                
                <div className="mt-auto">
                  <h3 className="font-semibold text-lg text-nw-text-light dark:text-nw-text-dark line-clamp-1">
                    {candidate.full_name}
                  </h3>
                  <p className="text-sm text-nw-text-light-muted dark:text-nw-text-dark-muted mt-1">
                    {candidate.position_sought}
                  </p>
                  <div className="mt-3 text-xs text-nw-text-light-muted dark:text-nw-text-dark-muted flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    {candidate.state}{candidate.lga ? `, ${candidate.lga}` : ''}
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
          
          {filteredCandidates.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted">No candidates found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
