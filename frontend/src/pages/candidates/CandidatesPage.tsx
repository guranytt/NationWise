import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getCandidates } from '../../api/candidates';
import type { Candidate } from '../../api/candidates';
import { StaggerContainer, StaggerItem } from '../../components/ui/StaggerReveal';
import CountUp from '../../components/ui/CountUp';

const getScoreColor = (score: number | null) => {
  if (score === null) return 'text-ink';
  if (score >= 75) return 'text-verified';
  if (score >= 50) return 'text-pending';
  return 'text-critical';
};

const getScoreBorder = (score: number | null) => {
  if (score === null) return 'border-rule';
  if (score >= 75) return 'border-verified';
  if (score >= 50) return 'border-pending';
  return 'border-critical';
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const data = await getCandidates({
          ...(stateFilter && { state: stateFilter }),
          ...(positionFilter && { position: positionFilter })
        });
        setCandidates(data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [stateFilter, positionFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 pb-4 border-b border-rule gap-4">
        <div>
          <h1 className="text-3xl font-serif text-ink">Election 2027 Registry</h1>
          <p className="text-ink opacity-70 font-sans mt-2 text-sm">Official candidate dossiers and verified metrics.</p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto font-sans text-sm">
          <select 
            className="px-3 py-1.5 border border-rule bg-transparent text-ink focus:outline-none focus:border-ink flex-1"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Kano">Kano</option>
            <option value="Rivers">Rivers</option>
          </select>
          <select 
            className="px-3 py-1.5 border border-rule bg-transparent text-ink focus:outline-none focus:border-ink flex-1"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
          >
            <option value="">All Positions</option>
            <option value="President">President</option>
            <option value="Governor">Governor</option>
            <option value="Senator">Senator</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-ink font-sans text-sm uppercase tracking-widest">
          Loading Registry...
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-rule">
          {candidates.map((candidate) => (
            <StaggerItem key={candidate.id} className="border-r border-b border-rule bg-paper group relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <Link to={`/candidates/${candidate.id}`} className="block p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="font-sans text-xs text-ink opacity-50">File No. {candidate.id.substring(0, 6).toUpperCase()}</span>
                  
                  {candidate.overall_score !== null && (
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${getScoreBorder(candidate.overall_score)}`}>
                      <span className={`font-sans font-bold text-sm ${getScoreColor(candidate.overall_score)}`}>
                        <CountUp end={candidate.overall_score} />
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {candidate.photo_url ? (
                     <img src={candidate.photo_url} alt={candidate.full_name} className="w-16 h-16 object-cover border border-rule grayscale group-hover:grayscale-0 transition-all duration-300" />
                  ) : (
                     <div className="w-16 h-16 border border-rule bg-paper flex items-center justify-center text-ink font-serif text-xl">
                       {candidate.full_name.charAt(0)}
                     </div>
                  )}
                  <div>
                    <h3 className="font-serif font-bold text-lg text-ink leading-tight">{candidate.full_name}</h3>
                    <div className="font-sans text-xs text-ink opacity-70 mt-1 uppercase tracking-wide">
                      {candidate.party}
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 space-y-1 font-sans text-xs text-ink">
                  <div><span className="font-semibold">Pos:</span> {candidate.position_sought}</div>
                  <div><span className="font-semibold">Loc:</span> {candidate.state}{candidate.lga ? `, ${candidate.lga}` : ''}</div>
                </div>

                <div className="mt-4 flex gap-2 flex-wrap font-sans text-[10px] uppercase tracking-wider">
                  <span className="border border-rule px-2 py-1">Verified Filing</span>
                  {candidate.overall_score !== null && <span className="border border-rule px-2 py-1">Scored</span>}
                </div>

                {/* Hover reveal element */}
                <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-sans text-xs font-semibold text-ink">
                  View File &rarr;
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
      {!loading && candidates.length === 0 && (
        <div className="text-center py-20 font-sans text-ink opacity-60">
          No records found matching your filters.
        </div>
      )}
    </div>
  );
}
